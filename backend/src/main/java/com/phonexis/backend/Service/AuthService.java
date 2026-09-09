package com.phonexis.backend.Service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
	private final UserService userService;

	public AuthService(UserService userService) {
		this.userService = userService;
	}

	public UserService.UserProfile register(String firstname, String lastname, String email, String password, String role, String deviceId) {
		if (firstname == null || firstname.trim().isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Firstname is required");
		}

		if (lastname == null || lastname.trim().isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lastname is required");
		}

		return userService.createUser(new UserService.CreateUserRequest(firstname, lastname, email, password, role, deviceId));
	}

	public UserService.UserProfile login(String email, String password, String deviceId) {
		return userService.login(email, password, deviceId);
	}

	public void verifyDevice(String email, String deviceId) {
		userService.verifyDevice(email, deviceId);
	}

	public void logout(String email, String deviceId) {
		userService.logout(email, deviceId);
	}

	public void requestPasswordReset(String email) {
		String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
		if (normalizedEmail.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}
	}

	public void resetPassword(String email, String password) {
		userService.resetPassword(email, password);
	}

	public void changePassword(String email, String currentPassword, String password) {
		userService.changePassword(email, currentPassword, password);
	}
}