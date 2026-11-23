package com.phonexis.backend.Service;

import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Config.SessionAuthenticationFilter;
import com.phonexis.backend.Entity.ClassSection;
import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Entity.User.Role;
import com.phonexis.backend.Entity.Progress;
import com.phonexis.backend.Repository.ClassEnrollmentRepository;
import com.phonexis.backend.Repository.ClassSectionRepository;
import com.phonexis.backend.Repository.GameScoreRepository;
import com.phonexis.backend.Repository.ProgressRepository;
import com.phonexis.backend.Repository.TeacherActivityRepository;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class UserService {
	private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();
	private static final String CLASS_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private static final int CLASS_CODE_LENGTH = 6;
	private static final Random RANDOM = new Random();
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();
	private static final int SESSION_HOURS = 8;
	private static final String DUMMY_PASSWORD_HASH = PASSWORD_ENCODER.encode("phonexis-timing-equalizer");

	private final UserRepository userRepository;
	private final ProgressRepository progressRepository;
	private final ClassSectionRepository classSectionRepository;
	private final ClassEnrollmentRepository classEnrollmentRepository;
	private final TeacherActivityRepository teacherActivityRepository;
	private final LearningMaterialService learningMaterialService;
	private final GameScoreRepository gameScoreRepository;

	// One-device-per-account login lock. Disable locally (DEVICE_LOCK_ENABLED=false)
	// to test teacher and student accounts side by side in separate browser windows.
	@Value("${app.device-lock.enabled:true}")
	private boolean deviceLockEnabled = true;

	// A session with no activity for this long is logged out automatically (see SessionAuthenticationFilter).
	@Value("${app.session.idle-timeout-minutes:10}")
	private long sessionIdleMinutes = 10;

	/** True when the account is logged in somewhere and that session is still alive (not logged out, not idle/expired). */
	private boolean hasActiveSession(User user) {
		LocalDateTime now = LocalDateTime.now();
		return user.getSessionToken() != null
			&& user.getSessionExpiresAt() != null && user.getSessionExpiresAt().isAfter(now)
			&& user.getLastActiveAt() != null && user.getLastActiveAt().isAfter(now.minusMinutes(sessionIdleMinutes));
	}

	public UserService(
		UserRepository userRepository,
		ProgressRepository progressRepository,
		ClassSectionRepository classSectionRepository,
		ClassEnrollmentRepository classEnrollmentRepository,
		TeacherActivityRepository teacherActivityRepository,
		LearningMaterialService learningMaterialService,
		GameScoreRepository gameScoreRepository
	) {
		this.userRepository = userRepository;
		this.progressRepository = progressRepository;
		this.classSectionRepository = classSectionRepository;
		this.classEnrollmentRepository = classEnrollmentRepository;
		this.teacherActivityRepository = teacherActivityRepository;
		this.learningMaterialService = learningMaterialService;
		this.gameScoreRepository = gameScoreRepository;
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
		user.setRole(normalizeRole(request.role()));
		user.setActiveDeviceId(normalizeDeviceId(request.deviceId()));

		User savedUser = userRepository.save(user);
		for (String moduleName : List.of("alphabet", "vowels", "consonants", "cvc")) {
			progressRepository.save(new Progress(savedUser, moduleName));
		}
		return toUserProfile(savedUser);
	}

	@Transactional
	public UserProfile updateUser(Long actingUserId, Long id, UpdateUserRequest request) {
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

		if (request.role() != null && !request.role().isBlank()) {
			Role newRole = parseRoleStrict(request.role());
			Role currentRole = user.getRole();
			if (newRole != currentRole) {
				if (id.equals(actingUserId)) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't change your own role");
				}
				if (currentRole == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "There must be at least one admin account");
				}
				user.setRole(newRole);
				// End their current session so they log in again and get the dashboard for the new role.
				user.setSessionToken(null);
				user.setSessionExpiresAt(null);
				user.setActiveDeviceId(null);
			}
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
	public void deleteUser(Long actingUserId, Long id) {
		User user = getUserEntity(id);
		if (id.equals(actingUserId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't delete your own account");
		}
		if (user.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "There must be at least one admin account");
		}

		progressRepository.deleteByUser(user);
		gameScoreRepository.deleteByUser(user);
		classEnrollmentRepository.deleteByStudent(user);
		teacherActivityRepository.deleteByTeacher(user);

		for (ClassSection classSection : classSectionRepository.findByTeacherOrderByCreatedAtDesc(user)) {
			learningMaterialService.deleteAllForClass(classSection);
			classEnrollmentRepository.deleteByClassSection(classSection);
			classSectionRepository.delete(classSection);
		}

		userRepository.delete(user);
	}

	@Transactional
	public AuthSession login(String email, String password, String deviceId) {
		String normalizedEmail = normalizeEmail(email);
		User user = normalizedEmail.isEmpty() ? null : userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
		if (user == null) {
			// Run a hash anyway so response time doesn't reveal whether the account exists.
			PASSWORD_ENCODER.matches(password == null ? "" : password, DUMMY_PASSWORD_HASH);
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		if (password == null || !PASSWORD_ENCODER.matches(password, user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		String normalizedDeviceId = normalizeDeviceId(deviceId);
		if (normalizedDeviceId.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Device id is required");
		}

		// One device per account: while the account is logged in and active on another device,
		// new logins are refused. The account frees up when that device logs out, or after
		// SESSION_IDLE_MINUTES without activity (its session then expires automatically).
		// The same browser (same device id) may always log in again, e.g. after a page refresh.
		if (deviceLockEnabled && hasActiveSession(user) && !normalizedDeviceId.equals(user.getActiveDeviceId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
				"This account is already logged in on another device. Log out there first, or try again after "
					+ sessionIdleMinutes + " minutes of inactivity.");
		}

		user.setActiveDeviceId(normalizedDeviceId);
		user.setLastActiveAt(LocalDateTime.now());
		// The raw token goes to the client once; only its SHA-256 hash is stored.
		String sessionToken = createSecureToken();
		user.setSessionToken(SessionAuthenticationFilter.hashToken(sessionToken));
		user.setSessionExpiresAt(LocalDateTime.now().plusHours(SESSION_HOURS));
		userRepository.save(user);
		return new AuthSession(toUserProfile(user), sessionToken);
	}

	@Transactional
	public void verifyDevice(String email, String deviceId) {
		User user = getUserByEmail(email);
		String normalizedDeviceId = normalizeDeviceId(deviceId);
		if (deviceLockEnabled && (normalizedDeviceId.isEmpty() || user.getActiveDeviceId() == null
			|| !normalizedDeviceId.equals(user.getActiveDeviceId()))) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "This account is already logged in on another device.");
		}

		user.setLastActiveAt(LocalDateTime.now());
		userRepository.save(user);
	}

	@Transactional
	public void releaseDevice(String email, String deviceId) {
		// The caller is authenticated with the account's current session token, so it is the
		// active device by definition. Logging out always succeeds (and is safe to repeat).
		User user = getUserByEmail(email);
		user.setActiveDeviceId(null);
		user.setSessionToken(null);
		user.setSessionExpiresAt(null);
		userRepository.save(user);
	}

	@Transactional
	public void resetPassword(String email, String token, String password) {
		if (password == null || password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email)).orElse(null);
		if (user == null || token == null || token.isBlank()
			|| user.getResetTokenHash() == null
			|| user.getResetTokenExpiresAt() == null
			|| user.getResetTokenExpiresAt().isBefore(LocalDateTime.now())
			|| !MessageDigest.isEqual(user.getResetTokenHash().getBytes(StandardCharsets.UTF_8), hashResetToken(token).getBytes(StandardCharsets.UTF_8))) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Reset token is invalid or expired");
		}
		user.setPasswordHash(PASSWORD_ENCODER.encode(password));
		user.setResetTokenHash(null);
		user.setResetTokenExpiresAt(null);
		user.setSessionToken(null);
		user.setSessionExpiresAt(null);
		user.setActiveDeviceId(null);
		userRepository.save(user);
	}

	@Transactional
	public void requestPasswordReset(String email) {
		User user = getUserByEmail(email);
		String token = createSecureToken();
		user.setResetTokenHash(hashResetToken(token));
		user.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(15));
		userRepository.save(user);
		// Delivery requires an email provider. The raw token must never be returned by this API.
	}

	@Transactional
	public void changePassword(String email, String currentPassword, String password) {
		if (password == null || password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}

		User user = getUserByEmail(email);
		if (currentPassword == null || !PASSWORD_ENCODER.matches(currentPassword, user.getPasswordHash())) {
			// 400 (not 401) so the frontend doesn't treat this as an expired session.
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
		}

		// The account is locked to one device, so the caller's session is the only one; keep it.
		user.setPasswordHash(PASSWORD_ENCODER.encode(password));
		userRepository.save(user);
	}

	@Transactional
	public void changePasswordWithoutCurrentPassword(String email, String password) {
		if (password == null || password.length() < 8) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
		}
		User user = getUserByEmail(email);
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

		return userRepository.findByEmailIgnoreCase(normalizedEmail)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase();
	}

	private String normalizeDeviceId(String deviceId) {
		return deviceId == null ? "" : deviceId.trim();
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

	// Used when an admin changes a role: unknown values are rejected instead of silently becoming STUDENT.
	private Role parseRoleStrict(String role) {
		return switch (role.trim().toUpperCase()) {
			case "STUDENT" -> Role.STUDENT;
			case "TEACHER" -> Role.TEACHER;
			case "ADMIN" -> Role.ADMIN;
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be student, teacher or admin");
		};
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

	private UserProfile toUserProfile(User user) {
		Role role = user.getRole();
		Map<String, Object> userMetadata = new LinkedHashMap<>();
		userMetadata.put("firstName", user.getFirstName());
		userMetadata.put("lastName", user.getLastName());
		userMetadata.put("role", role.name().toLowerCase());
		userMetadata.put("email", user.getEmail());
		userMetadata.put("classroom", user.getClassroom());
		userMetadata.put("classCode", user.getClassCode());

		return new UserProfile(
			user.getUserId(),
			user.getEmail(),
			user.getFirstName(),
			user.getLastName(),
			role.name().toLowerCase(),
			user.getClassroom(),
			user.getClassCode(),
			user.getCreatedAt(),
			userMetadata
		);
	}

	private String createSecureToken() {
		byte[] bytes = new byte[32];
		SECURE_RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private String hashResetToken(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return Base64.getUrlEncoder().withoutPadding().encodeToString(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
		} catch (java.security.NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}

	public record CreateUserRequest(String firstName, String lastName, String email, String password, String role, String deviceId) {
		public CreateUserRequest(String firstName, String lastName, String email, String password, String role) {
			this(firstName, lastName, email, password, role, null);
		}
	}

	public record UpdateUserRequest(String firstName, String lastName, String email, String password, String role, String classroom, String classCode) {
	}

	public record UserProfile(Long id, String email, String firstName, String lastName, String role, String classroom, String classCode, java.time.LocalDateTime createdAt, Map<String, Object> user_metadata) {
	}

	public record AuthSession(UserProfile user, String accessToken) {
	}
}