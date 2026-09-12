package com.phonexis.backend.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.ClassEnrollment;
import com.phonexis.backend.Entity.ClassSection;
import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.ClassEnrollmentRepository;
import com.phonexis.backend.Repository.ClassSectionRepository;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class ClassSectionService {
	private final ClassSectionRepository classSectionRepository;
	private final ClassEnrollmentRepository classEnrollmentRepository;
	private final UserRepository userRepository;
	private final LearningMaterialService learningMaterialService;

	public ClassSectionService(
		ClassSectionRepository classSectionRepository,
		ClassEnrollmentRepository classEnrollmentRepository,
		UserRepository userRepository,
		LearningMaterialService learningMaterialService
	) {
		this.classSectionRepository = classSectionRepository;
		this.classEnrollmentRepository = classEnrollmentRepository;
		this.userRepository = userRepository;
		this.learningMaterialService = learningMaterialService;
	}

	@Transactional(readOnly = true)
	public List<ClassResponse> listClasses(Long teacherId) {
		User teacher = getTeacher(teacherId);
		return classSectionRepository.findByTeacherOrderByCreatedAtDesc(teacher).stream()
			.map(this::toClassResponse)
			.toList();
	}

	@Transactional
	public ClassResponse createClass(Long teacherId, CreateClassRequest request) {
		User teacher = getTeacher(teacherId);
		String name = clean(request.name());
		if (name.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section name is required");
		}

		ClassSection classSection = new ClassSection();
		classSection.setTeacher(teacher);
		classSection.setName(name);
		return toClassResponse(classSectionRepository.save(classSection));
	}

	@Transactional(readOnly = true)
	public ClassResponse getClass(Long classId) {
		return toClassResponse(getClassEntity(classId));
	}

	@Transactional
	public void deleteClass(Long classId, Long teacherId) {
		ClassSection classSection = getOwnedClass(classId, teacherId);
		learningMaterialService.deleteAllForClass(classSection);
		classEnrollmentRepository.deleteByClassSection(classSection);
		classSectionRepository.delete(classSection);
	}

	@Transactional(readOnly = true)
	public List<StudentResponse> listStudents(Long classId) {
		ClassSection classSection = getClassEntity(classId);
		return classEnrollmentRepository.findByClassSectionOrderByAddedAtAsc(classSection).stream()
			.map(enrollment -> toStudentResponse(enrollment.getStudent(), enrollment.getAddedAt()))
			.toList();
	}

	@Transactional
	public AddStudentsResponse addStudents(Long classId, Long teacherId, AddStudentsRequest request) {
		ClassSection classSection = getOwnedClass(classId, teacherId);

		List<String> added = new ArrayList<>();
		List<String> alreadyEnrolled = new ArrayList<>();
		List<String> notFound = new ArrayList<>();
		List<String> notStudent = new ArrayList<>();

		Set<String> requestedEmails = new LinkedHashSet<>();
		for (String rawEmail : request.emails() == null ? List.<String>of() : request.emails()) {
			String normalized = normalizeEmail(rawEmail);
			if (!normalized.isEmpty()) {
				requestedEmails.add(normalized);
			}
		}

		if (requestedEmails.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one student email is required");
		}

		for (String email : requestedEmails) {
			User student = userRepository.findByEmailIgnoreCase(email).orElse(null);
			if (student == null) {
				notFound.add(email);
				continue;
			}

			if (student.getRole() != User.Role.STUDENT) {
				notStudent.add(email);
				continue;
			}

			if (classEnrollmentRepository.existsByClassSectionAndStudent(classSection, student)) {
				alreadyEnrolled.add(email);
				continue;
			}

			ClassEnrollment enrollment = new ClassEnrollment();
			enrollment.setClassSection(classSection);
			enrollment.setStudent(student);
			classEnrollmentRepository.save(enrollment);
			added.add(email);
		}

		return new AddStudentsResponse(added, alreadyEnrolled, notFound, notStudent);
	}

	@Transactional
	public void removeStudent(Long classId, Long teacherId, Long studentId) {
		ClassSection classSection = getOwnedClass(classId, teacherId);
		User student = userRepository.findById(studentId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

		ClassEnrollment enrollment = classEnrollmentRepository.findByClassSectionAndStudent(classSection, student)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student is not enrolled in this class"));

		classEnrollmentRepository.delete(enrollment);
	}

	ClassSection getClassEntity(Long classId) {
		if (classId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class id is required");
		}

		return classSectionRepository.findById(classId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
	}

	ClassSection getOwnedClass(Long classId, Long teacherId) {
		ClassSection classSection = getClassEntity(classId);
		if (teacherId == null || !classSection.getTeacher().getUserId().equals(teacherId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This class does not belong to that teacher account");
		}
		return classSection;
	}

	private User getTeacher(Long teacherId) {
		User teacher = userRepository.findById(teacherId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
		if (teacher.getRole() != User.Role.TEACHER) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teacher accounts can manage classes");
		}
		return teacher;
	}

	private String clean(String value) { return value == null ? "" : value.trim(); }
	private String normalizeEmail(String value) { return value == null ? "" : value.trim().toLowerCase(); }

	private ClassResponse toClassResponse(ClassSection classSection) {
		long studentCount = classEnrollmentRepository.countByClassSection(classSection);
		return new ClassResponse(
			classSection.getClassId(),
			classSection.getTeacher().getUserId(),
			classSection.getName(),
			classSection.getCreatedAt(),
			studentCount
		);
	}

	private StudentResponse toStudentResponse(User student, LocalDateTime addedAt) {
		return new StudentResponse(
			student.getUserId(),
			student.getFirstName(),
			student.getLastName(),
			student.getEmail(),
			addedAt
		);
	}

	public record CreateClassRequest(String name) { }

	public record AddStudentsRequest(List<String> emails) { }

	public record AddStudentsResponse(List<String> added, List<String> alreadyEnrolled, List<String> notFound, List<String> notStudent) { }

	public record ClassResponse(Long id, Long teacherId, String name, LocalDateTime createdAt, long studentCount) { }

	public record StudentResponse(Long id, String firstName, String lastName, String email, LocalDateTime addedAt) { }
}
