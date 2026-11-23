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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import com.phonexis.backend.Config.AccessGuard;
import com.phonexis.backend.Service.PretestService;

@RestController
@RequestMapping("/api/pretests")
public class PretestController {
	private final PretestService pretestService;
	private final AccessGuard accessGuard;

	public PretestController(PretestService pretestService, AccessGuard accessGuard) {
		this.accessGuard = accessGuard;
		this.pretestService = pretestService;
	}

	@PostMapping("/class/{classId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<PretestService.PretestSummaryResponse> createPretest(
		@PathVariable Long classId,
		@RequestParam Long teacherId,
		@RequestBody PretestService.CreatePretestRequest request
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(pretestService.createPretest(classId, teacherId, request));
	}

	@GetMapping("/class/{classId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<List<PretestService.PretestSummaryResponse>> listPretests(@PathVariable Long classId) {
		return ResponseEntity.ok(pretestService.listPretests(classId));
	}

	@GetMapping("/class/{classId}/student/{studentId}")
	public ResponseEntity<List<PretestService.StudentPretestListItem>> listPretestsForStudent(
		@PathVariable Long classId,
		@PathVariable Long studentId
	) {
		accessGuard.requireSelfOrStaff(studentId);
		return ResponseEntity.ok(pretestService.listPretestsForStudent(classId, studentId));
	}

	@GetMapping("/{pretestId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<PretestService.PretestDetailResponse> getPretest(
		@PathVariable Long pretestId,
		@RequestParam Long teacherId
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(pretestService.getPretestForTeacher(pretestId, teacherId));
	}

	@PutMapping("/{pretestId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<PretestService.PretestSummaryResponse> updatePretest(
		@PathVariable Long pretestId,
		@RequestParam Long teacherId,
		@RequestBody PretestService.UpdatePretestRequest request
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(pretestService.updatePretest(pretestId, teacherId, request));
	}

	@DeleteMapping("/{pretestId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<MessageResponse> deletePretest(@PathVariable Long pretestId, @RequestParam Long teacherId) {
		accessGuard.requireSelfOrAdmin(teacherId);
		pretestService.deletePretest(pretestId, teacherId);
		return ResponseEntity.ok(new MessageResponse("Pretest deleted successfully"));
	}

	@PostMapping("/{pretestId}/questions")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<PretestService.QuestionResponse> addQuestion(
		@PathVariable Long pretestId,
		@RequestParam Long teacherId,
		@RequestBody PretestService.QuestionRequest request
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(pretestService.addQuestion(pretestId, teacherId, request));
	}

	@PutMapping("/questions/{questionId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<PretestService.QuestionResponse> updateQuestion(
		@PathVariable Long questionId,
		@RequestParam Long teacherId,
		@RequestBody PretestService.QuestionRequest request
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(pretestService.updateQuestion(questionId, teacherId, request));
	}

	@DeleteMapping("/questions/{questionId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<MessageResponse> deleteQuestion(@PathVariable Long questionId, @RequestParam Long teacherId) {
		accessGuard.requireSelfOrAdmin(teacherId);
		pretestService.deleteQuestion(questionId, teacherId);
		return ResponseEntity.ok(new MessageResponse("Question deleted successfully"));
	}

	@PostMapping(value = "/{pretestId}/audio", consumes = "multipart/form-data")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<PretestService.AudioUploadResponse> uploadAudio(
		@PathVariable Long pretestId,
		@RequestParam Long teacherId,
		@RequestParam("file") MultipartFile file
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(pretestService.uploadAudio(pretestId, teacherId, file));
	}

	@GetMapping("/{pretestId}/take")
	public ResponseEntity<PretestService.StudentPretestResponse> getPretestForStudent(
		@PathVariable Long pretestId,
		@RequestParam Long studentId
	) {
		accessGuard.requireSelfOrAdmin(studentId);
		return ResponseEntity.ok(pretestService.getPretestForStudent(pretestId, studentId));
	}

	@PostMapping("/{pretestId}/submit")
	@PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<PretestService.SubmitAttemptResponse> submitAttempt(
		@PathVariable Long pretestId,
		@RequestParam Long studentId,
		@RequestBody PretestService.SubmitAttemptRequest request
	) {
		accessGuard.requireSelfOrAdmin(studentId);
		return ResponseEntity.ok(pretestService.submitAttempt(pretestId, studentId, request));
	}

	@GetMapping("/{pretestId}/attempts")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<List<PretestService.AttemptResultResponse>> listAttempts(
		@PathVariable Long pretestId,
		@RequestParam Long teacherId
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(pretestService.listAttempts(pretestId, teacherId));
	}

	public record MessageResponse(String message) { }
}
