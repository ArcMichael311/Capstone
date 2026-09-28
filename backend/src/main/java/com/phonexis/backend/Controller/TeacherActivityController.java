package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.TeacherActivityService;

@RestController
@RequestMapping("/api/teacher-activities")
public class TeacherActivityController {
	private final TeacherActivityService activityService;

	public TeacherActivityController(TeacherActivityService activityService) {
		this.activityService = activityService;
	}

	@GetMapping("/teacher/{teacherId}")
	public ResponseEntity<List<TeacherActivityService.ActivityResponse>> listActivities(@PathVariable Long teacherId) {
		return ResponseEntity.ok(activityService.listActivities(teacherId));
	}

	@PostMapping("/teacher/{teacherId}")
	public ResponseEntity<TeacherActivityService.ActivityResponse> createActivity(
		@PathVariable Long teacherId,
		@RequestBody TeacherActivityService.CreateActivityRequest request
	) {
		return ResponseEntity.ok(activityService.createActivity(teacherId, request));
	}
}
