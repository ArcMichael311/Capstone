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

export function getViewFromPath(pathname) {
  return viewsByPath[pathname.replace(/\/$/, '')] || 'login';
}

export function getPathForView(view) {
  return routes[view] || routes.login;
}

export default function Routing({ children, activeView, onNavigate }) {
  useEffect(() => {
    const handlePopState = () => {
      onNavigate?.(getViewFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onNavigate]);

  useEffect(() => {
    if (!activeView) {
      return;
    }

    const nextPath = getPathForView(activeView);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  }, [activeView]);

  return children;
}