import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Modules from './components/Modules';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import { setGameScoreUserId } from './components/Modules/shared/gameScores';
import AdminSidebar from './components/Admin/AdminSidebar';
import TeacherSidebar from './components/Teacher/TeacherSidebar';
import Sidebar from './components/Sidebar/Sidebar';
import StudentClassModal from './components/Dashboard/StudentClassModal';
import Routing, { getSectionFromPath, getViewFromPath } from './router/Routing';
import {
  supabase,
  fetchCurrentBackendUser,
  hasBackendSession,
  fetchBackendProgress,
  fetchStudentClass,
  fetchLearningMaterials,
  joinBackendClass,
  updateBackendModuleProgress,
  verifySupabaseUserDevice,
  releaseSupabaseUserDevice,
  isLocalDevelopment,
  isBackendUnavailable,
  clearBackendSession,
  SESSION_ENDED_EVENT,
  LOGOUT_REASON_KEY,
  readCachedProfile,
  writeCachedProfile,
} from './lib/supabaseClient';

// Screens that only some users need are downloaded on demand (smaller first load). They are
// prefetched in the background right after login, so opening them later is still instant.
const loadAlphabetRecognition = () => import('./components/Modules/AlphabetRecognition');
const loadCVCWords = () => import('./components/Modules/CVCWords');
const loadVowels = () => import('./components/Modules/Vowels');
const loadConsonants = () => import('./components/Modules/Consonants');
const loadAdminDashboard = () => import('./components/Admin/AdminDashboard');
const loadAdminStudents = () => import('./components/Admin/AdminStudents');
const loadAdminTeachers = () => import('./components/Admin/AdminTeachers');
const loadAdminAdmins = () => import('./components/Admin/AdminAdmins');
const loadTeacher = () => import('./components/Teacher/Teacher');
const AlphabetRecognition = lazy(loadAlphabetRecognition);
const CVCWords = lazy(loadCVCWords);
const Vowels = lazy(loadVowels);
const Consonants = lazy(loadConsonants);
const AdminDashboard = lazy(loadAdminDashboard);
const AdminStudents = lazy(loadAdminStudents);
const AdminTeachers = lazy(loadAdminTeachers);
const AdminAdmins = lazy(loadAdminAdmins);
const Teacher = lazy(loadTeacher);

const prefetchScreensForRole = (role) => {
  const loaders = role === 'admin'
    ? [loadAdminDashboard, loadAdminStudents, loadAdminTeachers, loadAdminAdmins]
    : role === 'teacher'
      ? [loadTeacher]
      : [loadAlphabetRecognition, loadVowels, loadConsonants, loadCVCWords];
  loaders.forEach((load) => { load().catch(() => null); });
};

const AUTH_ONLY_VIEWS = ['login', 'register', 'forgotpassword'];

const landingViewForRole = (userProfile) => {
  const normalizedRole = String(userProfile?.role || userProfile?.user_metadata?.role || '').toLowerCase();
  if (normalizedRole === 'admin') {
    return 'admin';
  }
  if (normalizedRole === 'teacher') {
    return 'teacher';
  }
  return 'dashboard';
};

