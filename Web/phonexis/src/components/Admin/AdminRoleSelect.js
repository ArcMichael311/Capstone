import React, { useState } from 'react';
import { updateBackendUser } from '../../lib/supabaseClient';
import { ROLE_OPTIONS, getRoleLabel, toFullName } from './adminHelpers';

// Lets an admin switch an account between Student (Normal), Teacher and Admin.
// The backend enforces the same rules (no self-change, at least one admin remains).
export default function AdminRoleSelect({ user, currentUserId, disabled, onChanged, onError }) {
  const [saving, setSaving] = useState(false);
  const role = String(user?.role || 'student').toLowerCase();
  const isSelf = currentUserId != null && String(currentUserId) === String(user?.id);

  const handleChange = async (event) => {
    const nextRole = event.target.value;
    if (nextRole === role) {
      return;
    }

    const name = toFullName(user);
    const warning = nextRole === 'admin'
      ? `\n\nAdmins can manage every account, including other admins.`
      : '';
    if (!window.confirm(`Change ${name}'s role from ${getRoleLabel(role)} to ${getRoleLabel(nextRole)}?${warning}`)) {
      event.target.value = role;
      return;
    }

    setSaving(true);
    try {
      const result = await updateBackendUser(user.id, { role: nextRole });
      if (result.error) {
        event.target.value = role;
        onError?.(result.error.message || 'Failed to update role');
        return;
      }
      await onChanged?.(`${name} is now ${getRoleLabel(nextRole)}.`);
    } catch (error) {
      event.target.value = role;
      onError?.('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      className="admin-role-select"
      value={role}
      onChange={handleChange}
      disabled={disabled || saving || isSelf}
      title={isSelf ? "You can't change your own role" : 'Change role'}
      aria-label={`Role for ${toFullName(user)}`}
    >
      {ROLE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}
