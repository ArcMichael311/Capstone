import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Modules from './components/Modules';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import AlphabetRecognition from './components/Modules/AlphabetRecognition';
import CVCWords from './components/Modules/CVCWords';
import Vowels from './components/Modules/Vowels';
import Consonants from './components/Modules/Consonants';
import Admin from './components/Admin/Admin';
import Teacher from './components/Teacher/Teacher';
import Sidebar from './components/Sidebar/Sidebar';
import Routing, { getSectionFromPath, getViewFromPath } from './router/Routing';
import {
  supabase,
  fetchBackendUsers,
  fetchBackendProgress,
  joinBackendClass,
  updateBackendModuleProgress,
  updateBackendModuleVideos,
} from './lib/supabaseClient';

function App() {
  const ADMIN_EMAIL = 'phonexisadmin@gmail.com';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState(() => getViewFromPath(window.location.pathname));
  const [activeSection, setActiveSection] = useState(() => getSectionFromPath(window.location.pathname));
  const [, setNavigationHistory] = useState([]);
  const audioRef = useRef(null);
  const activeViewRef = useRef('login');
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [activeModule, setActiveModule] = useState('alphabet');
  const [currentUser, setCurrentUser] = useState(null);
  const [resetEmail, setResetEmail] = useState(null);
  const [completedPretests, setCompletedPretests] = useState([]);
  const [completedAlphabetModes, setCompletedAlphabetModes] = useState([]); // Track easy, medium, hard
  const [alphabetScores, setAlphabetScores] = useState({});
  const [vowelsCompleted, setVowelsCompleted] = useState(false);
  const [consonantsCompleted, setConsonantsCompleted] = useState(false);
  const [cvcCompleted, setCvcCompleted] = useState(false);
  const [vowelsWatchedVideos, setVowelsWatchedVideos] = useState([]);
  const [consonantsWatchedVideos, setConsonantsWatchedVideos] = useState([]);
  const [cvcWatchedVideos, setCvcWatchedVideos] = useState([]);
  const [isProgressHydrated, setIsProgressHydrated] = useState(false);
  const [backendUserId, setBackendUserId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  const mapAuthUserToProfile = useCallback((user) => {
    if (!user) {
      return null;
    }

    const normalizedEmail = String(user.email || user.user_metadata?.email || '').trim().toLowerCase();
    const isAdminEmail = normalizedEmail === ADMIN_EMAIL;
    const firstname = user.user_metadata?.firstname || user.user_metadata?.firstName || user.firstname || user.firstName || '';
    const lastname = user.user_metadata?.lastname || user.user_metadata?.lastName || user.lastname || user.lastName || '';
    const role = isAdminEmail ? 'admin' : user.user_metadata?.role || user.role || 'student';

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

    if (email === ADMIN_EMAIL) {
      return {
        ...profile,
        role: 'admin',
        user_metadata: {
          ...(profile.user_metadata || {}),
          role: 'admin',
        },
      };
    }

    try {
      const backendUsers = await fetchBackendUsers();
      if (backendUsers.error || !Array.isArray(backendUsers.data)) {
        return profile;
      }

      const backendUser = backendUsers.data.find((entry) => String(entry?.email || '').trim().toLowerCase() === email);
      if (!backendUser?.role) {
        return profile;
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
      return profile;
    }
  }, []);

  const getLandingViewByRole = useCallback((userProfile) => {
    const email = String(userProfile?.email || userProfile?.user_metadata?.email || '').trim().toLowerCase();
    if (email === ADMIN_EMAIL) {
      return 'admin';
    }

    const normalizedRole = String(userProfile?.role || userProfile?.user_metadata?.role || '').toLowerCase();
    if (normalizedRole === 'admin') {
      return 'admin';
    }

    if (normalizedRole === 'teacher') {
      return 'teacher';
    }

    return 'dashboard';
  }, []);

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
    let cancelled = false;

    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user;

      if (cancelled || !sessionUser) {
        return;
      }

      const mappedUser = mapAuthUserToProfile(sessionUser);
      const roleAwareUser = await applyBackendRole(mappedUser);
      if (cancelled) {
        return;
      }

      setCurrentUser(roleAwareUser);
      setIsAuthenticated(true);
      setActiveView((currentView) => (currentView === 'login' ? getLandingViewByRole(roleAwareUser) : currentView));
    };

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setNavigationHistory([]);
        setActiveView('login');
        return;
      }

      const syncProfile = async () => {
        const mappedUser = mapAuthUserToProfile(session.user);
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
  }, [mapAuthUserToProfile, applyBackendRole, getLandingViewByRole]);

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
    setVowelsCompleted(!!snapshot.vowelsCompleted);
    setConsonantsCompleted(!!snapshot.consonantsCompleted);
    setCvcCompleted(!!snapshot.cvcCompleted);
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

    return {
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
      consonantsCompleted: !!(consonantsProgress?.pretestCompleted || consonantsProgress?.completionPercentage >= 100),
      cvcCompleted: !!(cvcProgress?.pretestCompleted || cvcProgress?.completionPercentage >= 100),
      vowelsWatchedVideos: parseVideoIds(vowelsProgress?.videosWatched),
      consonantsWatchedVideos: parseVideoIds(consonantsProgress?.videosWatched),
      cvcWatchedVideos: parseVideoIds(cvcProgress?.videosWatched),
    };
  }, [parseVideoIds]);

  const resetProgressState = useCallback(() => {
    setCompletedPretests([]);
    setCompletedAlphabetModes([]);
    setAlphabetScores({});
    setVowelsCompleted(false);
    setConsonantsCompleted(false);
    setCvcCompleted(false);
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

    const backendUsers = await fetchBackendUsers();
    if (backendUsers.error || !Array.isArray(backendUsers.data)) {
      return null;
    }

    const matchedUser = backendUsers.data.find((entry) => String(entry?.email || '').trim().toLowerCase() === email);
    return matchedUser?.id ?? null;
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

  // Load progress for the current user when they log in
  useEffect(() => {
    if (!currentUser) {
      resetProgressState();
      return;
    }

    let cancelled = false;

    const loadProgress = async () => {
      resetProgressState();

      const resolvedBackendUserId = await resolveBackendUserId(currentUser);

      if (!cancelled) {
        setBackendUserId(resolvedBackendUserId);
      }

      try {
        const key = getProgressKey(currentUser);
        const raw = key ? localStorage.getItem(key) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          applyProgressSnapshot(parsed);
        } else {
          applyProgressSnapshot({});
        }
      } catch (error) {
        applyProgressSnapshot({});
      }

      if (resolvedBackendUserId) {
        const backendResult = await fetchBackendProgress(resolvedBackendUserId);
        if (!cancelled && !backendResult.error && Array.isArray(backendResult.data) && backendResult.data.length > 0) {
          applyProgressSnapshot(mapBackendProgressToSnapshot(backendResult.data));
        }
      }

      if (!cancelled) {
        setIsProgressHydrated(true);
      }
    };

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, [currentUser, applyProgressSnapshot, mapBackendProgressToSnapshot, resolveBackendUserId, resetProgressState]);

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

    if (!backendUserId) {
      return;
    }

    const syncBackendProgress = async () => {
      await Promise.all([
        updateBackendModuleProgress(backendUserId, 'alphabet', {
          easyModeCompleted: completedPretests.includes('easy'),
          mediumModeCompleted: completedPretests.includes('medium'),
          hardModeCompleted: completedPretests.includes('hard'),
        }),
        updateBackendModuleVideos(backendUserId, 'vowels', vowelsWatchedVideos),
        updateBackendModuleVideos(backendUserId, 'consonants', consonantsWatchedVideos),
        updateBackendModuleVideos(backendUserId, 'cvc', cvcWatchedVideos),
        updateBackendModuleProgress(backendUserId, 'vowels', {
          pretestCompleted: vowelsCompleted,
        }),
        updateBackendModuleProgress(backendUserId, 'consonants', {
          pretestCompleted: consonantsCompleted,
        }),
        updateBackendModuleProgress(backendUserId, 'cvc', {
          pretestCompleted: cvcCompleted,
        }),
      ]);
    };

    void syncBackendProgress();
  }, [currentUser, backendUserId, isProgressHydrated, completedPretests, completedAlphabetModes, alphabetScores, vowelsCompleted, consonantsCompleted, cvcCompleted, vowelsWatchedVideos, consonantsWatchedVideos, cvcWatchedVideos]);

  // Background music effect
  useEffect(() => {
    const pauseAudioSafely = () => {
      if (!audioRef.current) {
        return;
      }

      try {
        audioRef.current.pause();
      } catch (error) {
        if (error?.name !== 'NotImplementedError') {
          throw error;
        }
      }
    };

    if (!audioRef.current) {
      audioRef.current = new Audio('/background-music/Children\'s Music  Happy Upbeat Music (Instrumental Music For Kids).mp3');
      audioRef.current.loop = true;
    }

    audioRef.current.volume = musicVolume;

    // Play music when user is authenticated (on dashboard)
    if (isAuthenticated && activeView === 'dashboard') {
      audioRef.current.play().catch(err => {
        console.log('Audio autoplay prevented. User interaction required:', err);
      });
    } else {
      // Pause music when not on dashboard or not authenticated
      pauseAudioSafely();
    }

    return () => {
      // Cleanup on unmount
      pauseAudioSafely();
    };
  }, [isAuthenticated, activeView, musicVolume]);

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
    if (score !== total) {
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
    setActiveView('dashboard');
  };

  const handleConsonantsComplete = () => {
    setConsonantsCompleted(true);
    setActiveView('dashboard');
  };

  const handleCvcComplete = () => {
    setCvcCompleted(true);
    setActiveView('dashboard');
  };

  const handleAuthSuccess = (userProfile) => {
    const mappedProfile = userProfile ? mapAuthUserToProfile(userProfile) : null;

    if (userProfile) {
      setCurrentUser(mappedProfile);
    }

    setIsAuthenticated(true);
    setNavigationHistory([]);
    setActiveView(getLandingViewByRole(mappedProfile));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // ignore sign-out errors and clear local state anyway
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
    setNavigationHistory([]);
    setActiveView('login');
  };

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

    const normalizedRole = String(currentUser?.role || currentUser?.user_metadata?.role || '').toLowerCase();
    const isAdminUser = normalizedRole === 'admin';
    const isTeacherUser = normalizedRole === 'teacher';

    if (isAdminUser) {
      return (
        <Admin
          onNavigate={navigateTo}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
      );
    }

    if (isTeacherUser) {
      return (
        <Teacher
          onNavigate={navigateTo}
          onLogout={handleLogout}
          user={currentUser}
          backendUserId={backendUserId}
          onProfileRefresh={refreshCurrentUserFromBackend}
        />
      );
    }

    switch (activeView) {
      case 'alphabet':
        return (
          <AlphabetRecognition
            onPretestComplete={handlePretestComplete}
            onProgressUpdate={handleAlphabetModeComplete}
            onBack={() => goBack('dashboard')}
            completedModes={completedAlphabetModes}
            alphabetScores={alphabetScores}
            initialSection={activeSection}
            onNavigate={navigateTo}
          />
        );
      case 'cvc':
        if (!cvcUnlocked) {
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
            />
          );
        }

        return (
          <CVCWords
            onComplete={handleCvcComplete}
            onBack={() => goBack('dashboard')}
            initialVideosWatched={cvcWatchedVideos}
            onVideosWatchedChange={setCvcWatchedVideos}
            initialType={activeSection || 'learning'}
          />
        );
      case 'vowels':
        if (!vowelsUnlocked) {
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
            />
          );
        }

        return (
          <Vowels
            onComplete={handleVowelsComplete}
            onBack={() => goBack('dashboard')}
            initialVideosWatched={vowelsWatchedVideos}
            onVideosWatchedChange={setVowelsWatchedVideos}
            initialMode={activeSection || 'learning'}
          />
        );
      case 'consonants':
        if (!consonantsUnlocked) {
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
            />
          );
        }

        return (
          <Consonants
            onComplete={handleConsonantsComplete}
            onBack={() => goBack('dashboard')}
            initialVideosWatched={consonantsWatchedVideos}
            onVideosWatchedChange={setConsonantsWatchedVideos}
            isCompleted={consonantsCompleted}
            initialMode={activeSection || 'learning'}
          />
        );
      case 'modules':
        return (
          <Modules
            activeModule={activeModule}
            onNavigate={setActiveView}
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
            initialTab={activeSection || 'info'}
          />
        );
      case 'admin':
        return (
          <Admin
            onNavigate={setActiveView}
            onLogout={handleLogout}
            onJoinClass={handleJoinClass}
            classroom={currentUser?.classroom || currentUser?.user_metadata?.classroom || null}
          />
        );
      case 'teacher':
        return (
          <Teacher
            onNavigate={setActiveView}
            onLogout={handleLogout}
            user={currentUser}
            backendUserId={backendUserId}
            onProfileRefresh={refreshCurrentUserFromBackend}
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
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
          activeView={activeView}
          activeSection={activeSection}
          currentUser={currentUser}
          onNavigate={navigateTo}
          onSelectModule={openModule}
          alphabetProgress={alphabetProgress}
          vowelsProgress={vowelsProgress}
          consonantsProgress={consonantsProgress}
          cvcProgress={cvcProgress}
          alphabetScores={alphabetScores}
          onLogout={handleLogout}
        />
        <main className={isSidebarOpen ? 'app-authenticated-content' : 'app-authenticated-content sidebar-collapsed'}>{renderView()}</main>
      </div>
    </Routing>
  );
}

export default App;
