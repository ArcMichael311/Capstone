import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const configuredBackendUrl = process.env.REACT_APP_BACKEND_URL;
const defaultBackendUrl = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080'
  : 'https://phonexis-backend.onrender.com';

const backendUrl = (configuredBackendUrl || defaultBackendUrl).replace(/\/$/, '');
export const isLocalDevelopment = process.env.NODE_ENV === 'development';

// Render's free plan puts the backend to sleep when idle and waking it takes up to a minute.
// Ping it as soon as the site loads so it is awake by the time the user presses "Sign in".
// ('no-cors': we only need the request to arrive, not to read the answer.)
export const wakeBackend = () => fetch(`${backendUrl}/health`, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' }).catch(() => null);
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  void wakeBackend();
}

// Fired when the backend rejects our session (it expired, or this account signed in on
// another device). App.js listens for it and returns to the login screen.
export const SESSION_ENDED_EVENT = 'phonexis:session-ended';
export const LOGOUT_REASON_KEY = 'phonexis_logout_reason';
let memoryDeviceId = '';
let memoryAccessToken = '';

// The backend session token is kept in localStorage (like the Supabase session) so it
// survives page refreshes, new tabs and browser restarts. It expires server-side after
// 8 hours and is revoked on logout.
const ACCESS_TOKEN_KEY = 'phonexis_access_token';

const getAccessToken = () => {
  if (memoryAccessToken) return memoryAccessToken;
  try {
    memoryAccessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
      || window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
      || '';
  } catch (error) {
    memoryAccessToken = '';
  }
  return memoryAccessToken;
};

const setAccessToken = (token) => {
  memoryAccessToken = token || '';
  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    if (memoryAccessToken) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, memoryAccessToken);
    } else {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    // In-memory storage remains available when browser storage is blocked.
  }
};

export const hasBackendSession = () => !!getAccessToken();

// The logged-in user's profile (role, backend id, name), remembered so a page refresh can show
// the right dashboard instantly while the session is re-checked in the background. It is only
// used together with a backend session token and is removed whenever that session ends.
const PROFILE_CACHE_KEY = 'phonexis_profile_cache';

export const readCachedProfile = () => {
  if (!getAccessToken()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    const profile = raw ? JSON.parse(raw) : null;
    return profile && profile.email ? profile : null;
  } catch (error) {
    return null;
  }
};

