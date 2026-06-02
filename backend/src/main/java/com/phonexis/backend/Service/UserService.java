package com.phonexis.backend.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Entity.User.Role;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class UserService {
	private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();
	private static final String CLASS_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private static final int CLASS_CODE_LENGTH = 6;
	private static final String ADMIN_EMAIL = "phonexisadmin@gmail.com";
	private static final Random RANDOM = new Random();

	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<UserProfile> listUsers() {
		return userRepository.findAll().stream().map(this::toUserProfile).toList();
	}

	@Transactional(readOnly = true)
	public UserProfile getUser(Long id) {
		return toUserProfile(getUserEntity(id));
	}

	@Transactional
	public UserProfile createUser(CreateUserRequest request) {
		String firstName = request.firstName() == null ? "" : request.firstName().trim();
		String lastName = request.lastName() == null ? "" : request.lastName().trim();
		String email = normalizeEmail(request.email());

		if (firstName.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First name is required");
		}

		if (lastName.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Last name is required");
		}

		if (email.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}

		if (request.password() == null || request.password().length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists");
		}

		User user = new User();
		user.setFirstName(firstName);
		user.setLastName(lastName);
		user.setEmail(email);
		user.setPasswordHash(PASSWORD_ENCODER.encode(request.password()));
		user.setRole(resolveRole(email, request.role()));

		return toUserProfile(userRepository.save(user));
	}

	@Transactional
	public UserProfile updateUser(Long id, UpdateUserRequest request) {
		User user = getUserEntity(id);
		String firstName = request.firstName() != null ? request.firstName().trim() : user.getFirstName();
		String lastName = request.lastName() != null ? request.lastName().trim() : user.getLastName();
		String email = normalizeEmail(request.email() != null ? request.email() : user.getEmail());

		if (firstName.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First name is required");
		}

		if (lastName.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Last name is required");
		}

		if (email.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}

		if (userRepository.existsByEmailIgnoreCaseAndUserIdNot(email, id)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists");
		}

		user.setFirstName(firstName);
		user.setLastName(lastName);
		user.setEmail(email);

		if (request.role() != null || isAdminEmail(email)) {
			user.setRole(resolveRole(email, request.role()));
		}

		if (request.classroom() != null) {
			user.setClassroom(normalizeOptionalValue(request.classroom()));
		}

		if (request.classCode() != null) {
			user.setClassCode(normalizeOptionalValue(request.classCode()));
		}

		if (request.password() != null && !request.password().isBlank()) {
			if (request.password().length() < 8) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
			}

			user.setPasswordHash(PASSWORD_ENCODER.encode(request.password()));
		}

		return toUserProfile(userRepository.save(user));
	}

	@Transactional
	public UserProfile generateClassCode(Long teacherId) {
		User teacher = getUserEntity(teacherId);
		if (teacher.getRole() != Role.TEACHER) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only teacher accounts can generate class codes");
		}

		String classCode = buildUniqueClassCode();
		teacher.setClassCode(classCode);
		teacher.setClassroom(classCode);
		return toUserProfile(userRepository.save(teacher));
	}

	@Transactional
	public UserProfile joinClass(Long studentId, String classCode) {
		User student = getUserEntity(studentId);
		if (student.getRole() != Role.STUDENT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only student accounts can join a class");
		}

		String normalizedCode = normalizeOptionalValue(classCode);
		if (normalizedCode == null || normalizedCode.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class code is required");
		}

		User teacher = userRepository.findByClassCodeIgnoreCase(normalizedCode)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class code not found"));

		if (teacher.getRole() != Role.TEACHER) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class code belongs to a non-teacher account");
		}

		String teacherClassroom = normalizeOptionalValue(teacher.getClassroom());
		if (teacherClassroom == null || teacherClassroom.isBlank()) {
			teacherClassroom = normalizeOptionalValue(teacher.getClassCode());
		}

		student.setClassroom(teacherClassroom);
		return toUserProfile(userRepository.save(student));
	}

	@Transactional
	public void deleteUser(Long id) {
		userRepository.delete(getUserEntity(id));
	}

	@Transactional(readOnly = true)
	public UserProfile login(String email, String password) {
		User user = getUserByEmail(email);
		ensureAdminRole(user);
		if (!PASSWORD_ENCODER.matches(password, user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}

		return toUserProfile(user);
	}

	@Transactional
	public void resetPassword(String email, String password) {
		if (password == null || password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		User user = getUserByEmail(email);
		user.setPasswordHash(PASSWORD_ENCODER.encode(password));
		userRepository.save(user);
	}

	@Transactional
	public void changePassword(String email, String currentPassword, String password) {
		if (password == null || password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		User user = getUserByEmail(email);
		if (!PASSWORD_ENCODER.matches(currentPassword, user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
		}

		user.setPasswordHash(PASSWORD_ENCODER.encode(password));
		userRepository.save(user);
	}

	private User getUserEntity(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User id is required");
		}

		return userRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}

	private User getUserByEmail(String email) {
		String normalizedEmail = normalizeEmail(email);
		if (normalizedEmail.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
		}

		User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
		ensureAdminRole(user);
		return user;
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase();
	}

	private String normalizeOptionalValue(String value) {
		if (value == null) {
			return null;
		}

		String normalized = value.trim();
		return normalized.isEmpty() ? null : normalized;
	}

	private String buildUniqueClassCode() {
		for (int attempt = 0; attempt < 100; attempt++) {
			StringBuilder builder = new StringBuilder(CLASS_CODE_LENGTH);
			for (int index = 0; index < CLASS_CODE_LENGTH; index++) {
				builder.append(CLASS_CODE_CHARS.charAt(RANDOM.nextInt(CLASS_CODE_CHARS.length())));
			}

			String candidate = builder.toString();
			if (!userRepository.existsByClassCodeIgnoreCase(candidate)) {
				return candidate;
			}
		}

		throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate unique class code");
	}

	private Role normalizeRole(String role) {
		if (role == null || role.trim().isEmpty()) {
			return Role.STUDENT;
		}

		return switch (role.trim().toUpperCase()) {
			case "TEACHER" -> Role.TEACHER;
			case "ADMIN" -> Role.ADMIN;
			default -> Role.STUDENT;
		};
	}

	private Role resolveRole(String email, String role) {
		if (isAdminEmail(email)) {
			return Role.ADMIN;
		}

		return normalizeRole(role);
	}

	private boolean isAdminEmail(String email) {
		return ADMIN_EMAIL.equalsIgnoreCase(normalizeEmail(email));
	}

	private void ensureAdminRole(User user) {
		if (user == null || !isAdminEmail(user.getEmail())) {
			return;
		}

		if (user.getRole() != Role.ADMIN) {
			user.setRole(Role.ADMIN);
			userRepository.save(user);
		}
	}

	private UserProfile toUserProfile(User user) {
		Role effectiveRole = isAdminEmail(user.getEmail()) ? Role.ADMIN : user.getRole();
		Map<String, Object> userMetadata = new LinkedHashMap<>();
		userMetadata.put("firstName", user.getFirstName());
		userMetadata.put("lastName", user.getLastName());
		userMetadata.put("role", effectiveRole.name().toLowerCase());
		userMetadata.put("email", user.getEmail());
		userMetadata.put("classroom", user.getClassroom());
		userMetadata.put("classCode", user.getClassCode());

		return new UserProfile(
			user.getUserId(),
			user.getEmail(),
			user.getFirstName(),
			user.getLastName(),
			effectiveRole.name().toLowerCase(),
			user.getClassroom(),
			user.getClassCode(),
			user.getCreatedAt(),
			userMetadata
		);
	}

	public record CreateUserRequest(String firstName, String lastName, String email, String password, String role) {
	}

	public record UpdateUserRequest(String firstName, String lastName, String email, String password, String role, String classroom, String classCode) {
	}

	public record UserProfile(Long id, String email, String firstName, String lastName, String role, String classroom, String classCode, java.time.LocalDateTime createdAt, Map<String, Object> user_metadata) {
	}
}