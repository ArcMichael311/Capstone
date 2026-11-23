export const toFullName = (user) => {
  const firstName = user.user_metadata?.firstName || user.firstName || user.user_metadata?.firstname || user.firstname || '';
  const lastName = user.user_metadata?.lastName || user.lastName || user.user_metadata?.lastname || user.lastname || '';
  return `${firstName} ${lastName}`.trim() || 'Unknown user';
};

export const formatDate = (value) => {
  if (!value) {
    return 'Unknown';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getInitials = (name) => {
  const initials = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || '?';
};

// The three account roles. Each role has its own dashboard:
//   student -> normal learner dashboard (modules, games, progress)
//   teacher -> teacher dashboard (classes, materials, pretests)
//   admin   -> admin dashboard (manage every account and its role)
export const ROLE_OPTIONS = [
  { value: 'student', label: 'Student (Normal)' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' },
];

export const getRoleLabel = (role) => {
  const normalized = String(role || 'student').toLowerCase();
  return ROLE_OPTIONS.find((option) => option.value === normalized)?.label || 'Student (Normal)';
};
