package com.phonexis.backend.Config;

import java.security.Principal;

import com.phonexis.backend.Entity.User;

/**
 * Principal stored in the SecurityContext for every authenticated request.
 * getName() returns the email so existing code using Authentication#getName keeps working.
 */
public record AuthenticatedUser(Long id, String email, User.Role role) implements Principal {
	@Override
	public String getName() {
		return email;
	}

	public boolean isAdmin() {
		return role == User.Role.ADMIN;
	}

	public boolean isStaff() {
		return role == User.Role.ADMIN || role == User.Role.TEACHER;
	}
}
