package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {
	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping
	public ResponseEntity<List<UserService.UserProfile>> listUsers() {
		return ResponseEntity.ok(userService.listUsers());
	}

	@GetMapping("/{id}")
	public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
		return ResponseEntity.ok(new UserResponse(userService.getUser(id)));
	}

	@PostMapping
	public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request) {
		return ResponseEntity.ok(new UserResponse(
			userService.createUser(new UserService.CreateUserRequest(
				request.firstName(),
				request.lastName(),
				request.email(),
				request.password(),
				request.role()
			))
		));
	}

	@PutMapping("/{id}")
	public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
		return ResponseEntity.ok(new UserResponse(
			userService.updateUser(id, new UserService.UpdateUserRequest(
				request.firstName(),
				request.lastName(),
				request.email(),
				request.password(),
				request.role(),
				request.classroom(),
				request.classCode()
			))
		));
	}

	@PostMapping("/{id}/generate-class-code")
	public ResponseEntity<UserResponse> generateClassCode(@PathVariable Long id) {
		return ResponseEntity.ok(new UserResponse(userService.generateClassCode(id)));
	}

	@PostMapping("/{id}/join-class")
	public ResponseEntity<UserResponse> joinClass(@PathVariable Long id, @RequestBody JoinClassRequest request) {
		return ResponseEntity.ok(new UserResponse(userService.joinClass(id, request.classCode())));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id) {
		userService.deleteUser(id);
		return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
	}

	public record CreateUserRequest(String firstName, String lastName, String email, String password, String role) {
	}

	public record UpdateUserRequest(String firstName, String lastName, String email, String password, String role, String classroom, String classCode) {
	}

	public record JoinClassRequest(String classCode) {
	}

	public record UserResponse(UserService.UserProfile user) {
	}

	public record MessageResponse(String message) {
	}
}