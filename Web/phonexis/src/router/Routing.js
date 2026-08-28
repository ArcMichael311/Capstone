import { useEffect } from 'react';

export const routes = {
  login: '/login',
  register: '/register',
  forgotpassword: '/forgot-password',
  reset: '/reset-password',
  dashboard: '/dashboard',
  modules: '/modules',
  alphabet: '/alphabet',
  vowels: '/vowels',
  consonants: '/consonants',
  cvc: '/cvc',
  profile: '/profile',
  admin: '/admin',
  teacher: '/teacher',
};

const viewsByPath = Object.fromEntries(Object.entries(routes).map(([view, path]) => [path, view]));

const sectionsByView = {
  alphabet: ['easy', 'medium', 'hard', 'alphaquest'],
  vowels: ['learning', 'lesson', 'pretest', 'vowelrush'],
  consonants: ['learning', 'explore', 'teacher', 'game', 'wordblast'],
  cvc: ['learning', 'families', 'selection', 'building'],
  profile: ['info', 'settings'],
};

export function getViewFromPath(pathname) {
  const normalizedPath = pathname.replace(/\/$/, '');
  const basePath = `/${normalizedPath.split('/')[1] || ''}`;
  return viewsByPath[basePath] || 'login';
}

export function getPathForView(view) {
  return routes[view] || routes.login;
}

export function getSectionFromPath(pathname, view = getViewFromPath(pathname)) {
  const section = pathname.replace(/\/$/, '').split('/').pop();
  return sectionsByView[view]?.includes(section) ? section : null;
}

export function getPathForSection(view, section) {
  const path = getPathForView(view);
  return section && sectionsByView[view]?.includes(section) ? `${path}/${section}` : path;
}

export default function Routing({ children, activeView, activeSection, onNavigate }) {
  useEffect(() => {
    const handlePopState = () => {
        const nextView = getViewFromPath(window.location.pathname);
        onNavigate?.(nextView, getSectionFromPath(window.location.pathname, nextView));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onNavigate]);

  useEffect(() => {
    if (!activeView) {
      return;
    }

    const nextPath = getPathForSection(activeView, activeSection);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ section: activeSection || null }, '', nextPath);
    }
  }, [activeSection, activeView]);

  return children;
}