export const writeCachedProfile = (profile) => {
  try {
    if (profile && profile.email) {
      window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      window.localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch (error) {
    // ignore storage errors
  }
};

export const clearBackendSession = () => {
  setAccessToken('');
  writeCachedProfile(null);
};

const createDeviceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `phonexis-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getDeviceId = () => {
  if (typeof window === 'undefined') {
    return memoryDeviceId || (memoryDeviceId = createDeviceId());
  }

  const storageKey = 'phonexis_session_id';
  try {
    const existingId = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey);
    if (existingId) {
      window.localStorage.setItem(storageKey, existingId);
      return existingId;
    }

    const generatedId = createDeviceId();
    window.localStorage.setItem(storageKey, generatedId);
    window.sessionStorage.setItem(storageKey, generatedId);
    return generatedId;
  } catch (error) {
    try {
      const fallbackId = window.sessionStorage.getItem(storageKey);
      if (fallbackId) {
        return fallbackId;
      }
    } catch (storageError) {
      // Storage can be blocked by private browsing or browser policy.
    }
    return memoryDeviceId || (memoryDeviceId = createDeviceId());
  }
};

export const getSessionDeviceId = getDeviceId;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

const readBackendError = async (response) => {
  try {
    const payload = await response.json();
    return {
      message: payload?.message || payload?.error || 'Backend request failed',
      status: response.status,
    };
  } catch (error) {
    return { message: 'Backend request failed', status: response.status };
  }
};

export const isBackendUnavailable = (error) => error?.message === 'Backend unavailable';

// Headers sent with every backend call. The session token travels in the
// Authorization header (not a cookie), so cross-site cookie blocking can't break login.
const buildAuthHeaders = (extraHeaders = {}) => {
  const token = getAccessToken();
  return {
    'X-Device-Id': getDeviceId(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// fetch() only throws when the request never got a response: the backend is down/asleep,
// the URL is wrong, or the browser blocked it because of CORS (the website's URL is not in
// the backend's FRONTEND_URL setting). Safe (idempotent) requests are retried once, which
// also covers Render's free tier waking up from sleep.
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [2500, 6000];
// Login and the session heartbeat only (re)create the caller's own session, so they are
// safe to repeat like GET/PUT. Other POSTs (e.g. game scores) are not retried.
const SAFE_POST_PATHS = ['/api/auth/login', '/api/auth/verify-device'];

const fetchWithRetry = async (url, init, path) => {
  const method = String(init.method || 'GET').toUpperCase();
  const canRetry = method === 'GET' || method === 'PUT' || SAFE_POST_PATHS.includes(path);

  for (let attempt = 0; ; attempt += 1) {
    const isLastAttempt = !canRetry || attempt >= RETRY_DELAYS_MS.length;
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(url, init);
      if (isLastAttempt || !RETRYABLE_STATUS.has(response.status)) {
        return response;
      }
    } catch (error) {
      if (isLastAttempt) {
        throw error;
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await wait(RETRY_DELAYS_MS[attempt]);
  }
};

const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/supabase-login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

const requestToBackend = async (path, options = {}) => {
  const url = `${backendUrl}${path}`;
  const hadSession = !!getAccessToken();
  // Without a session the backend would answer 401 anyway (e.g. a background refresh that runs
  // right after the session ended). Skip the request instead of filling the console with errors.
  if (!hadSession && !PUBLIC_API_PATHS.includes(path)) {
    return { data: null, error: { message: 'Not logged in', status: 401 } };
  }
  try {
    const { headers: extraHeaders, ...restOptions } = options;
    const response = await fetchWithRetry(url, {
      ...restOptions,
      credentials: 'omit',
      headers: buildAuthHeaders({
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(extraHeaders || {}),
      }),
    }, path);

    if (!response.ok) {
      if (response.status === 401) {
        // Token missing, expired or replaced by a newer login: drop it so the user logs in again.
        clearBackendSession();
        if (hadSession && path !== '/api/auth/login' && typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem(LOGOUT_REASON_KEY,
              'Your session ended (no activity for 10 minutes, or it expired). Please log in again.');
          } catch (storageError) {
            // ignore storage errors
          }
          window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
        }
      }
      const backendError = await readBackendError(response);
      return {
        data: null,
        error: backendError,
      };
    }

    const responseText = await response.text();
    let data = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      // Usually REACT_APP_BACKEND_URL points at the website instead of the backend (HTML comes back).
      console.error(`[Phonexis] ${url} did not return JSON. Check REACT_APP_BACKEND_URL (currently ${backendUrl}).`);
      return { data: null, error: { message: 'Backend unavailable' } };
    }
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
    }
    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error(
      `[Phonexis] Could not reach the backend at ${url}. Either the backend is down, or it blocks `
      + `this website (CORS): its FRONTEND_URL setting must include ${typeof window !== 'undefined' ? window.location.origin : 'this site'}.`,
      error,
    );
    return {
      data: null,
      error: { message: 'Backend unavailable' },
    };
  }
};

const postToBackend = async (path, body) => requestToBackend(path, {
  method: 'POST',
  body: JSON.stringify(body),
});

const getFromBackend = async (path) => requestToBackend(path, { method: 'GET' });

const putToBackend = async (path, body) => requestToBackend(path, {
  method: 'PUT',
  body: JSON.stringify(body),
  // Lets a progress save finish even if the tab is being closed.
  keepalive: true,
});

const getNameParts = (user, profile = {}) => {
  const emailName = (user?.email || '').split('@')[0].replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const firstname = profile.firstname || user?.user_metadata?.firstname || user?.user_metadata?.firstName || user?.firstName || emailName || 'Student';
  const lastname = profile.lastname || user?.user_metadata?.lastname || user?.user_metadata?.lastName || user?.lastName || 'User';
  return { firstname, lastname };
};

const isConflictError = (message) => /already exists|conflict|duplicate/i.test(message || '');
// The backend answers 401 for both "wrong password" and "no such account" (so attackers
// can't discover which emails exist). After Supabase has already verified the password,
// a 401 here means the backend account is missing, so we try to register it.
const isAccountNotFoundError = (error) => error?.status === 401 || error?.status === 404 || /account not found|user not found/i.test(error?.message || '');

const syncBackendUser = async (user, password, profile = {}) => {
  if (!user?.email || !password) {
    return { data: null, error: null };
  }

  const { firstname, lastname } = getNameParts(user, profile);
  const role = profile.role || user?.user_metadata?.role || user?.role || 'student';

  const payload = {
    firstname,
    lastname,
    email: user.email,
    password,
    role,
    deviceId: '',
  };

  // Preferred: hand the backend the Supabase session. Supabase already checked the password,
  // so the backend trusts that (creating the account on first login and refreshing its own
  // password copy). This avoids "login 401 / register 400" when the two passwords drifted
  // apart, e.g. after a Supabase "forgot password" reset or a password shorter than 8 characters.
  let accessToken = '';
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    accessToken = sessionData?.session?.access_token || '';
  } catch (error) {
    accessToken = '';
  }
  if (accessToken) {
    const supabaseLoginResult = await postToBackend('/api/auth/supabase-login', {
      accessToken,
      password,
      firstname,
      lastname,
      deviceId: getDeviceId(),
    });
    // Fall back to the password flow only if this server can't verify Supabase sessions
    // (not configured: 503, or an older backend without the endpoint: 404/405).
    const status = supabaseLoginResult.error?.status;
    if (!supabaseLoginResult.error || ![503, 404, 405].includes(status)) {
      return supabaseLoginResult;
    }
  }

  // Existing Supabase users should authenticate through the backend first.
  // Registration is only needed when the backend has no matching account.
  const loginResult = await postToBackend('/api/auth/login', {
    email: user.email,
    password,
    deviceId: payload.deviceId,
  });

  if (!loginResult.error || !isAccountNotFoundError(loginResult.error)) {
    return loginResult;
  }

  const createResult = await postToBackend('/api/auth/register', payload);

  // Registering doesn't return a session token, so log in right after to get one.
  if (!createResult.error || isConflictError(createResult.error.message)) {
    return postToBackend('/api/auth/login', {
      email: user.email,
      password,
      deviceId: getDeviceId(),
    });
  }

  return createResult;
};

const syncBackendPassword = async (email, currentPassword, password) => {
  if (!email || !password) {
    return { data: null, error: null };
  }

  if (currentPassword) {
    return postToBackend('/api/auth/change-password', {
      email,
      currentPassword,
      password,
    });
  }
  return postToBackend('/api/auth/session-change-password', {
    password,
  });
};

export const syncSupabaseUserToBackend = syncBackendUser;
export const loginBackendUser = (email, password) => postToBackend('/api/auth/login', {
  email,
  password,
  deviceId: getDeviceId(),
});
export const verifySupabaseUserDevice = (email) => postToBackend('/api/auth/verify-device', {
  email,
  deviceId: getDeviceId(),
});
export const releaseSupabaseUserDevice = (email) => postToBackend('/api/auth/logout', {
  email,
  deviceId: getDeviceId(),
}).finally(() => clearBackendSession());
export const syncSupabasePasswordToBackend = syncBackendPassword;
export const fetchBackendUsers = () => getFromBackend('/api/users');
// The logged-in user's own backend profile (works for every role, unlike the admin-only user list).
export const fetchCurrentBackendUser = () => getFromBackend('/api/auth/me');
export const fetchBackendProgress = (userId) => getFromBackend(`/api/progress/user/${userId}`);
export const fetchBackendActivity = (userId) => getFromBackend(`/api/activity/user/${userId}`);
export const recordBackendActivity = (userId, moduleName, action, details = null) => postToBackend(`/api/activity/user/${userId}`, {
  moduleName,
  action,
  details,
});
export const fetchBackendModuleProgress = (userId, moduleName) => getFromBackend(`/api/progress/user/${userId}/module/${encodeURIComponent(moduleName)}`);
export const fetchBackendModuleGames = () => getFromBackend('/api/module-games');
export const fetchTeacherActivities = (teacherId) => getFromBackend(`/api/teacher-activities/teacher/${teacherId}`);
export const createTeacherActivity = (teacherId, payload) => postToBackend(`/api/teacher-activities/teacher/${teacherId}`, payload);
export const fetchBackendGamesByModule = (moduleKey) => getFromBackend(`/api/module-games/module/${encodeURIComponent(moduleKey)}`);
export const fetchBackendGameByKey = (gameKey) => getFromBackend(`/api/module-games/key/${encodeURIComponent(gameKey)}`);
export const createBackendGame = (payload) => postToBackend('/api/module-games', payload);
export const updateBackendGame = (gameId, payload) => putToBackend(`/api/module-games/${gameId}`, payload);
export const deleteBackendGame = (gameId) => requestToBackend(`/api/module-games/${gameId}`, { method: 'DELETE' });
export const updateBackendModuleProgress = (userId, moduleName, payload) => putToBackend(`/api/progress/user/${userId}/module/${encodeURIComponent(moduleName)}`, payload);
export const fetchBackendGameScores = (userId) => getFromBackend(`/api/progress/user/${userId}/games`);
export const recordBackendGameScore = (userId, gameName, score) => postToBackend(`/api/progress/user/${userId}/games`, { gameName, score });
export const updateBackendUser = (userId, payload) => putToBackend(`/api/users/${userId}`, payload);
export const deleteBackendUser = (userId) => requestToBackend(`/api/users/${userId}`, { method: 'DELETE' });
export const generateBackendClassCode = (userId) => postToBackend(`/api/users/${userId}/generate-class-code`, {});
export const joinBackendClass = (userId, classCode) => postToBackend(`/api/users/${userId}/join-class`, { classCode });

export const fetchTeacherClasses = (teacherId) => getFromBackend(`/api/classes/teacher/${teacherId}`);
export const createTeacherClass = (teacherId, name) => postToBackend(`/api/classes/teacher/${teacherId}`, { name });
export const deleteTeacherClass = (classId, teacherId) => requestToBackend(`/api/classes/${classId}?teacherId=${teacherId}`, { method: 'DELETE' });
export const fetchClassStudents = (classId) => getFromBackend(`/api/classes/${classId}/students`);
export const addClassStudents = (classId, teacherId, emails) => postToBackend(`/api/classes/${classId}/students?teacherId=${teacherId}`, { emails });
export const removeClassStudent = (classId, teacherId, studentId) => requestToBackend(`/api/classes/${classId}/students/${studentId}?teacherId=${teacherId}`, { method: 'DELETE' });
export const fetchAvailableStudents = () => getFromBackend('/api/classes/available-students');
export const fetchStudentClass = (studentId) => getFromBackend(`/api/classes/student/${studentId}`);

export const fetchLearningMaterials = (classId) => getFromBackend(`/api/learning-materials/class/${classId}`);
export const deleteLearningMaterial = (materialId, teacherId) => requestToBackend(`/api/learning-materials/${materialId}?teacherId=${teacherId}`, { method: 'DELETE' });

export const uploadLearningMaterial = async (classId, teacherId, file, title) => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }

  try {
    const url = `${backendUrl}/api/learning-materials/class/${classId}?teacherId=${teacherId}`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'omit',
      headers: buildAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      return { data: null, error: await readBackendError(response) };
    }

    const responseText = await response.text();
    return { data: responseText ? JSON.parse(responseText) : null, error: null };
  } catch (error) {
    return { data: null, error: { message: 'Backend unavailable' } };
  }
};

// Pretests (teacher-authored quizzes: multiple choice, matching, identification, true/false, fill-in-the-blank)
export const fetchTeacherPretests = (classId) => getFromBackend(`/api/pretests/class/${classId}`);
export const createPretest = (classId, teacherId, payload) => postToBackend(`/api/pretests/class/${classId}?teacherId=${teacherId}`, payload);
export const fetchPretestDetail = (pretestId, teacherId) => getFromBackend(`/api/pretests/${pretestId}?teacherId=${teacherId}`);
export const updatePretest = (pretestId, teacherId, payload) => putToBackend(`/api/pretests/${pretestId}?teacherId=${teacherId}`, payload);
export const deletePretest = (pretestId, teacherId) => requestToBackend(`/api/pretests/${pretestId}?teacherId=${teacherId}`, { method: 'DELETE' });

export const addPretestQuestion = (pretestId, teacherId, payload) => postToBackend(`/api/pretests/${pretestId}/questions?teacherId=${teacherId}`, payload);
export const updatePretestQuestion = (questionId, teacherId, payload) => putToBackend(`/api/pretests/questions/${questionId}?teacherId=${teacherId}`, payload);
export const deletePretestQuestion = (questionId, teacherId) => requestToBackend(`/api/pretests/questions/${questionId}?teacherId=${teacherId}`, { method: 'DELETE' });

export const fetchPretestAttempts = (pretestId, teacherId) => getFromBackend(`/api/pretests/${pretestId}/attempts?teacherId=${teacherId}`);

export const fetchStudentPretests = (classId, studentId) => getFromBackend(`/api/pretests/class/${classId}/student/${studentId}`);
export const fetchPretestForStudent = (pretestId, studentId) => getFromBackend(`/api/pretests/${pretestId}/take?studentId=${studentId}`);
export const submitPretestAttempt = (pretestId, studentId, payload) => postToBackend(`/api/pretests/${pretestId}/submit?studentId=${studentId}`, payload);

export const uploadPretestAudio = async (pretestId, teacherId, blob, fileName = 'recording.webm') => {
  const formData = new FormData();
  formData.append('file', blob, fileName);

  try {
    const url = `${backendUrl}/api/pretests/${pretestId}/audio?teacherId=${teacherId}`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'omit',
      headers: buildAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      return { data: null, error: await readBackendError(response) };
    }

    const responseText = await response.text();
    return { data: responseText ? JSON.parse(responseText) : null, error: null };
  } catch (error) {
    return { data: null, error: { message: 'Backend unavailable' } };
  }
};
