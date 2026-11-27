package com.phonexis.backend.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Config.AccessGuard;
import com.phonexis.backend.Service.AuthService;
import com.phonexis.backend.Service.SupabaseAuthService;
import com.phonexis.backend.Service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;
	private final UserService userService;
	private final AccessGuard accessGuard;
	private final SupabaseAuthService supabaseAuthService;

	public AuthController(AuthService authService, UserService userService, AccessGuard accessGuard,
		SupabaseAuthService supabaseAuthService) {
		this.supabaseAuthService = supabaseAuthService;
		this.authService = authService;
		this.userService = userService;
		this.accessGuard = accessGuard;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(
		@RequestBody RegisterRequest request,
		@RequestHeader(name = "X-Device-Id", required = false) String deviceHeader
	) {
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
		}
		UserService.UserProfile user = authService.register(request.firstname(), request.lastname(), request.email(),
			request.password(), request.role(), resolveDeviceId(request.deviceId(), deviceHeader));
		return ResponseEntity.ok(new AuthResponse(user, null));
	}

	/**
	 * Login after the browser signed in with Supabase. The Supabase access token proves the
	 * password was correct, so the backend's own password copy (which may be outdated after a
	 * Supabase password reset) is not compared. The backend account is created on first use.
	 */
	@PostMapping("/supabase-login")
	public ResponseEntity<AuthResponse> supabaseLogin(
		@RequestBody SupabaseLoginRequest request,
		@RequestHeader(name = "X-Device-Id", required = false) String deviceHeader
	) {
		if (request == null || request.accessToken() == null || request.accessToken().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supabase access token is required");
		}
		SupabaseAuthService.SupabaseUser supabaseUser = supabaseAuthService.verifyAccessToken(request.accessToken());

		UserService.AuthSession session = userService.loginVerifiedSupabaseUser(
			supabaseUser.email(),
			firstNonBlank(supabaseUser.firstName(), request.firstname()),
			firstNonBlank(supabaseUser.lastName(), request.lastname()),
			request.password(),
			resolveDeviceId(request.deviceId(), deviceHeader));
		return ResponseEntity.ok(new AuthResponse(session.user(), session.accessToken()));
	}

	private static String firstNonBlank(String first, String second) {
		return first != null && !first.isBlank() ? first : second;
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(
		@RequestBody LoginRequest request,
		@RequestHeader(name = "X-Device-Id", required = false) String deviceHeader
	) {
		if (request == null || request.email() == null || request.email().isBlank()
			|| request.password() == null || request.password().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
		}
		// Same rule as registration.
		if (request.password().length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		UserService.AuthSession session = authService.login(request.email(), request.password(),
			resolveDeviceId(request.deviceId(), deviceHeader));
		return ResponseEntity.ok(new AuthResponse(session.user(), session.accessToken()));
	}

	/** Returns the logged-in user's own profile (id, role, class). Used to restore a session after a page refresh. */
	@GetMapping("/me")
	public ResponseEntity<AuthResponse> me() {
		return ResponseEntity.ok(new AuthResponse(userService.getUser(accessGuard.currentUser().id()), null));
	}

	@PostMapping("/verify-device")
	public ResponseEntity<MessageResponse> verifyDevice(@RequestBody DeviceRequest request, Authentication authentication) {
		authService.verifyDevice(authentication.getName(), request == null ? null : request.deviceId());
		return ResponseEntity.ok(new MessageResponse("Device verified"));
	}

	@PostMapping("/logout")
	public ResponseEntity<MessageResponse> logout(@RequestBody DeviceRequest request, Authentication authentication) {
		authService.logout(authentication.getName(), request == null ? null : request.deviceId());
		return ResponseEntity.ok(new MessageResponse("Device released"));
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<MessageResponse> forgotPassword(@RequestBody EmailRequest request) {
		authService.requestPasswordReset(request == null ? null : request.email());
		return ResponseEntity.ok(new MessageResponse("If the account exists, password reset is ready."));
	}

	@PostMapping("/reset-password")
	public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
		}
		authService.resetPassword(request.email(), request.token(), request.password());
		return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
	}

	@PostMapping("/change-password")
	public ResponseEntity<MessageResponse> changePassword(@RequestBody ChangePasswordRequest request, Authentication authentication) {
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
		}
		// Always use the authenticated identity; the email in the body is ignored.
		authService.changePassword(authentication.getName(), request.currentPassword(), request.password());
		return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
	}

	@PostMapping("/session-change-password")
	public ResponseEntity<MessageResponse> sessionChangePassword(@RequestBody SessionChangePasswordRequest request, Authentication authentication) {
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
		}
		authService.changePasswordWithoutCurrentPassword(authentication.getName(), request.password());
		return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
	}

	private String resolveDeviceId(String requestDeviceId, String deviceHeader) {
		return requestDeviceId == null || requestDeviceId.isBlank() ? deviceHeader : requestDeviceId;
	}

	public record RegisterRequest(String firstname, String lastname, String email, String password, String role, String deviceId) {
	}

	public record LoginRequest(String email, String password, String deviceId) {
	}

	public record SupabaseLoginRequest(String accessToken, String password, String firstname, String lastname, String deviceId) {
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

	public record AuthResponse(UserService.UserProfile user, String accessToken) {
	}

	public record MessageResponse(String message) {
	}
}
