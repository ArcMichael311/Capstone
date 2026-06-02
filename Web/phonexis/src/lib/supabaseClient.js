import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

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
    const response = await fetch(`${backendUrl}${path}`, {
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      return {
        data: null,
        error: { message: await readBackendError(response) },
      };
    }

    const responseText = await response.text();

    return {
      data: responseText ? JSON.parse(responseText) : null,
      error: null,
    };
  } catch (error) {
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
  };

  const createResult = await postToBackend('/api/auth/register', payload);

  if (!createResult.error) {
    return createResult;
  }

  if (isConflictError(createResult.error.message)) {
    return postToBackend('/api/auth/login', {
      email: user.email,
      password,
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
export const syncSupabasePasswordToBackend = syncBackendPassword;
export const fetchBackendUsers = () => getFromBackend('/api/users');
export const fetchBackendProgress = (userId) => getFromBackend(`/api/progress/user/${userId}`);
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
export const generateBackendClassCode = (userId) => postToBackend(`/api/users/${userId}/generate-class-code`, {});
export const joinBackendClass = (userId, classCode) => postToBackend(`/api/users/${userId}/join-class`, { classCode });
