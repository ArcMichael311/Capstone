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
