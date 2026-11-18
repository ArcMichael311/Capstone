package com.phonexis.backend.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.AuthService;
import com.phonexis.backend.Service.UserService;
import com.phonexis.backend.Config.SessionAuthenticationFilter;
import com.phonexis.backend.Config.CsrfCookieFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(
		@RequestBody RegisterRequest request,
		@RequestHeader(name = "X-Device-Id", required = false) String deviceHeader
	) {
		UserService.UserProfile user = authService.register(request.firstname(), request.lastname(), request.email(), request.password(), request.role(), resolveDeviceId(request.deviceId(), deviceHeader));
		return ResponseEntity.ok(new AuthResponse(user));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(
		@RequestBody LoginRequest request,
		@RequestHeader(name = "X-Device-Id", required = false) String deviceHeader,
		HttpServletRequest servletRequest,
		HttpServletResponse servletResponse
	) {
		if (request == null || request.email() == null || request.email().isBlank()
			|| request.password() == null || request.password().isBlank()) {
			throw new org.springframework.web.server.ResponseStatusException(
				org.springframework.http.HttpStatus.BAD_REQUEST, "Email and password are required");
		}

		UserService.AuthSession session = authService.login(
			request.email(), request.password(), resolveDeviceId(request.deviceId(), deviceHeader));
		servletResponse.addHeader("Set-Cookie", createSessionCookie(
			session.sessionToken(), 8 * 60 * 60, servletRequest).toString());
		servletResponse.addHeader("Set-Cookie",
			CsrfCookieFilter.createCsrfCookie(
				CsrfCookieFilter.createToken(), 8 * 60 * 60, servletRequest).toString());
		return ResponseEntity.ok(new AuthResponse(session.user()));
	}

	@PostMapping("/restore-session")
	public ResponseEntity<AuthResponse> restoreSession(
		@RequestBody RestoreSessionRequest request,
		@RequestHeader(name = "X-Device-Id", required = false) String deviceHeader,
		HttpServletRequest servletRequest,
		HttpServletResponse servletResponse
	) {
		String accessToken = request == null ? null : request.accessToken();
		String deviceId = resolveDeviceId(request == null ? null : request.deviceId(), deviceHeader);
		UserService.AuthSession session = authService.restoreSupabaseSession(accessToken, deviceId);
		servletResponse.addHeader("Set-Cookie", createSessionCookie(
			session.sessionToken(), 8 * 60 * 60, servletRequest).toString());
		servletResponse.addHeader("Set-Cookie",
			CsrfCookieFilter.createCsrfCookie(
				CsrfCookieFilter.createToken(), 8 * 60 * 60, servletRequest).toString());
		return ResponseEntity.ok(new AuthResponse(session.user()));
	}

	@PostMapping("/verify-device")
	public ResponseEntity<MessageResponse> verifyDevice(@RequestBody DeviceRequest request, Authentication authentication) {
		authService.verifyDevice(authentication.getName(), request.deviceId());
		return ResponseEntity.ok(new MessageResponse("Device verified"));
	}

	@PostMapping("/logout")
	public ResponseEntity<MessageResponse> logout(
		@RequestBody DeviceRequest request,
		Authentication authentication,
		HttpServletRequest servletRequest,
		HttpServletResponse servletResponse
	) {
		authService.logout(authentication.getName(), request.deviceId());
		servletResponse.addHeader("Set-Cookie",
			createSessionCookie("", 0, servletRequest).toString());
		servletResponse.addHeader("Set-Cookie",
			CsrfCookieFilter.createCsrfCookie("", 0, servletRequest).toString());
		return ResponseEntity.ok(new MessageResponse("Device released"));
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<MessageResponse> forgotPassword(@RequestBody EmailRequest request) {
		authService.requestPasswordReset(request.email());
		return ResponseEntity.ok(new MessageResponse("If the account exists, password reset is ready."));
	}

	@PostMapping("/reset-password")
	public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
		authService.resetPassword(request.email(), request.token(), request.password());
		return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
	}

	@PostMapping("/change-password")
	public ResponseEntity<MessageResponse> changePassword(@RequestBody ChangePasswordRequest request, Authentication authentication) {
		authService.changePassword(authentication.getName(), request.currentPassword(), request.password());
		return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
	}

	@PostMapping("/session-change-password")
	public ResponseEntity<MessageResponse> sessionChangePassword(@RequestBody SessionChangePasswordRequest request, Authentication authentication) {
		authService.changePasswordWithoutCurrentPassword(authentication.getName(), request.password());
		return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
	}

	public record RegisterRequest(String firstname, String lastname, String email, String password, String role, String deviceId) {
	}

	public record LoginRequest(String email, String password, String deviceId) {
	}

	public record RestoreSessionRequest(String accessToken, String deviceId) {
	}

	public record DeviceRequest(String email, String deviceId) {
	}

	public record EmailRequest(String email) {
	}

	public record ResetPasswordRequest(String email, String token, String password) {
	}

	public record ChangePasswordRequest(String email, String currentPassword, String password) {
	}

	public record SessionChangePasswordRequest(String password) {
	}

	private String resolveDeviceId(String requestDeviceId, String deviceHeader) {
		return requestDeviceId == null || requestDeviceId.isBlank() ? deviceHeader : requestDeviceId;
	}

	private ResponseCookie createSessionCookie(String token, int maxAgeSeconds, HttpServletRequest request) {
		boolean secure = "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))
			|| request.isSecure();
		return ResponseCookie.from(SessionAuthenticationFilter.SESSION_COOKIE, token)
			.httpOnly(true)
			.secure(secure)
			.sameSite(secure ? "None" : "Lax")
			.path("/")
			.maxAge(maxAgeSeconds)
			.build();
	}

	public record AuthResponse(com.phonexis.backend.Service.UserService.UserProfile user) {
	}

	public record MessageResponse(String message) {
	}
}