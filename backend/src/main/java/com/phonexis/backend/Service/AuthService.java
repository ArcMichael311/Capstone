package com.phonexis.backend.Service;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AuthService {
	private final UserService userService;
	private static final Pattern EMAIL_FIELD = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"");

	@Value("${supabase.url:}")
	private String supabaseUrl;

	@Value("${supabase.service-role-key:}")
	private String supabaseServiceRoleKey;

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

		return userService.createUser(new UserService.CreateUserRequest(firstname, lastname, email, password, "STUDENT", deviceId));
	}

	public UserService.AuthSession login(String email, String password, String deviceId) {
		return userService.login(email, password, deviceId);
	}

	public UserService.AuthSession restoreSupabaseSession(String accessToken, String deviceId) {
		if (accessToken == null || accessToken.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Supabase session is missing");
		}
		if (supabaseUrl == null || supabaseUrl.isBlank()) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Authentication service is not configured");
		}

		try {
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(supabaseUrl.replaceAll("/$", "") + "/auth/v1/user"))
				.header("Authorization", "Bearer " + accessToken)
				.header("apikey", supabaseServiceRoleKey == null ? "" : supabaseServiceRoleKey)
				.GET()
				.build();
			HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() != 200) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Supabase session is invalid");
			}
			Matcher emailMatch = EMAIL_FIELD.matcher(response.body());
			if (!emailMatch.find()) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Supabase user email is missing");
			}
			String email = emailMatch.group(1).replace("\\u0040", "@");
			return userService.restoreSession(email, deviceId);
		} catch (ResponseStatusException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Unable to restore authentication", exception);
		}
	}

	public void verifyDevice(String email, String deviceId) {
		userService.verifyDevice(email, deviceId);
	}

	public void logout(String email, String deviceId) {
		userService.releaseDevice(email, deviceId);
	}

	public void requestPasswordReset(String email) {
		if (email == null || email.trim().isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}
		try {
			userService.requestPasswordReset(email);
		} catch (ResponseStatusException exception) {
			if (exception.getStatusCode().value() != 404) {
				throw exception;
			}
		}
	}

	public void resetPassword(String email, String token, String password) {
		userService.resetPassword(email, token, password);
	}

	public void changePassword(String email, String currentPassword, String password) {
		userService.changePassword(email, currentPassword, password);
	}

	public void changePasswordWithoutCurrentPassword(String email, String password) {
		userService.changePasswordWithoutCurrentPassword(email, password);
	}
}