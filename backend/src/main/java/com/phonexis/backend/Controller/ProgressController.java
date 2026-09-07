package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.ProgressService;
import com.phonexis.backend.Service.ProgressService.ProgressDTO;
import com.phonexis.backend.Service.ProgressService.UpdateProgressRequest;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {
	private final ProgressService progressService;

	public ProgressController(ProgressService progressService) {
		this.progressService = progressService;
	}

	@GetMapping("/user/{userId}")
	public ResponseEntity<List<ProgressDTO>> getUserProgress(@PathVariable Long userId) {
		List<ProgressDTO> progress = progressService.getUserProgress(userId);
		return ResponseEntity.ok(progress);
	}

	@GetMapping("/user/{userId}/module/{moduleName}")
	public ResponseEntity<ProgressDTO> getModuleProgress(
		@PathVariable Long userId,
		@PathVariable String moduleName
	) {
		ProgressDTO progress = progressService.getProgress(userId, moduleName);
		return ResponseEntity.ok(progress);
	}

	@PostMapping("/user/{userId}/module/{moduleName}/videos")
	public ResponseEntity<ProgressDTO> updateVideosWatched(
		@PathVariable Long userId,
		@PathVariable String moduleName,
		@RequestBody VideoWatchedRequest request
	) {
		ProgressDTO progress = progressService.updateVideosWatched(userId, moduleName, request.videoIds());
		return ResponseEntity.ok(progress);
	}

	@PutMapping("/user/{userId}/module/{moduleName}")
	public ResponseEntity<ProgressDTO> updateModuleProgress(
		@PathVariable Long userId,
		@PathVariable String moduleName,
		@RequestBody UpdateProgressRequest request
	) {
		ProgressDTO progress = progressService.updateModuleCompletion(userId, moduleName, request);
		return ResponseEntity.ok(progress);
	}

	@GetMapping("/user/{userId}/module/{moduleName}/can-access-lesson")
	public ResponseEntity<AccessCheckResponse> canAccessLesson(
		@PathVariable Long userId,
		@PathVariable String moduleName
	) {
		boolean canAccess = progressService.canAccessLesson(userId, moduleName);
		return ResponseEntity.ok(new AccessCheckResponse(canAccess, "User " + (canAccess ? "can" : "cannot") + " access lesson"));
	}

	@GetMapping("/user/{userId}/module/{moduleName}/can-access-pretest")
	public ResponseEntity<AccessCheckResponse> canAccessPretest(
		@PathVariable Long userId,
		@PathVariable String moduleName
	) {
		boolean canAccess = progressService.canAccessPretest(userId, moduleName);
		return ResponseEntity.ok(new AccessCheckResponse(canAccess, "User " + (canAccess ? "can" : "cannot") + " access pretest"));
	}

	// DTOs
	public record VideoWatchedRequest(List<Integer> videoIds) {
	}

	public record AccessCheckResponse(Boolean canAccess, String message) {
	}
}
