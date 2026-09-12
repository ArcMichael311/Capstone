package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.ClassSectionService;

@RestController
@RequestMapping("/api/classes")
public class ClassSectionController {
	private final ClassSectionService classSectionService;

	public ClassSectionController(ClassSectionService classSectionService) {
		this.classSectionService = classSectionService;
	}

	@GetMapping("/teacher/{teacherId}")
	public ResponseEntity<List<ClassSectionService.ClassResponse>> listClasses(@PathVariable Long teacherId) {
		return ResponseEntity.ok(classSectionService.listClasses(teacherId));
	}

	@PostMapping("/teacher/{teacherId}")
	public ResponseEntity<ClassSectionService.ClassResponse> createClass(
		@PathVariable Long teacherId,
		@RequestBody ClassSectionService.CreateClassRequest request
	) {
		return ResponseEntity.ok(classSectionService.createClass(teacherId, request));
	}

	@GetMapping("/{classId}")
	public ResponseEntity<ClassSectionService.ClassResponse> getClass(@PathVariable Long classId) {
		return ResponseEntity.ok(classSectionService.getClass(classId));
	}

	@DeleteMapping("/{classId}")
	public ResponseEntity<MessageResponse> deleteClass(@PathVariable Long classId, @RequestParam Long teacherId) {
		classSectionService.deleteClass(classId, teacherId);
		return ResponseEntity.ok(new MessageResponse("Class deleted successfully"));
	}

	@GetMapping("/{classId}/students")
	public ResponseEntity<List<ClassSectionService.StudentResponse>> listStudents(@PathVariable Long classId) {
		return ResponseEntity.ok(classSectionService.listStudents(classId));
	}

	@PostMapping("/{classId}/students")
	public ResponseEntity<ClassSectionService.AddStudentsResponse> addStudents(
		@PathVariable Long classId,
		@RequestParam Long teacherId,
		@RequestBody ClassSectionService.AddStudentsRequest request
	) {
		return ResponseEntity.ok(classSectionService.addStudents(classId, teacherId, request));
	}

	@DeleteMapping("/{classId}/students/{studentId}")
	public ResponseEntity<MessageResponse> removeStudent(
		@PathVariable Long classId,
		@PathVariable Long studentId,
		@RequestParam Long teacherId
	) {
		classSectionService.removeStudent(classId, teacherId, studentId);
		return ResponseEntity.ok(new MessageResponse("Student removed successfully"));
	}

	public record MessageResponse(String message) { }
}
