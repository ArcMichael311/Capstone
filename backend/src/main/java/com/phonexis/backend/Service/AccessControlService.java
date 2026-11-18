package com.phonexis.backend.Service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class AccessControlService {
	private final UserRepository userRepository;

	public AccessControlService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	public void requireSelfOrElevated(Long targetUserId, Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
		}

		User currentUser = userRepository.findByEmailIgnoreCase(authentication.getName())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required"));

		if (currentUser.getUserId().equals(targetUserId)
			|| currentUser.getRole() == User.Role.ADMIN
			|| currentUser.getRole() == User.Role.TEACHER) {
			return;
		}

		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
	}
}
