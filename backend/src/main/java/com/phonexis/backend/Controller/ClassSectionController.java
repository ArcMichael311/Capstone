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
import org.springframework.security.access.prepost.PreAuthorize;

import com.phonexis.backend.Config.AccessGuard;
import com.phonexis.backend.Service.ClassSectionService;

@RestController
@RequestMapping("/api/classes")
public class ClassSectionController {
	private final ClassSectionService classSectionService;
	private final AccessGuard accessGuard;

	public ClassSectionController(ClassSectionService classSectionService, AccessGuard accessGuard) {
		this.accessGuard = accessGuard;
		this.classSectionService = classSectionService;
	}

	@GetMapping("/teacher/{teacherId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<List<ClassSectionService.ClassResponse>> listClasses(@PathVariable Long teacherId) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(classSectionService.listClasses(teacherId));
	}

	@GetMapping("/available-students")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<List<ClassSectionService.AvailableStudentResponse>> listAvailableStudents() {
		return ResponseEntity.ok(classSectionService.listAvailableStudents());
	}

	@GetMapping("/student/{studentId}")
	public ResponseEntity<ClassSectionService.StudentClassResponse> getClassForStudent(@PathVariable Long studentId) {
		accessGuard.requireSelfOrStaff(studentId);
		return ResponseEntity.ok(classSectionService.getClassForStudent(studentId));
	}

	@PostMapping("/teacher/{teacherId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<ClassSectionService.ClassResponse> createClass(
		@PathVariable Long teacherId,
		@RequestBody ClassSectionService.CreateClassRequest request
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(classSectionService.createClass(teacherId, request));
	}

	@GetMapping("/{classId}")
	public ResponseEntity<ClassSectionService.ClassResponse> getClass(@PathVariable Long classId) {
		return ResponseEntity.ok(classSectionService.getClass(classId));
	}

	@DeleteMapping("/{classId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<MessageResponse> deleteClass(@PathVariable Long classId, @RequestParam Long teacherId) {
		accessGuard.requireSelfOrAdmin(teacherId);
		classSectionService.deleteClass(classId, teacherId);
		return ResponseEntity.ok(new MessageResponse("Class deleted successfully"));
	}

	@GetMapping("/{classId}/students")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<List<ClassSectionService.StudentResponse>> listStudents(@PathVariable Long classId) {
		return ResponseEntity.ok(classSectionService.listStudents(classId));
	}

	@PostMapping("/{classId}/students")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<ClassSectionService.AddStudentsResponse> addStudents(
		@PathVariable Long classId,
		@RequestParam Long teacherId,
		@RequestBody ClassSectionService.AddStudentsRequest request
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		return ResponseEntity.ok(classSectionService.addStudents(classId, teacherId, request));
	}

	@DeleteMapping("/{classId}/students/{studentId}")
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public ResponseEntity<MessageResponse> removeStudent(
		@PathVariable Long classId,
		@PathVariable Long studentId,
		@RequestParam Long teacherId
	) {
		accessGuard.requireSelfOrAdmin(teacherId);
		classSectionService.removeStudent(classId, teacherId, studentId);
		return ResponseEntity.ok(new MessageResponse("Student removed successfully"));
	}

	public record MessageResponse(String message) { }
}
