package com.phonexis.backend.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
		return ResponseEntity.ok(new AuthResponse(
			authService.register(request.firstname(), request.lastname(), request.email(), request.password(), request.role(), request.deviceId())
		));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
		return ResponseEntity.ok(new AuthResponse(authService.login(request.email(), request.password(), request.deviceId())));
	}

	@PostMapping("/verify-device")
	public ResponseEntity<MessageResponse> verifyDevice(@RequestBody DeviceRequest request) {
		authService.verifyDevice(request.email(), request.deviceId());
		return ResponseEntity.ok(new MessageResponse("Device verified"));
	}

	@PostMapping("/logout")
	public ResponseEntity<MessageResponse> logout(@RequestBody DeviceRequest request) {
		authService.logout(request.email(), request.deviceId());
		return ResponseEntity.ok(new MessageResponse("Device released"));
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<MessageResponse> forgotPassword(@RequestBody EmailRequest request) {
		authService.requestPasswordReset(request.email());
		return ResponseEntity.ok(new MessageResponse("If the account exists, password reset is ready."));
	}

	@PostMapping("/reset-password")
	public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
		authService.resetPassword(request.email(), request.password());
		return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
	}

	@PostMapping("/change-password")
	public ResponseEntity<MessageResponse> changePassword(@RequestBody ChangePasswordRequest request) {
		authService.changePassword(request.email(), request.currentPassword(), request.password());
		return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
	}

	public record RegisterRequest(String firstname, String lastname, String email, String password, String role, String deviceId) {
	}

	public record LoginRequest(String email, String password, String deviceId) {
	}

	public record DeviceRequest(String email, String deviceId) {
	}

	public record EmailRequest(String email) {
	}

	public record ResetPasswordRequest(String email, String password) {
	}

	public record ChangePasswordRequest(String email, String currentPassword, String password) {
	}

	public record AuthResponse(com.phonexis.backend.Service.UserService.UserProfile user) {
	}

	public record MessageResponse(String message) {
	}
}