function App() {
  // On refresh, show the remembered user's dashboard immediately instead of flashing the login
  // page; the session is re-checked in the background (restoreSession) and, if it has ended,
  // the user is sent to login.
  const [initialProfile] = useState(() => readCachedProfile());
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!initialProfile);
  // Logged in, but no remembered profile yet: show a short loading screen, not the login page.
  const [isRestoringSession, setIsRestoringSession] = useState(() => !initialProfile && hasBackendSession());
  const [activeView, setActiveView] = useState(() => {
    const pathView = getViewFromPath(window.location.pathname);
    return initialProfile && AUTH_ONLY_VIEWS.includes(pathView) ? landingViewForRole(initialProfile) : pathView;
  });
  const [activeSection, setActiveSection] = useState(() => getSectionFromPath(window.location.pathname));
  const [, setNavigationHistory] = useState([]);
  const audioRef = useRef(null);
  const progressSyncRef = useRef(Promise.resolve());
  // Debounced progress upload: the latest pending sync, its timer, and what was last uploaded.
  const pendingProgressSyncRef = useRef(null);
  const progressSyncTimerRef = useRef(null);
  const lastSentProgressRef = useRef({});
  // Sends any pending progress now (used by the debounce timer, logout and tab close).
  const flushProgressSyncRef = useRef(() => {
    clearTimeout(progressSyncTimerRef.current);
    const pending = pendingProgressSyncRef.current;
    pendingProgressSyncRef.current = null;
    if (pending) {
      progressSyncRef.current = progressSyncRef.current.then(pending, pending);
    }
    return progressSyncRef.current;
  });
  const activeViewRef = useRef('login');
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [theme, setTheme] = useState(() => {
    try {
      const storedTheme = localStorage.getItem('phonexis_theme');
      return storedTheme === 'dark' ? 'dark' : 'light';
    } catch (error) {
      return 'light';
    }
  });
  const [activeModule, setActiveModule] = useState('alphabet');
  const [currentUser, setCurrentUser] = useState(() => initialProfile);
  const [resetEmail, setResetEmail] = useState(null);
  const [completedPretests, setCompletedPretests] = useState([]);
  const [completedAlphabetModes, setCompletedAlphabetModes] = useState([]); // Track easy, medium, hard
  const [alphabetScores, setAlphabetScores] = useState({});
  const [alphabetExploredLetters, setAlphabetExploredLetters] = useState(['A']);
  const [alphabetHeardFryWords, setAlphabetHeardFryWords] = useState([]);
  const [vowelsCompleted, setVowelsCompleted] = useState(false);
  const [vowelsExplored, setVowelsExplored] = useState(['A']);
  const [consonantsCompleted, setConsonantsCompleted] = useState(false);
  const [consonantsExplored, setConsonantsExplored] = useState(['B']);
  const [cvcCompleted, setCvcCompleted] = useState(false);
  const [cvcExploredFamilies, setCvcExploredFamilies] = useState([]);
  const [cvcHeardWords, setCvcHeardWords] = useState([]);
  const [cvcSelectionCompleted, setCvcSelectionCompleted] = useState(false);
  const [vowelsWatchedVideos, setVowelsWatchedVideos] = useState([]);
  const [consonantsWatchedVideos, setConsonantsWatchedVideos] = useState([]);
  const [cvcWatchedVideos, setCvcWatchedVideos] = useState([]);
  const [isProgressHydrated, setIsProgressHydrated] = useState(false);
  const [backendUserId, setBackendUserId] = useState(null);
  const [studentClassInfo, setStudentClassInfo] = useState(null);
  const [studentMaterials, setStudentMaterials] = useState([]);
  const normalizedRole = String(currentUser?.role || currentUser?.user_metadata?.role || '').toLowerCase();
  const isAdminUser = normalizedRole === 'admin';
  const isTeacherUser = normalizedRole === 'teacher';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  const mapAuthUserToProfile = useCallback((user) => {
    if (!user) {
      return null;
    }

    const firstname = user.user_metadata?.firstname || user.user_metadata?.firstName || user.firstname || user.firstName || '';
    const lastname = user.user_metadata?.lastname || user.user_metadata?.lastName || user.lastname || user.lastName || '';
    const role = user.user_metadata?.role || user.role || 'student';

    return {
      ...user,
      firstname,
      lastname,
      role,
      user_metadata: {
        ...(user.user_metadata || {}),
        firstname,
        lastname,
        role,
        email: user.email || user.user_metadata?.email,
      },
    };
  }, []);

  const applyBackendRole = useCallback(async (profile) => {
    if (!profile) {
      return null;
    }

    const email = String(profile.email || profile.user_metadata?.email || '').trim().toLowerCase();
    if (!email) {
      return profile;
    }

    try {
      // Ask the backend who the current session belongs to. (The full user list is admin-only,
      // so using it here made students lose their backend id - and their progress - on refresh.)
      const meResult = await fetchCurrentBackendUser();
      const backendUser = meResult.error ? null : meResult.data?.user;
      if (!backendUser?.role || String(backendUser.email || '').trim().toLowerCase() !== email) {
        // The role must come from the backend. Supabase user_metadata can be edited by the
        // user themselves, so never let it grant the Teacher or Admin dashboard.
        if (isLocalDevelopment) {
          return profile;
        }
        return { ...profile, role: 'student', user_metadata: { ...(profile.user_metadata || {}), role: 'student' } };
      }

      const nextRole = String(backendUser.role).toLowerCase();

      return {
        ...profile,
        id: backendUser.id ?? profile.id,
        firstname: backendUser.firstName || backendUser.firstname || profile.firstname,
        lastname: backendUser.lastName || backendUser.lastname || profile.lastname,
        role: nextRole,
        classroom: backendUser.classroom || backendUser.user_metadata?.classroom || profile.classroom || null,
        classCode: backendUser.classCode || backendUser.user_metadata?.classCode || profile.classCode || null,
        user_metadata: {
          ...(profile.user_metadata || {}),
          role: nextRole,
          classCode: backendUser.classCode || backendUser.user_metadata?.classCode || profile.user_metadata?.classCode || null,
          classroom: backendUser.classroom || backendUser.user_metadata?.classroom || profile.user_metadata?.classroom || null,
          firstName: backendUser.firstName || backendUser.firstname || profile.firstname,
          lastName: backendUser.lastName || backendUser.lastname || profile.lastname,
        },
      };
    } catch (error) {
      return isLocalDevelopment ? profile : { ...profile, role: 'student', user_metadata: { ...(profile.user_metadata || {}), role: 'student' } };
    }
  }, []);

  const getLandingViewByRole = useCallback((userProfile) => landingViewForRole(userProfile), []);

  // Once the dashboard is on screen, download this role's other screens in the background.
  const prefetchRole = isAuthenticated ? landingViewForRole(currentUser) : null;
  useEffect(() => {
    if (!prefetchRole) {
      return undefined;
    }
    const role = prefetchRole === 'dashboard' ? 'student' : prefetchRole;
    const run = () => prefetchScreensForRole(role);
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, [prefetchRole]);

  // Remember the logged-in profile so the next refresh can render the dashboard instantly.
  useEffect(() => {
    if (isAuthenticated && currentUser?.email) {
      writeCachedProfile(currentUser);
    } else if (!isAuthenticated) {
      writeCachedProfile(null);
    }
  }, [isAuthenticated, currentUser]);

  const navigateTo = useCallback((nextView, nextSection = null) => {
    if (!nextView) {
      return;
    }

    if (isAuthenticated && activeViewRef.current && activeViewRef.current !== nextView) {
      setNavigationHistory((history) => [...history, activeViewRef.current]);
    }

    setActiveView(nextView);
    setActiveSection(nextSection);
  }, [isAuthenticated]);

  const goBack = useCallback((fallbackView = 'dashboard') => {
    let previousView = null;

    setNavigationHistory((history) => {
      if (history.length === 0) {
        previousView = fallbackView;
        return history;
      }

      previousView = history[history.length - 1];
      return history.slice(0, -1);
    });

    setActiveView(previousView || fallbackView);
  }, []);

  useEffect(() => {
    try {
      const storedVolume = localStorage.getItem('phonexis_music_volume');
      if (storedVolume !== null) {
        const parsedVolume = Number(storedVolume);
        if (!Number.isNaN(parsedVolume)) {
          setMusicVolume(Math.min(Math.max(parsedVolume, 0), 1));
        }
      }
    } catch (error) {
      // ignore storage errors
    }

    const handleMusicVolumeChange = (event) => {
      const nextVolume = Number(event?.detail);
      if (Number.isNaN(nextVolume)) {
        return;
      }

      const clampedVolume = Math.min(Math.max(nextVolume, 0), 1);
      setMusicVolume(clampedVolume);
    };

    window.addEventListener('phonexis:music-volume-change', handleMusicVolumeChange);

    return () => {
      window.removeEventListener('phonexis:music-volume-change', handleMusicVolumeChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    try {
      localStorage.setItem('phonexis_theme', theme);
    } catch (error) {
      // ignore storage errors
    }
  }, [theme]);

  const handleThemeChange = (nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') {
      return;
    }

    setTheme(nextTheme);
  };

  useEffect(() => {
    let cancelled = false;

    const endRestoredSession = async () => {
      clearBackendSession();
      await supabase.auth.signOut({ scope: 'local' });
      if (!cancelled) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setActiveView((currentView) => (AUTH_ONLY_VIEWS.includes(currentView) ? currentView : 'login'));
      }
    };

    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user;

      if (cancelled) {
        return;
      }
      if (!sessionUser) {
        // Signed out of Supabase (e.g. elsewhere) but a dashboard was shown from the cache.
        if (initialProfile) {
          await endRestoredSession();
        }
        return;
      }

      // Without a backend session nothing (including progress) can be loaded or saved,
      // so ask the user to log in again instead of showing an empty dashboard.
      if (!isLocalDevelopment && !hasBackendSession()) {
        await endRestoredSession();
        return;
      }

      const mappedUser = mapAuthUserToProfile(sessionUser);
      // Both checks are independent, so run them at the same time (one round trip, not two).
      const [deviceResult, roleAwareUser] = await Promise.all([
        isLocalDevelopment ? Promise.resolve({ error: null }) : verifySupabaseUserDevice(sessionUser.email),
        applyBackendRole(mappedUser),
      ]);
      if (cancelled) {
        return;
      }
      if (deviceResult.error && !isBackendUnavailable(deviceResult.error)) {
        await endRestoredSession();
        return;
      }

      // Backend briefly unreachable (e.g. waking up): keep the remembered profile for now.
      const lookupFailed = typeof roleAwareUser?.id !== 'number';
      const sameCachedUser = initialProfile
        && String(initialProfile.email || '').toLowerCase() === String(sessionUser.email || '').toLowerCase();
      if (lookupFailed && sameCachedUser) {
        return;
      }

      setCurrentUser(roleAwareUser);
      setIsAuthenticated(true);
      setActiveView((currentView) => (AUTH_ONLY_VIEWS.includes(currentView) ? getLandingViewByRole(roleAwareUser) : currentView));
    };

    void restoreSession().finally(() => {
      if (!cancelled) {
        setIsRestoringSession(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        if (event !== 'SIGNED_OUT') {
          return;
        }

        setIsAuthenticated(false);
        setCurrentUser(null);
        setNavigationHistory([]);
        setActiveView('login');
        return;
      }

      // INITIAL_SESSION is handled by restoreSession above, and TOKEN_REFRESHED fires every
      // hour - re-running the profile sync for it would reload (and briefly reset) progress.
      // SIGNED_IN fires before Login.js has obtained the backend session; Login.js finishes
      // that flow itself through onSuccess, so only sync here once a backend session exists.
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || !hasBackendSession()) {
        return;
      }

      const syncProfile = async () => {
        const mappedUser = mapAuthUserToProfile(session.user);
        const deviceResult = isLocalDevelopment ? { error: null } : await verifySupabaseUserDevice(session.user.email);
        if (deviceResult.error) {
          clearBackendSession();
          await supabase.auth.signOut({ scope: 'local' });
          return;
        }
        const roleAwareUser = await applyBackendRole(mappedUser);
        if (cancelled) {
          return;
        }

        setCurrentUser(roleAwareUser);
        setIsAuthenticated(true);
        setActiveView((currentView) => (currentView === 'login' ? getLandingViewByRole(roleAwareUser) : currentView));
      };

      void syncProfile();
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [mapAuthUserToProfile, applyBackendRole, getLandingViewByRole, initialProfile]);

  // Build a stable storage key for the logged-in user
  const getProgressKey = (user) => {
    if (!user) return null;
    const email = (user.email || user.user_metadata?.email || '').trim().toLowerCase();
    const id = user.id;
    const stableKey = email || id || JSON.stringify(user);
    return `phonexis_progress_${String(stableKey)}`;
  };

  const parseVideoIds = useCallback((videosWatched) => {
    if (!videosWatched) {
      return [];
    }

    if (Array.isArray(videosWatched)) {
      return videosWatched;
    }

    try {
      const parsed = JSON.parse(videosWatched);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }, []);

  const applyProgressSnapshot = useCallback((snapshot = {}) => {
    const nextCompletedPretests = snapshot.completedPretests || [];
    const nextCompletedAlphabetModes = snapshot.completedAlphabetModes || nextCompletedPretests;

    setCompletedPretests(nextCompletedPretests);
    setCompletedAlphabetModes(nextCompletedAlphabetModes);
    if (Object.prototype.hasOwnProperty.call(snapshot, 'alphabetScores')) {
      setAlphabetScores(snapshot.alphabetScores || {});
    }
    setAlphabetExploredLetters(Array.isArray(snapshot.alphabetExploredLetters) && snapshot.alphabetExploredLetters.length ? snapshot.alphabetExploredLetters : ['A']);
    setAlphabetHeardFryWords(Array.isArray(snapshot.alphabetHeardFryWords) ? snapshot.alphabetHeardFryWords : []);
    setVowelsCompleted(!!snapshot.vowelsCompleted);
    setVowelsExplored(Array.isArray(snapshot.vowelsExplored) && snapshot.vowelsExplored.length ? snapshot.vowelsExplored : ['A']);
    setConsonantsCompleted(!!snapshot.consonantsCompleted);
    setConsonantsExplored(Array.isArray(snapshot.consonantsExplored) && snapshot.consonantsExplored.length ? snapshot.consonantsExplored : ['B']);
    setCvcCompleted(!!snapshot.cvcCompleted);
    setCvcExploredFamilies(Array.isArray(snapshot.cvcExploredFamilies) ? snapshot.cvcExploredFamilies : []);
    setCvcHeardWords(Array.isArray(snapshot.cvcHeardWords) ? snapshot.cvcHeardWords : []);
    setCvcSelectionCompleted(!!snapshot.cvcSelectionCompleted);
    setVowelsWatchedVideos(parseVideoIds(snapshot.vowelsWatchedVideos));
    setConsonantsWatchedVideos(parseVideoIds(snapshot.consonantsWatchedVideos));
    setCvcWatchedVideos(parseVideoIds(snapshot.cvcWatchedVideos));
  }, [parseVideoIds]);

  const mapBackendProgressToSnapshot = useCallback((progressList = []) => {
    const byModule = new Map(progressList.map((progress) => [String(progress?.moduleName || '').toLowerCase(), progress]));
    const alphabetProgress = byModule.get('alphabet');
    const vowelsProgress = byModule.get('vowels');
    const consonantsProgress = byModule.get('consonants');
    const cvcProgress = byModule.get('cvc');
    let alphabetScores = {};
    try {
      const parsedScores = JSON.parse(alphabetProgress?.assessmentScores || '{}');
      alphabetScores = parsedScores && typeof parsedScores === 'object' ? parsedScores : {};
    } catch (error) {
      alphabetScores = {};
    }
    const parseActivityProgress = (progress) => {
      try {
        const parsed = JSON.parse(progress?.activityProgress || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (error) {
        return {};
      }
    };
    const alphabetActivity = parseActivityProgress(alphabetProgress);
    const vowelsActivity = parseActivityProgress(vowelsProgress);
    const consonantsActivity = parseActivityProgress(consonantsProgress);
    const cvcActivity = parseActivityProgress(cvcProgress);

    return {
      alphabetScores,
      alphabetExploredLetters: alphabetActivity.exploredLetters,
      alphabetHeardFryWords: alphabetActivity.heardFryWords,
      completedPretests: [
        alphabetProgress?.easyModeCompleted ? 'easy' : null,
        alphabetProgress?.mediumModeCompleted ? 'medium' : null,
        alphabetProgress?.hardModeCompleted ? 'hard' : null,
      ].filter(Boolean),
      completedAlphabetModes: [
        alphabetProgress?.easyModeCompleted ? 'easy' : null,
        alphabetProgress?.mediumModeCompleted ? 'medium' : null,
        alphabetProgress?.hardModeCompleted ? 'hard' : null,
      ].filter(Boolean),
      vowelsCompleted: !!(vowelsProgress?.pretestCompleted || vowelsProgress?.completionPercentage >= 100),
      vowelsExplored: vowelsActivity.exploredVowels,
      consonantsCompleted: !!(consonantsProgress?.pretestCompleted || consonantsProgress?.completionPercentage >= 100),
      consonantsExplored: consonantsActivity.exploredConsonants,
      cvcCompleted: !!(cvcProgress?.pretestCompleted || cvcProgress?.completionPercentage >= 100),
      cvcExploredFamilies: cvcActivity.exploredFamilies,
      cvcHeardWords: cvcActivity.heardWords,
      cvcSelectionCompleted: cvcActivity.selectionCompleted,
      vowelsWatchedVideos: parseVideoIds(vowelsProgress?.videosWatched),
      consonantsWatchedVideos: parseVideoIds(consonantsProgress?.videosWatched),
      cvcWatchedVideos: parseVideoIds(cvcProgress?.videosWatched),
    };
  }, [parseVideoIds]);

  const resetProgressState = useCallback(() => {
    setCompletedPretests([]);
    setCompletedAlphabetModes([]);
    setAlphabetScores({});
    setAlphabetExploredLetters(['A']);
    setAlphabetHeardFryWords([]);
    setVowelsCompleted(false);
    setVowelsExplored(['A']);
    setConsonantsCompleted(false);
    setConsonantsExplored(['B']);
    setCvcCompleted(false);
    setCvcExploredFamilies([]);
    setCvcHeardWords([]);
    setCvcSelectionCompleted(false);
    setVowelsWatchedVideos([]);
    setConsonantsWatchedVideos([]);
    setCvcWatchedVideos([]);
    setBackendUserId(null);
    setIsProgressHydrated(false);
  }, []);

  const resolveBackendUserId = useCallback(async (user) => {
    if (!user) {
      return null;
    }

    if (typeof user.id === 'number') {
      return user.id;
    }

    if (typeof user.id === 'string' && /^\d+$/.test(user.id)) {
      return Number(user.id);
    }

    const email = (user.email || user.user_metadata?.email || '').trim().toLowerCase();
    if (!email) {
      return null;
    }

    const meResult = await fetchCurrentBackendUser();
    const backendUser = meResult.error ? null : meResult.data?.user;
    if (!backendUser || String(backendUser.email || '').trim().toLowerCase() !== email) {
      return null;
    }
    return backendUser.id ?? null;
  }, []);

  const refreshCurrentUserFromBackend = useCallback(async () => {
    setCurrentUser((current) => current);
    if (!currentUser) {
      return null;
    }

    const refreshed = await applyBackendRole(currentUser);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
    return refreshed;
  }, [currentUser, applyBackendRole]);

  // Combine two progress snapshots without ever losing progress: completed flags stay
  // completed, lists are merged, and the better score is kept for each alphabet level.
  const mergeProgressSnapshots = useCallback((primary = {}, secondary = {}) => {
    const unionList = (a, b) => Array.from(new Set([...(a || []), ...(b || [])]));
    const unionVideos = (a, b) => unionList(parseVideoIds(a), parseVideoIds(b));
    const ratio = (entry) => (entry && entry.total > 0 ? entry.score / entry.total : -1);

    const mergedScores = { ...(secondary.alphabetScores || {}) };
    Object.entries(primary.alphabetScores || {}).forEach(([level, entry]) => {
      if (ratio(entry) >= ratio(mergedScores[level])) {
        mergedScores[level] = entry;
      }
    });

    return {
      completedPretests: unionList(primary.completedPretests, secondary.completedPretests),
      completedAlphabetModes: unionList(
        primary.completedAlphabetModes || primary.completedPretests,
        secondary.completedAlphabetModes || secondary.completedPretests,
      ),
      alphabetScores: mergedScores,
      alphabetExploredLetters: unionList(primary.alphabetExploredLetters, secondary.alphabetExploredLetters),
      alphabetHeardFryWords: unionList(primary.alphabetHeardFryWords, secondary.alphabetHeardFryWords),
      vowelsCompleted: !!(primary.vowelsCompleted || secondary.vowelsCompleted),
      vowelsExplored: unionList(primary.vowelsExplored, secondary.vowelsExplored),
      consonantsCompleted: !!(primary.consonantsCompleted || secondary.consonantsCompleted),
      consonantsExplored: unionList(primary.consonantsExplored, secondary.consonantsExplored),
      cvcCompleted: !!(primary.cvcCompleted || secondary.cvcCompleted),
      cvcExploredFamilies: unionList(primary.cvcExploredFamilies, secondary.cvcExploredFamilies),
      cvcHeardWords: unionList(primary.cvcHeardWords, secondary.cvcHeardWords),
      cvcSelectionCompleted: !!(primary.cvcSelectionCompleted || secondary.cvcSelectionCompleted),
      vowelsWatchedVideos: unionVideos(primary.vowelsWatchedVideos, secondary.vowelsWatchedVideos),
      consonantsWatchedVideos: unionVideos(primary.consonantsWatchedVideos, secondary.consonantsWatchedVideos),
      cvcWatchedVideos: unionVideos(primary.cvcWatchedVideos, secondary.cvcWatchedVideos),
    };
  }, [parseVideoIds]);

  // Progress is only reloaded when a *different* user logs in, not every time the profile
  // object is refreshed (joining a class, role sync, ...), which used to reset it mid-session.
  const progressUserKey = currentUser ? getProgressKey(currentUser) : null;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  // True only after progress was successfully read from the backend. Until then nothing is
  // written back, so an empty/default state can never overwrite the student's saved progress.
  const [isBackendSyncReady, setIsBackendSyncReady] = useState(false);

  // Load progress for the current user when they log in (or the page is refreshed)
  useEffect(() => {
    if (!progressUserKey) {
      resetProgressState();
      setIsBackendSyncReady(false);
      return;
    }

    let cancelled = false;

    const readLocalSnapshot = () => {
      try {
        const raw = localStorage.getItem(progressUserKey);
        return raw ? JSON.parse(raw) : {};
      } catch (error) {
        return {};
      }
    };

    const loadProgress = async () => {
      resetProgressState();
      setIsBackendSyncReady(false);
      const user = currentUserRef.current;

      // 1) Show the progress this browser already knows right away - no "Loading..." screen.
      applyProgressSnapshot(readLocalSnapshot());
      setIsProgressHydrated(true);

      // 2) Then fetch the saved progress from the server in the background and merge it in.
      const resolvedBackendUserId = await resolveBackendUserId(user);
      if (cancelled) {
        return;
      }
      setBackendUserId(resolvedBackendUserId);
      if (!resolvedBackendUserId) {
        return;
      }

      const backendResult = await fetchBackendProgress(resolvedBackendUserId);
      if (cancelled || backendResult.error || !Array.isArray(backendResult.data)) {
        return;
      }
      // The database is the source of truth; anything this browser saved locally but had not
      // uploaded yet (including progress made in the last few seconds) is merged in and
      // uploaded on the next sync. Merging only adds progress, it never removes any.
      applyProgressSnapshot(mergeProgressSnapshots(mapBackendProgressToSnapshot(backendResult.data), readLocalSnapshot()));
      setIsBackendSyncReady(true);
    };

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, [progressUserKey, applyProgressSnapshot, mapBackendProgressToSnapshot, mergeProgressSnapshots, resolveBackendUserId, resetProgressState]);

  // Let the games save their scores for the logged-in student.
  useEffect(() => {
    setGameScoreUserId(isAdminUser || isTeacherUser ? null : backendUserId);
  }, [backendUserId, isAdminUser, isTeacherUser]);

  // Load the student's assigned class (if any) and the materials their teacher shared with it.
  useEffect(() => {
    if (isAdminUser || isTeacherUser || !backendUserId) {
      setStudentClassInfo(null);
      setStudentMaterials([]);
      return undefined;
    }

    let cancelled = false;

    const loadClassInfo = async () => {
      const classResult = await fetchStudentClass(backendUserId);
      if (cancelled) {
        return;
      }

      const classInfo = !classResult.error && classResult.data ? classResult.data : null;
      setStudentClassInfo(classInfo);

      if (!classInfo?.classId) {
        setStudentMaterials([]);
        return;
      }

      const materialsResult = await fetchLearningMaterials(classInfo.classId);
      if (!cancelled) {
        setStudentMaterials(!materialsResult.error && Array.isArray(materialsResult.data) ? materialsResult.data : []);
      }
    };

    void loadClassInfo();

    // Re-check so a class the teacher just added (or removed) shows up without a page refresh.
    const CLASS_REFRESH_INTERVAL_MS = 60 * 1000;
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadClassInfo();
      }
    };
    const refreshTimer = window.setInterval(refreshWhenVisible, CLASS_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [backendUserId, isAdminUser, isTeacherUser]);

  useEffect(() => {
    if (!currentUser || !isProgressHydrated) return;

    try {
      const key = getProgressKey(currentUser);
      const payload = JSON.stringify({
        completedPretests,
        completedAlphabetModes,
        alphabetScores,
        vowelsCompleted,
        consonantsCompleted,
        cvcCompleted,
        alphabetExploredLetters,
        alphabetHeardFryWords,
        vowelsExplored,
        consonantsExplored,
        cvcExploredFamilies,
        cvcHeardWords,
        cvcSelectionCompleted,
        vowelsWatchedVideos,
        consonantsWatchedVideos,
        cvcWatchedVideos,
      });
      if (key) {
        localStorage.setItem(key, payload);
      }
    } catch (e) {
      // ignore storage errors
    }

    if (!backendUserId || !isBackendSyncReady) {
      return;
    }

    const modulePayloads = {
      alphabet: {
        easyModeCompleted: completedPretests.includes('easy'),
        mediumModeCompleted: completedPretests.includes('medium'),
        hardModeCompleted: completedPretests.includes('hard'),
        assessmentScores: JSON.stringify(alphabetScores),
        activityProgress: JSON.stringify({ exploredLetters: alphabetExploredLetters, heardFryWords: alphabetHeardFryWords }),
      },
      vowels: {
        pretestCompleted: vowelsCompleted,
        videosWatched: vowelsWatchedVideos,
        activityProgress: JSON.stringify({ exploredVowels: vowelsExplored }),
      },
      consonants: {
        pretestCompleted: consonantsCompleted,
        videosWatched: consonantsWatchedVideos,
        activityProgress: JSON.stringify({ exploredConsonants: consonantsExplored }),
      },
      cvc: {
        pretestCompleted: cvcCompleted,
        videosWatched: cvcWatchedVideos,
        activityProgress: JSON.stringify({ exploredFamilies: cvcExploredFamilies, heardWords: cvcHeardWords, selectionCompleted: cvcSelectionCompleted }),
      },
    };

    // Only modules whose data changed since the last successful upload are sent.
    const syncBackendProgress = async () => {
      const sent = lastSentProgressRef.current;
      const changed = Object.entries(modulePayloads)
        .map(([moduleName, payload]) => [moduleName, payload, JSON.stringify(payload)])
        .filter(([moduleName, , serialized]) => sent[`${backendUserId}:${moduleName}`] !== serialized);
      await Promise.all(changed.map(async ([moduleName, payload, serialized]) => {
        const result = await updateBackendModuleProgress(backendUserId, moduleName, payload);
        if (!result.error) {
          sent[`${backendUserId}:${moduleName}`] = serialized;
        }
      }));
    };

    // Wait until the activity pauses, then send one batch (instead of 4 requests per click).
    clearTimeout(progressSyncTimerRef.current);
    pendingProgressSyncRef.current = syncBackendProgress;
    progressSyncTimerRef.current = setTimeout(() => {
      flushProgressSyncRef.current();
    }, 1000);
  }, [currentUser, backendUserId, isProgressHydrated, isBackendSyncReady, completedPretests, completedAlphabetModes, alphabetScores, alphabetExploredLetters, alphabetHeardFryWords, vowelsCompleted, vowelsExplored, consonantsCompleted, consonantsExplored, cvcCompleted, cvcExploredFamilies, cvcHeardWords, cvcSelectionCompleted, vowelsWatchedVideos, consonantsWatchedVideos, cvcWatchedVideos]);

  // Keep one music instance playing across authenticated views.
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/background-music/Children\'s Music  Happy Upbeat Music (Instrumental Music For Kids).mp3');
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;

    const playAudio = () => {
      if (!isAuthenticated || isAdminUser || isTeacherUser || audio.volume <= 0) {
        audio.pause();
        return;
      }

      audio.play().catch(() => {
        // Browsers may require a user gesture before starting audio.
      });
    };

    const stopAudio = () => {
      audio.pause();
    };

    if (isAuthenticated && !isAdminUser && !isTeacherUser && audio.volume > 0) {
      playAudio();
      window.addEventListener('pointerdown', playAudio, { once: true });
      window.addEventListener('keydown', playAudio, { once: true });
    } else {
      stopAudio();
    }

    return () => {
      window.removeEventListener('pointerdown', playAudio);
      window.removeEventListener('keydown', playAudio);
      if (!isAuthenticated || isAdminUser || isTeacherUser) stopAudio();
    };
  }, [isAuthenticated, isAdminUser, isTeacherUser]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
      if (musicVolume === 0 || isAdminUser || isTeacherUser) {
        audioRef.current.pause();
      } else if (isAuthenticated) {
        audioRef.current.play().catch(() => {
          // Browsers may require a user gesture before starting audio.
        });
      }
    }
  }, [isAuthenticated, isAdminUser, isTeacherUser, musicVolume]);

  // Module progress is driven by the user's completed steps.
  const alphabetProgress = Math.min(100, Math.round((completedAlphabetModes.length / 3) * 100));
  const vowelsProgress = vowelsCompleted ? 100 : Math.min(100, Math.round((vowelsWatchedVideos.length / 3) * 100));
  const consonantsProgress = consonantsCompleted ? 100 : Math.min(100, Math.round((consonantsWatchedVideos.length / 6) * 100));
  const cvcProgress = cvcCompleted ? 100 : Math.min(100, Math.round((cvcWatchedVideos.length / 1) * 100));
  const overallProgress = Math.round((alphabetProgress + vowelsProgress + consonantsProgress + cvcProgress) / 4);
  const vowelsUnlocked = alphabetProgress >= 100;
  const consonantsUnlocked = vowelsProgress >= 100;
  const cvcUnlocked = consonantsProgress >= 100;

  const handlePretestComplete = (difficulty, score, total) => {
    setAlphabetScores((currentScores) => ({
      ...currentScores,
      [difficulty]: { score, total },
    }));
    if (total <= 0 || score / total < 0.7) {
      return;
    }

    setCompletedPretests((currentPretests) => {
      if (currentPretests.includes(difficulty)) {
        return currentPretests;
      }

      return [...currentPretests, difficulty];
    });
  };

  const handleAlphabetModeComplete = (mode) => {
    setCompletedAlphabetModes((currentModes) => {
      if (currentModes.includes(mode)) {
        return currentModes;
      }
      return [...currentModes, mode];
    });
  };

  const openModule = (moduleKey) => {
    if (moduleKey === 'vowels' && !vowelsUnlocked) {
      return;
    }

    if (moduleKey === 'consonants' && !consonantsUnlocked) {
      return;
    }

    if (moduleKey === 'cvc' && !cvcUnlocked) {
      return;
    }

    setActiveModule(moduleKey);
    setActiveView(moduleKey);
    setActiveSection('learning');
  };

  const handleVowelsComplete = () => {
    setVowelsCompleted(true);
  };

  const handleConsonantsComplete = () => {
    setConsonantsCompleted(true);
    setActiveView('dashboard');
  };

  const handleCvcComplete = () => {
    setCvcCompleted(true);
  };

  const handleAuthSuccess = (userProfile) => {
    const mappedProfile = userProfile ? mapAuthUserToProfile(userProfile) : null;

    if (userProfile) {
      setCurrentUser(mappedProfile);
    }

    setIsAuthenticated(true);
    setNavigationHistory([]);
    setActiveView(getLandingViewByRole(mappedProfile));
    setActiveSection(null);
  };

  // Upload pending progress as soon as the tab is hidden or closed, instead of waiting for the timer.
  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') {
        void flushProgressSyncRef.current();
      }
    };
    const flushNow = () => void flushProgressSyncRef.current();
    document.addEventListener('visibilitychange', flushWhenHidden);
    window.addEventListener('pagehide', flushNow);
    return () => {
      document.removeEventListener('visibilitychange', flushWhenHidden);
      window.removeEventListener('pagehide', flushNow);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await flushProgressSyncRef.current();
      if (currentUser?.email) {
        await releaseSupabaseUserDevice(currentUser.email);
      }
      clearBackendSession();
      await supabase.auth.signOut();
    } catch (error) {
      // ignore sign-out errors and clear local state anyway
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
    setNavigationHistory([]);
    setActiveView('login');
    setActiveSection(null);
  }, [currentUser]);

  // The backend rejected our session (it expired, or this account just signed in on another
  // device). Return to the login screen; Login shows the reason.
  useEffect(() => {
    const handleSessionEnded = async () => {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (error) {
        // ignore sign-out errors and clear local state anyway
      }
      setIsAuthenticated(false);
      setCurrentUser(null);
      setNavigationHistory([]);
      setActiveView('login');
      setActiveSection(null);
    };

    window.addEventListener(SESSION_ENDED_EVENT, handleSessionEnded);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, handleSessionEnded);
  }, []);

  // Auto-logout after 10 minutes with no user activity. While the user is active, a heartbeat
  // tells the backend the session is in use; without it the backend ends the session after
  // 10 minutes (app.session.idle-timeout-minutes), which also frees the account if this tab
  // was closed without logging out. Only then can the account log in on another device.
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.email) {
      return undefined;
    }

    const IDLE_LIMIT_MS = 10 * 60 * 1000;
    const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;
    const email = currentUser.email;

    let idleTimer;
    let lastHeartbeatAt = 0;

    let lastResetAt = 0;
    const resetIdleTimer = () => {
      const now = Date.now();
      // mousemove / timeupdate fire many times per second; once per second is plenty.
      if (now - lastResetAt < 1000) {
        return;
      }
      lastResetAt = now;
      if (now - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatAt = now;
        verifySupabaseUserDevice(email).catch(() => {
          // ignore transient heartbeat failures
        });
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        try {
          window.sessionStorage.setItem(LOGOUT_REASON_KEY, 'You were logged out after 10 minutes of inactivity. Please log in again.');
        } catch (error) {
          // ignore storage errors
        }
        handleLogout();
      }, IDLE_LIMIT_MS);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer));
    // A lesson video/audio that is playing counts as activity, so students watching without
    // touching the mouse are not logged out. Media events don't bubble, so listen in capture phase.
    const mediaEvents = ['play', 'timeupdate'];
    mediaEvents.forEach((eventName) => document.addEventListener(eventName, resetIdleTimer, true));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
      mediaEvents.forEach((eventName) => document.removeEventListener(eventName, resetIdleTimer, true));
    };
  }, [isAuthenticated, currentUser, handleLogout]);

  const handleJoinClass = async () => {
    const classCodeInput = window.prompt('Enter class code from your teacher:');
    const classCode = String(classCodeInput || '').trim();
    if (!classCode) {
      return;
    }

    const userId = backendUserId || await resolveBackendUserId(currentUser);
    if (!userId) {
      window.alert('Unable to locate your account in backend. Please log out and log in again.');
      return;
    }

    const result = await joinBackendClass(userId, classCode);
    if (result.error) {
      window.alert(result.error.message || 'Failed to join class');
      return;
    }

    setBackendUserId(userId);
    await refreshCurrentUserFromBackend();
    window.alert('You joined the class successfully.');
  };

  const renderView = () => {
    // A session exists but is still being checked: don't flash the login page.
    if (!isAuthenticated && isRestoringSession) {
      return <section className="app-loading" aria-live="polite">Loading...</section>;
    }

    if (!isAuthenticated) {
      switch (activeView) {
        case 'register':
          return <Register onNavigate={navigateTo} onSuccess={handleAuthSuccess} />;
        case 'forgotpassword':
          return (
            <ForgotPassword 
              onNavigate={navigateTo} 
              onEmailSubmit={(email) => {
                setResetEmail(email);
                setActiveView('reset');
              }} 
            />
          );
        case 'reset':
          return <ResetPassword onNavigate={navigateTo} email={resetEmail} />;
        case 'login':
        default:
          return <Login onNavigate={navigateTo} onSuccess={handleAuthSuccess} />;
      }
    }

    if (!isAdminUser && !isTeacherUser && !isProgressHydrated) {
      return <section className="app-loading" aria-live="polite">Loading your progress...</section>;
    }

    if (isAdminUser) {
      if (activeView === 'profile') {
        return (
          <Profile
            onNavigate={navigateTo}
            onBack={() => navigateTo('admin')}
            user={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onThemeChange={handleThemeChange}
            initialTab={activeSection || 'info'}
          />
        );
      }

      if (activeSection === 'students') {
        return <AdminStudents currentUserId={backendUserId ?? currentUser?.id} />;
      }

      if (activeSection === 'teachers') {
        return <AdminTeachers currentUserId={backendUserId ?? currentUser?.id} />;
      }

      if (activeSection === 'admins') {
        return <AdminAdmins currentUserId={backendUserId ?? currentUser?.id} />;
      }

      return <AdminDashboard onNavigate={navigateTo} />;
    }

    if (isTeacherUser) {
      if (activeView === 'profile') {
        return (
          <Profile
            onNavigate={navigateTo}
            onBack={() => navigateTo('teacher')}
            user={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onThemeChange={handleThemeChange}
            initialTab={activeSection || 'info'}
          />
        );
      }

      return (
        <Teacher
          onNavigate={navigateTo}
          onLogout={handleLogout}
          user={currentUser}
          backendUserId={backendUserId}
          onProfileRefresh={refreshCurrentUserFromBackend}
          activeSection={activeSection}
        />
      );
    }

    switch (activeView) {
      case 'class':
        return studentClassInfo ? (
          <StudentClassModal
            studentClassInfo={studentClassInfo}
            studentMaterials={studentMaterials}
            studentId={backendUserId}
            activeSection={activeSection}
            onNavigate={navigateTo}
          />
        ) : (
          <section className="app-loading" aria-live="polite">Loading your classroom...</section>
        );
      case 'alphabet':
        return (
          <AlphabetRecognition
            onPretestComplete={handlePretestComplete}
            onProgressUpdate={handleAlphabetModeComplete}
            onBack={() => goBack('dashboard')}
            completedModes={completedAlphabetModes}
            alphabetScores={alphabetScores}
            initialExploredLetters={alphabetExploredLetters}
            initialHeardFryWords={alphabetHeardFryWords}
            onExploredLettersChange={setAlphabetExploredLetters}
            onHeardFryWordsChange={setAlphabetHeardFryWords}
            initialSection={activeSection}
            onNavigate={navigateTo}
          />
        );
      case 'cvc':
        if (!cvcUnlocked) {
          return (
            <Dashboard
              onNavigate={navigateTo}
              onSelectModule={openModule}
              user={currentUser}
              overallProgress={overallProgress}
              alphabetProgress={alphabetProgress}
              vowelsProgress={vowelsProgress}
              consonantsProgress={consonantsProgress}
              cvcProgress={cvcProgress}
              vowelsUnlocked={vowelsUnlocked}
              consonantsUnlocked={consonantsUnlocked}
              cvcUnlocked={cvcUnlocked}
              onLogout={handleLogout}
              onJoinClass={handleJoinClass}
              classroom={currentUser?.classroom || currentUser?.user_metadata?.classroom || null}
              studentClassInfo={studentClassInfo}
              studentMaterials={studentMaterials}
              studentId={backendUserId}
            />
          );
        }

        return (
          <CVCWords
            onComplete={handleCvcComplete}
            onBack={() => goBack('dashboard')}
            onNavigate={navigateTo}
            initialVideosWatched={cvcWatchedVideos}
            onVideosWatchedChange={setCvcWatchedVideos}
            initialExploredFamilies={cvcExploredFamilies}
            initialHeardWords={cvcHeardWords}
            initialSelectionCompleted={cvcSelectionCompleted}
            onExploredFamiliesChange={setCvcExploredFamilies}
            onHeardWordsChange={setCvcHeardWords}
            onSelectionCompletedChange={setCvcSelectionCompleted}
            initialType={['learning', 'families', 'selection', 'building'].includes(activeSection) ? activeSection : 'learning'}
          />
        );
      case 'vowels':
        if (!vowelsUnlocked) {
          return (
            <Dashboard
              onNavigate={navigateTo}
              onSelectModule={openModule}
              user={currentUser}
              overallProgress={overallProgress}
              alphabetProgress={alphabetProgress}
              vowelsProgress={vowelsProgress}
              consonantsProgress={consonantsProgress}
              cvcProgress={cvcProgress}
              vowelsUnlocked={vowelsUnlocked}
              consonantsUnlocked={consonantsUnlocked}
              cvcUnlocked={cvcUnlocked}
              onLogout={handleLogout}
              onJoinClass={handleJoinClass}
              classroom={currentUser?.classroom || currentUser?.user_metadata?.classroom || null}
              studentClassInfo={studentClassInfo}
              studentMaterials={studentMaterials}
              studentId={backendUserId}
            />
          );
        }

        return (
          <Vowels
            onComplete={handleVowelsComplete}
            onBack={() => goBack('dashboard')}
            onNavigate={navigateTo}
            initialVideosWatched={vowelsWatchedVideos}
            onVideosWatchedChange={setVowelsWatchedVideos}
            initialExploredVowels={vowelsExplored}
            onExploredVowelsChange={setVowelsExplored}
            isCompleted={vowelsCompleted}
            initialMode={['learning', 'lesson', 'vowelrush'].includes(activeSection) ? activeSection : 'learning'}
          />
        );
      case 'consonants':
        if (!consonantsUnlocked) {
          return (
            <Dashboard
              onNavigate={navigateTo}
              onSelectModule={openModule}
              user={currentUser}
              overallProgress={overallProgress}
              alphabetProgress={alphabetProgress}
              vowelsProgress={vowelsProgress}
              consonantsProgress={consonantsProgress}
              cvcProgress={cvcProgress}
              vowelsUnlocked={vowelsUnlocked}
              consonantsUnlocked={consonantsUnlocked}
              cvcUnlocked={cvcUnlocked}
              onLogout={handleLogout}
              onJoinClass={handleJoinClass}
              classroom={currentUser?.classroom || currentUser?.user_metadata?.classroom || null}
              studentClassInfo={studentClassInfo}
              studentMaterials={studentMaterials}
              studentId={backendUserId}
            />
          );
        }

        return (
          <Consonants
            onComplete={handleConsonantsComplete}
            onBack={() => goBack('dashboard')}
            onNavigate={navigateTo}
            initialVideosWatched={consonantsWatchedVideos}
            onVideosWatchedChange={setConsonantsWatchedVideos}
            initialExploredConsonants={consonantsExplored}
            onExploredConsonantsChange={setConsonantsExplored}
            isCompleted={consonantsCompleted}
            initialMode={['learning', 'explore', 'wordblast'].includes(activeSection) ? activeSection : 'learning'}
          />
        );
      case 'modules':
        return (
          <Modules
            activeModule={activeModule}
            onNavigate={navigateTo}
            onSelectModule={openModule}
            vowelsUnlocked={vowelsUnlocked}
            consonantsUnlocked={consonantsUnlocked}
            cvcUnlocked={cvcUnlocked}
            onComplete={() => {
              if (activeModule === 'vowels') {
                handleVowelsComplete();
                return;
              }

              if (activeModule === 'consonants') {
                handleConsonantsComplete();
                return;
              }

              if (activeModule === 'cvc') {
                handleCvcComplete();
              }
            }}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <Profile
            onNavigate={navigateTo}
            onBack={() => goBack('dashboard')}
            user={currentUser}
            overallProgress={overallProgress}
            alphabetProgress={alphabetProgress}
            vowelsProgress={vowelsProgress}
            consonantsProgress={consonantsProgress}
            cvcProgress={cvcProgress}
            onLogout={handleLogout}
            theme={theme}
            onThemeChange={handleThemeChange}
            initialTab={activeSection || 'info'}
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard
            onNavigate={setActiveView}
            onSelectModule={openModule}
            user={currentUser}
            overallProgress={overallProgress}
            alphabetProgress={alphabetProgress}
            vowelsProgress={vowelsProgress}
            consonantsProgress={consonantsProgress}
            cvcProgress={cvcProgress}
            vowelsUnlocked={vowelsUnlocked}
            consonantsUnlocked={consonantsUnlocked}
            cvcUnlocked={cvcUnlocked}
            onLogout={handleLogout}
            onJoinClass={handleJoinClass}
            classroom={currentUser?.classroom || currentUser?.user_metadata?.classroom || null}
            studentClassInfo={studentClassInfo}
            studentMaterials={studentMaterials}
            studentId={backendUserId}
          />
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <Routing
        activeView={activeView}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onNavigate={navigateTo}
      >
        <div className="app-shell">
          <div className="app-orb app-orb-left" aria-hidden="true" />
          <div className="app-orb app-orb-right" aria-hidden="true" />

          <main className="app-main app-auth-main app-login-main">{renderView()}</main>
        </div>
      </Routing>
    );
  }

  return (
    <Routing
      activeView={activeView}
      activeSection={activeSection}
      isAuthenticated={isAuthenticated}
      currentUser={currentUser}
      onNavigate={navigateTo}
    >
      <div className="app-shell app-shell-authenticated">
        {isAdminUser ? (
          <AdminSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
            activeView={activeView}
            activeSection={activeSection}
            currentUser={currentUser}
            onNavigate={navigateTo}
            onLogout={handleLogout}
          />
        ) : normalizedRole === 'teacher' ? (
          <TeacherSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
            activeView={activeView}
            activeSection={activeSection}
            currentUser={currentUser}
            onNavigate={navigateTo}
            onLogout={handleLogout}
          />
        ) : (
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
            activeView={activeView}
            activeSection={activeSection}
            currentUser={currentUser}
            studentClassInfo={studentClassInfo}
            onNavigate={navigateTo}
            onSelectModule={openModule}
            alphabetProgress={alphabetProgress}
            vowelsProgress={vowelsProgress}
            consonantsProgress={consonantsProgress}
            cvcProgress={cvcProgress}
            alphabetScores={alphabetScores}
            completedAlphabetModes={completedAlphabetModes}
            onLogout={handleLogout}
          />
        )}
        <main className={isSidebarOpen ? 'app-authenticated-content' : 'app-authenticated-content sidebar-collapsed'}>
          <Suspense fallback={<section className="app-loading" aria-live="polite">Loading...</section>}>{renderView()}</Suspense>
        </main>
      </div>
    </Routing>
  );
}

export default App;
