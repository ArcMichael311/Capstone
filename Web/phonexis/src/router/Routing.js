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

export default function Routing({ children }) {
  return children;
}