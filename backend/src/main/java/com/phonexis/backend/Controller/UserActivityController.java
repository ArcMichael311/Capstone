package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Config.AccessGuard;
import com.phonexis.backend.Service.UserActivityService;
import com.phonexis.backend.Service.UserActivityService.ActivityDTO;

@RestController
@RequestMapping("/api/activity")
public class UserActivityController {
	private final UserActivityService activityService;
	private final AccessGuard accessGuard;

	public UserActivityController(UserActivityService activityService, AccessGuard accessGuard) {
		this.accessGuard = accessGuard;
		this.activityService = activityService;
	}

	@GetMapping("/user/{userId}")
	public ResponseEntity<List<ActivityDTO>> list(@PathVariable Long userId) {
		accessGuard.requireSelfOrStaff(userId);
		return ResponseEntity.ok(activityService.list(userId));
	}

	@PostMapping("/user/{userId}")
	public ResponseEntity<ActivityDTO> record(@PathVariable Long userId, @RequestBody ActivityRequest request) {
		accessGuard.requireSelfOrAdmin(userId);
		return ResponseEntity.ok(activityService.record(userId, request.moduleName(), request.action(), request.details()));
	}

	public record ActivityRequest(String moduleName, String action, String details) {
	}
}