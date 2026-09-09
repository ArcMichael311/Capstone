import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const configuredBackendUrl = process.env.REACT_APP_BACKEND_URL;
const backendUrl = (configuredBackendUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080')).replace(/\/$/, '');

const getDeviceId = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const storageKey = 'phonexis_device_id';
  try {
    const existingId = window.localStorage.getItem(storageKey);
    if (existingId) {
      return existingId;
    }

    const generatedId = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(storageKey, generatedId);
    return generatedId;
  } catch (error) {
    return '';
  }
};

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or ANON KEY is not set in environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

const readBackendError = async (response) => {
  try {
    const payload = await response.json();
    return payload?.message || payload?.error || 'Backend request failed';
  } catch (error) {
    return 'Backend request failed';
  }
};

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
      const errorMessage = await readBackendError(response);
      console.error(`[Backend Error] ${response.status}: ${errorMessage}`);
      return {
        data: null,
        error: { message: errorMessage },
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

export const isBackendUnavailableError = (error) => error?.message === 'Backend unavailable';

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
  const firstname = profile.firstname || user?.user_metadata?.firstname || user?.user_metadata?.firstName || user?.firstName || '';
  const lastname = profile.lastname || user?.user_metadata?.lastname || user?.user_metadata?.lastName || user?.lastName || '';
  return { firstname, lastname };
};

const isConflictError = (message) => /already exists|conflict|duplicate/i.test(message || '');

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
export const fetchBackendActivity = (userId) => getFromBackend(`/api/activity/user/${userId}`);
export const recordBackendActivity = (userId, moduleName, action, details = null) => postToBackend(`/api/activity/user/${userId}`, {
  moduleName,
  action,
  details,
});
export const fetchBackendModuleProgress = (userId, moduleName) => getFromBackend(`/api/progress/user/${userId}/module/${encodeURIComponent(moduleName)}`);
export const fetchBackendModuleGames = () => getFromBackend('/api/module-games');
export const fetchBackendGamesByModule = (moduleKey) => getFromBackend(`/api/module-games/module/${encodeURIComponent(moduleKey)}`);
export const fetchBackendGameByKey = (gameKey) => getFromBackend(`/api/module-games/key/${encodeURIComponent(gameKey)}`);
export const createBackendGame = (payload) => postToBackend('/api/module-games', payload);
export const updateBackendGame = (gameId, payload) => putToBackend(`/api/module-games/${gameId}`, payload);
export const deleteBackendGame = (gameId) => requestToBackend(`/api/module-games/${gameId}`, { method: 'DELETE' });
export const updateBackendModuleVideos = (userId, moduleName, videoIds) => postToBackend(`/api/progress/user/${userId}/module/${encodeURIComponent(moduleName)}/videos`, {
  videoIds,
});
export const updateBackendModuleProgress = (userId, moduleName, payload) => putToBackend(`/api/progress/user/${userId}/module/${encodeURIComponent(moduleName)}`, payload);
export const updateBackendUser = (userId, payload) => putToBackend(`/api/users/${userId}`, payload);
export const deleteBackendUser = (userId) => requestToBackend(`/api/users/${userId}`, { method: 'DELETE' });
export const generateBackendClassCode = (userId) => postToBackend(`/api/users/${userId}/generate-class-code`, {});
export const joinBackendClass = (userId, classCode) => postToBackend(`/api/users/${userId}/join-class`, { classCode });
