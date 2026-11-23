package com.phonexis.backend.Config;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Ownership checks for endpoints that take a user/teacher/student id from the client.
 * Never trust ids sent by the browser: always compare them with the authenticated session.
 */
@Component
public class AccessGuard {

	public AuthenticatedUser currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
		}
		return user;
	}

	/** The caller must be the given user, or an admin. Use for writes and "act as" ids. */
	public void requireSelfOrAdmin(Long userId) {
		AuthenticatedUser user = currentUser();
		if (user.isAdmin() || (userId != null && userId.equals(user.id()))) {
			return;
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this resource");
	}

	/** The caller must be the given user, or a teacher/admin. Use for reading student data. */
	public void requireSelfOrStaff(Long userId) {
		AuthenticatedUser user = currentUser();
		if (user.isStaff() || (userId != null && userId.equals(user.id()))) {
			return;
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this resource");
	}
}
