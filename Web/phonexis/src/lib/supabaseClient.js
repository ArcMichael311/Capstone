import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const configuredBackendUrl = process.env.REACT_APP_BACKEND_URL;
const backendUrl = (configuredBackendUrl || 'https://phonexis-backend.onrender.com').replace(/\/$/, '');
export const isLocalDevelopment = process.env.NODE_ENV === 'development';
let memoryDeviceId = '';

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

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or ANON KEY is not set in environment variables.');
}

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

const requestToBackend = async (path, options = {}) => {
  try {
    const url = `${backendUrl}${path}`;
    console.log(`[Backend] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        'X-Device-Id': getDeviceId(),
        ...(options.headers || {}),
      },
      ...options,
    });

    console.log(`[Backend Response] Status: ${response.status}`);

    if (!response.ok) {
      const backendError = await readBackendError(response);
      console.error(`[Backend Error] ${response.status}: ${backendError.message}`);
      return {
        data: null,
        error: backendError,
      };
    }

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : null;
    console.log(`[Backend Success]`, data);

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('[Backend Exception]', error);
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
});

const getNameParts = (user, profile = {}) => {
  const emailName = (user?.email || '').split('@')[0].replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const firstname = profile.firstname || user?.user_metadata?.firstname || user?.user_metadata?.firstName || user?.firstName || emailName || 'Student';
  const lastname = profile.lastname || user?.user_metadata?.lastname || user?.user_metadata?.lastName || user?.lastName || 'User';
  return { firstname, lastname };
};

const isConflictError = (message) => /already exists|conflict|duplicate/i.test(message || '');
const isAccountNotFoundError = (error) => error?.status === 404 || /account not found|user not found/i.test(error?.message || '');

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
    deviceId: getDeviceId(),
  };

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

  if (!createResult.error) {
    return createResult;
  }

  if (isConflictError(createResult.error.message)) {
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

  return postToBackend('/api/auth/reset-password', {
    email,
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
});
export const syncSupabasePasswordToBackend = syncBackendPassword;
export const fetchBackendUsers = () => getFromBackend('/api/users');
export const fetchBackendProgress = (userId) => getFromBackend(`/api/progress/user/${userId}`);
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
export const updateBackendUser = (userId, payload) => putToBackend(`/api/users/${userId}`, payload);
export const deleteBackendUser = (userId) => requestToBackend(`/api/users/${userId}`, { method: 'DELETE' });
export const generateBackendClassCode = (userId) => postToBackend(`/api/users/${userId}/generate-class-code`, {});
export const joinBackendClass = (userId, classCode) => postToBackend(`/api/users/${userId}/join-class`, { classCode });
