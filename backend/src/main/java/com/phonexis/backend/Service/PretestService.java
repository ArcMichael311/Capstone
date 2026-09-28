package com.phonexis.backend.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.ObjectMapper;
import com.phonexis.backend.Entity.ClassSection;
import com.phonexis.backend.Entity.Pretest;
import com.phonexis.backend.Entity.PretestAnswer;
import com.phonexis.backend.Entity.PretestAttempt;
import com.phonexis.backend.Entity.PretestOption;
import com.phonexis.backend.Entity.PretestQuestion;
import com.phonexis.backend.Entity.PretestQuestion.QuestionType;
import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.ClassEnrollmentRepository;
import com.phonexis.backend.Repository.ClassSectionRepository;
import com.phonexis.backend.Repository.PretestAnswerRepository;
import com.phonexis.backend.Repository.PretestAttemptRepository;
import com.phonexis.backend.Repository.PretestQuestionRepository;
import com.phonexis.backend.Repository.PretestRepository;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class PretestService {
	private static final int SIGNED_URL_TTL_SECONDS = 600;

	private final PretestRepository pretestRepository;
	private final PretestQuestionRepository pretestQuestionRepository;
	private final PretestAttemptRepository pretestAttemptRepository;
	private final PretestAnswerRepository pretestAnswerRepository;
	private final ClassSectionRepository classSectionRepository;
	private final ClassEnrollmentRepository classEnrollmentRepository;
	private final UserRepository userRepository;
	private final SupabaseStorageService supabaseStorageService;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public PretestService(
		PretestRepository pretestRepository,
		PretestQuestionRepository pretestQuestionRepository,
		PretestAttemptRepository pretestAttemptRepository,
		PretestAnswerRepository pretestAnswerRepository,
		ClassSectionRepository classSectionRepository,
		ClassEnrollmentRepository classEnrollmentRepository,
		UserRepository userRepository,
		SupabaseStorageService supabaseStorageService
	) {
		this.pretestRepository = pretestRepository;
		this.pretestQuestionRepository = pretestQuestionRepository;
		this.pretestAttemptRepository = pretestAttemptRepository;
		this.pretestAnswerRepository = pretestAnswerRepository;
		this.classSectionRepository = classSectionRepository;
		this.classEnrollmentRepository = classEnrollmentRepository;
		this.userRepository = userRepository;
		this.supabaseStorageService = supabaseStorageService;
	}

	// ---------------------------------------------------------------------
	// Teacher: pretest management
	// ---------------------------------------------------------------------

	@Transactional
	public PretestSummaryResponse createPretest(Long classId, Long teacherId, CreatePretestRequest request) {
		ClassSection classSection = getOwnedClass(classId, teacherId);
		String title = clean(request.title());
		if (title.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pretest title is required");
		}

		Pretest pretest = new Pretest();
		pretest.setClassSection(classSection);
		pretest.setTeacher(classSection.getTeacher());
		pretest.setTitle(title);
		pretest.setDescription(blankToNull(clean(request.description())));

		Pretest saved = pretestRepository.save(pretest);
		return toSummary(saved, 0);
	}

	@Transactional(readOnly = true)
	public List<PretestSummaryResponse> listPretests(Long classId) {
		ClassSection classSection = getClassEntity(classId);
		return pretestRepository.findByClassSectionOrderByCreatedAtDesc(classSection).stream()
			.map(pretest -> toSummary(pretest, pretestQuestionRepository.findByPretestOrderBySortOrderAsc(pretest).size()))
			.toList();
	}

	@Transactional(readOnly = true)
	public PretestDetailResponse getPretestForTeacher(Long pretestId, Long teacherId) {
		Pretest pretest = getOwnedPretest(pretestId, teacherId);
		List<QuestionResponse> questions = pretestQuestionRepository.findByPretestOrderBySortOrderAsc(pretest).stream()
			.map(this::toQuestionResponse)
			.toList();
		return new PretestDetailResponse(
			pretest.getPretestId(),
			pretest.getClassSection().getClassId(),
			pretest.getTitle(),
			pretest.getDescription(),
			questions,
			pretest.getCreatedAt()
		);
	}

	@Transactional
	public PretestSummaryResponse updatePretest(Long pretestId, Long teacherId, UpdatePretestRequest request) {
		Pretest pretest = getOwnedPretest(pretestId, teacherId);
		String title = clean(request.title());
		if (title.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pretest title is required");
		}
		pretest.setTitle(title);
		pretest.setDescription(blankToNull(clean(request.description())));
		Pretest saved = pretestRepository.save(pretest);
		return toSummary(saved, pretestQuestionRepository.findByPretestOrderBySortOrderAsc(saved).size());
	}

	@Transactional
	public void deletePretest(Long pretestId, Long teacherId) {
		Pretest pretest = getOwnedPretest(pretestId, teacherId);
		deletePretestContents(pretest);
	}

	/**
	 * Deletes every pretest belonging to a class (and their questions, options, attempts,
	 * answers, and recorded audio clips) when the whole class is deleted. Children are removed
	 * explicitly through JPA, bottom-up, rather than relying on database-level cascades: Hibernate
	 * rejects deleting a parent while managed children loaded in the same session still reference
	 * it, regardless of what the underlying database's foreign keys would otherwise cascade.
	 */
	@Transactional
	public void deleteAllForClass(ClassSection classSection) {
		for (Pretest pretest : pretestRepository.findByClassSectionOrderByCreatedAtDesc(classSection)) {
			deletePretestContents(pretest);
		}
	}

	private void deletePretestContents(Pretest pretest) {
		for (PretestAttempt attempt : pretestAttemptRepository.findByPretestOrderBySubmittedAtDesc(pretest)) {
			pretestAttemptRepository.delete(attempt);
		}

		for (PretestQuestion question : pretestQuestionRepository.findByPretestOrderBySortOrderAsc(pretest)) {
			deleteAudioBestEffort(question.getAudioStoragePath());
			for (PretestOption option : question.getOptions()) {
				deleteAudioBestEffort(option.getAudioStoragePath());
			}
			pretestQuestionRepository.delete(question);
		}

		pretestRepository.delete(pretest);
	}

	private void deleteAudioBestEffort(String storagePath) {
		if (storagePath == null || storagePath.isBlank() || !supabaseStorageService.isConfigured()) {
			return;
		}
		try {
			supabaseStorageService.delete(storagePath);
		} catch (ResponseStatusException e) {
			// Ignore storage cleanup failures; the caller's deletion should still proceed.
		}
	}

	// ---------------------------------------------------------------------
	// Teacher: question management
	// ---------------------------------------------------------------------

	@Transactional
	public QuestionResponse addQuestion(Long pretestId, Long teacherId, QuestionRequest request) {
		Pretest pretest = getOwnedPretest(pretestId, teacherId);
		QuestionType type = parseType(request.questionType());
		validateQuestion(type, request);

		PretestQuestion question = new PretestQuestion();
		question.setPretest(pretest);
		question.setQuestionType(type);
		applyQuestionFields(question, type, request);

		PretestQuestion saved = pretestQuestionRepository.save(question);
		return toQuestionResponse(saved);
	}

	@Transactional
	public QuestionResponse updateQuestion(Long questionId, Long teacherId, QuestionRequest request) {
		PretestQuestion question = getOwnedQuestion(questionId, teacherId);
		QuestionType type = parseType(request.questionType());
		validateQuestion(type, request);

		question.setQuestionType(type);
		applyQuestionFields(question, type, request);

		PretestQuestion saved = pretestQuestionRepository.save(question);
		return toQuestionResponse(saved);
	}

	@Transactional
	public void deleteQuestion(Long questionId, Long teacherId) {
		PretestQuestion question = getOwnedQuestion(questionId, teacherId);
		deleteAudioBestEffort(question.getAudioStoragePath());
		for (PretestOption option : question.getOptions()) {
			deleteAudioBestEffort(option.getAudioStoragePath());
		}
		pretestAnswerRepository.deleteByQuestion(question);
		pretestQuestionRepository.delete(question);
	}

	private void applyQuestionFields(PretestQuestion question, QuestionType type, QuestionRequest request) {
		question.setPromptText(clean(request.promptText()));
		question.setAudioStoragePath(blankToNull(clean(request.audioStoragePath())));

		boolean freeText = type == QuestionType.IDENTIFICATION || type == QuestionType.FILL_BLANK;
		question.setCorrectAnswerText(freeText ? clean(request.correctAnswerText()) : null);

		if (question.getSortOrder() == null) {
			question.setSortOrder((int) pretestQuestionRepository.countByPretest(question.getPretest()));
		}

		question.getOptions().clear();
		if (!freeText && request.options() != null) {
			int position = 0;
			for (OptionRequest optionRequest : request.options()) {
				PretestOption option = new PretestOption();
				option.setQuestion(question);
				option.setLabel(clean(optionRequest.label()));
				option.setMatchValue(type == QuestionType.MATCHING ? clean(optionRequest.matchValue()) : null);
				option.setAudioStoragePath(blankToNull(clean(optionRequest.audioStoragePath())));
				option.setCorrect(type != QuestionType.MATCHING && Boolean.TRUE.equals(optionRequest.isCorrect()));
				option.setSortOrder(position++);
				question.getOptions().add(option);
			}
		}
	}

	private void validateQuestion(QuestionType type, QuestionRequest request) {
		if (clean(request.promptText()).isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question text is required");
		}

		if (type == QuestionType.IDENTIFICATION || type == QuestionType.FILL_BLANK) {
			if (clean(request.correctAnswerText()).isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide the correct answer for this question");
			}
			return;
		}

		List<OptionRequest> options = request.options();
		if (options == null || options.size() < 2) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least two answer choices");
		}

		for (OptionRequest option : options) {
			if (clean(option.label()).isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every answer choice needs text");
			}
			if (type == QuestionType.MATCHING && clean(option.matchValue()).isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Every matching pair needs a match");
			}
		}

		if (type == QuestionType.MULTIPLE_CHOICE || type == QuestionType.TRUE_FALSE) {
			long correctCount = options.stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count();
			if (correctCount != 1) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick exactly one correct answer");
			}
		}
	}

	private QuestionType parseType(String raw) {
		try {
			return QuestionType.valueOf(String.valueOf(raw).trim().toUpperCase(Locale.ROOT));
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown question type: " + raw);
		}
	}

	// ---------------------------------------------------------------------
	// Teacher: audio recording upload
	// ---------------------------------------------------------------------

	@Transactional(readOnly = true)
	public AudioUploadResponse uploadAudio(Long pretestId, Long teacherId, MultipartFile file) {
		Pretest pretest = getOwnedPretest(pretestId, teacherId);

		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An audio recording is required");
		}

		String contentType = file.getContentType();
		if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("audio/")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only audio recordings are allowed");
		}

		String extension = extensionForContentType(contentType);
		String storagePath = "pretest-audio/class-" + pretest.getClassSection().getClassId()
			+ "/pretest-" + pretest.getPretestId() + "/" + UUID.randomUUID() + "." + extension;

		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read the uploaded recording");
		}

		supabaseStorageService.upload(storagePath, bytes, contentType);

		String downloadUrl = supabaseStorageService.isConfigured()
			? supabaseStorageService.createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
			: null;

		return new AudioUploadResponse(storagePath, downloadUrl);
	}

	private String extensionForContentType(String contentType) {
		String normalized = contentType.toLowerCase(Locale.ROOT);
		if (normalized.contains("webm")) return "webm";
		if (normalized.contains("mpeg") || normalized.contains("mp3")) return "mp3";
		if (normalized.contains("wav")) return "wav";
		if (normalized.contains("ogg")) return "ogg";
		if (normalized.contains("mp4") || normalized.contains("m4a") || normalized.contains("aac")) return "m4a";
		return "audio";
	}

	// ---------------------------------------------------------------------
	// Student: taking a pretest
	// ---------------------------------------------------------------------

	@Transactional(readOnly = true)
	public List<StudentPretestListItem> listPretestsForStudent(Long classId, Long studentId) {
		ClassSection classSection = getClassEntity(classId);
		User student = getStudent(studentId);
		requireEnrolled(classSection, student);

		List<StudentPretestListItem> items = new ArrayList<>();
		for (Pretest pretest : pretestRepository.findByClassSectionOrderByCreatedAtDesc(classSection)) {
			int questionCount = pretestQuestionRepository.findByPretestOrderBySortOrderAsc(pretest).size();
			AttemptSummary latest = pretestAttemptRepository
				.findFirstByPretestAndStudentOrderBySubmittedAtDesc(pretest, student)
				.map(this::toAttemptSummary)
				.orElse(null);
			items.add(new StudentPretestListItem(pretest.getPretestId(), pretest.getTitle(), pretest.getDescription(), questionCount, latest));
		}
		return items;
	}

	@Transactional(readOnly = true)
	public StudentPretestResponse getPretestForStudent(Long pretestId, Long studentId) {
		Pretest pretest = getPretestEntity(pretestId);
		User student = getStudent(studentId);
		requireEnrolled(pretest.getClassSection(), student);

		List<StudentQuestionResponse> questions = pretestQuestionRepository.findByPretestOrderBySortOrderAsc(pretest).stream()
			.map(this::toStudentQuestionResponse)
			.toList();

		AttemptSummary latest = pretestAttemptRepository
			.findFirstByPretestAndStudentOrderBySubmittedAtDesc(pretest, student)
			.map(this::toAttemptSummary)
			.orElse(null);

		return new StudentPretestResponse(
			pretest.getPretestId(),
			pretest.getClassSection().getClassId(),
			pretest.getTitle(),
			pretest.getDescription(),
			questions,
			latest
		);
	}

	@Transactional
	public SubmitAttemptResponse submitAttempt(Long pretestId, Long studentId, SubmitAttemptRequest request) {
		Pretest pretest = getPretestEntity(pretestId);
		User student = getStudent(studentId);
		requireEnrolled(pretest.getClassSection(), student);

		List<PretestQuestion> questions = pretestQuestionRepository.findByPretestOrderBySortOrderAsc(pretest);
		Map<Long, String> responses = new java.util.HashMap<>();
		if (request.answers() != null) {
			for (SubmitAnswerRequest answer : request.answers()) {
				if (answer.questionId() != null) {
					responses.put(answer.questionId(), answer.responseText());
				}
			}
		}

		PretestAttempt attempt = new PretestAttempt();
		attempt.setPretest(pretest);
		attempt.setStudent(student);

		List<AnswerResult> results = new ArrayList<>();
		int correctCount = 0;

		for (PretestQuestion question : questions) {
			String responseText = responses.get(question.getQuestionId());
			boolean correct = gradeQuestion(question, responseText);
			if (correct) {
				correctCount++;
			}

			PretestAnswer answer = new PretestAnswer();
			answer.setAttempt(attempt);
			answer.setQuestion(question);
			answer.setResponseText(responseText);
			answer.setCorrect(correct);
			attempt.getAnswers().add(answer);

			results.add(new AnswerResult(question.getQuestionId(), correct));
		}

		attempt.setScore(correctCount);
		attempt.setTotalQuestions(questions.size());

		PretestAttempt saved = pretestAttemptRepository.save(attempt);
		return new SubmitAttemptResponse(saved.getAttemptId(), correctCount, questions.size(), results);
	}

	private boolean gradeQuestion(PretestQuestion question, String responseText) {
		if (responseText == null || responseText.isBlank()) {
			return false;
		}

		QuestionType type = question.getQuestionType();
		if (type == QuestionType.IDENTIFICATION || type == QuestionType.FILL_BLANK) {
			String[] accepted = String.valueOf(question.getCorrectAnswerText()).split("\\|");
			String normalizedResponse = responseText.trim().toLowerCase(Locale.ROOT);
			for (String candidate : accepted) {
				if (candidate.trim().toLowerCase(Locale.ROOT).equals(normalizedResponse)) {
					return true;
				}
			}
			return false;
		}

		if (type == QuestionType.MULTIPLE_CHOICE || type == QuestionType.TRUE_FALSE) {
			try {
				long selectedOptionId = Long.parseLong(responseText.trim());
				return question.getOptions().stream()
					.anyMatch(option -> option.getOptionId().equals(selectedOptionId) && option.isCorrect());
			} catch (NumberFormatException e) {
				return false;
			}
		}

		if (type == QuestionType.MATCHING) {
			try {
				Map<String, String> chosen = objectMapper.readValue(responseText, Map.class);
				for (PretestOption option : question.getOptions()) {
					String chosenMatch = chosen.get(String.valueOf(option.getOptionId()));
					String expected = option.getMatchValue();
					if (chosenMatch == null || expected == null
						|| !chosenMatch.trim().equalsIgnoreCase(expected.trim())) {
						return false;
					}
				}
				return !question.getOptions().isEmpty();
			} catch (Exception e) {
				return false;
			}
		}

		return false;
	}

	// ---------------------------------------------------------------------
	// Teacher: results
	// ---------------------------------------------------------------------

	@Transactional(readOnly = true)
	public List<AttemptResultResponse> listAttempts(Long pretestId, Long teacherId) {
		Pretest pretest = getOwnedPretest(pretestId, teacherId);
		return pretestAttemptRepository.findByPretestOrderBySubmittedAtDesc(pretest).stream()
			.map(attempt -> new AttemptResultResponse(
				attempt.getAttemptId(),
				attempt.getStudent().getUserId(),
				attempt.getStudent().getFirstName(),
				attempt.getStudent().getLastName(),
				attempt.getScore(),
				attempt.getTotalQuestions(),
				attempt.getSubmittedAt()
			))
			.toList();
	}

	// ---------------------------------------------------------------------
	// Mapping helpers
	// ---------------------------------------------------------------------

	private PretestSummaryResponse toSummary(Pretest pretest, int questionCount) {
		return new PretestSummaryResponse(
			pretest.getPretestId(),
			pretest.getClassSection().getClassId(),
			pretest.getTitle(),
			pretest.getDescription(),
			questionCount,
			pretest.getCreatedAt()
		);
	}

	private QuestionResponse toQuestionResponse(PretestQuestion question) {
		List<OptionResponse> options = question.getOptions().stream()
			.map(option -> new OptionResponse(
				option.getOptionId(),
				option.getLabel(),
				option.getMatchValue(),
				signedUrlOrNull(option.getAudioStoragePath()),
				option.getAudioStoragePath(),
				option.isCorrect()
			))
			.toList();

		return new QuestionResponse(
			question.getQuestionId(),
			question.getQuestionType().name(),
			question.getPromptText(),
			signedUrlOrNull(question.getAudioStoragePath()),
			question.getAudioStoragePath(),
			question.getCorrectAnswerText(),
			options
		);
	}

	private StudentQuestionResponse toStudentQuestionResponse(PretestQuestion question) {
		List<StudentOptionResponse> options = question.getOptions().stream()
			.map(option -> new StudentOptionResponse(
				option.getOptionId(),
				option.getLabel(),
				question.getQuestionType() == QuestionType.MATCHING ? option.getMatchValue() : null,
				signedUrlOrNull(option.getAudioStoragePath())
			))
			.toList();

		return new StudentQuestionResponse(
			question.getQuestionId(),
			question.getQuestionType().name(),
			question.getPromptText(),
			signedUrlOrNull(question.getAudioStoragePath()),
			options
		);
	}

	private AttemptSummary toAttemptSummary(PretestAttempt attempt) {
		return new AttemptSummary(attempt.getScore(), attempt.getTotalQuestions(), attempt.getSubmittedAt());
	}

	private String signedUrlOrNull(String storagePath) {
		if (storagePath == null || storagePath.isBlank() || !supabaseStorageService.isConfigured()) {
			return null;
		}
		return supabaseStorageService.createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
	}

	// ---------------------------------------------------------------------
	// Lookups & ownership checks
	// ---------------------------------------------------------------------

	private ClassSection getClassEntity(Long classId) {
		if (classId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class id is required");
		}
		return classSectionRepository.findById(classId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
	}

	private ClassSection getOwnedClass(Long classId, Long teacherId) {
		ClassSection classSection = getClassEntity(classId);
		if (teacherId == null || !classSection.getTeacher().getUserId().equals(teacherId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This class does not belong to that teacher account");
		}
		return classSection;
	}

	private Pretest getPretestEntity(Long pretestId) {
		if (pretestId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pretest id is required");
		}
		return pretestRepository.findById(pretestId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pretest not found"));
	}

	private Pretest getOwnedPretest(Long pretestId, Long teacherId) {
		Pretest pretest = getPretestEntity(pretestId);
		if (teacherId == null || !pretest.getTeacher().getUserId().equals(teacherId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This pretest does not belong to that teacher account");
		}
		return pretest;
	}

	private PretestQuestion getOwnedQuestion(Long questionId, Long teacherId) {
		if (questionId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question id is required");
		}
		PretestQuestion question = pretestQuestionRepository.findById(questionId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
		if (teacherId == null || !question.getPretest().getTeacher().getUserId().equals(teacherId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This question does not belong to that teacher account");
		}
		return question;
	}

	private User getStudent(Long studentId) {
		if (studentId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student id is required");
		}
		return userRepository.findById(studentId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
	}

	private void requireEnrolled(ClassSection classSection, User student) {
		if (!classEnrollmentRepository.existsByClassSectionAndStudent(classSection, student)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This student is not enrolled in that class");
		}
	}

	private String clean(String value) {
		return value == null ? "" : value.trim();
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value;
	}

	// ---------------------------------------------------------------------
	// DTOs
	// ---------------------------------------------------------------------

	public record CreatePretestRequest(String title, String description) { }

	public record UpdatePretestRequest(String title, String description) { }

	public record OptionRequest(String label, String matchValue, String audioStoragePath, Boolean isCorrect) { }

	public record QuestionRequest(
		String questionType,
		String promptText,
		String audioStoragePath,
		String correctAnswerText,
		List<OptionRequest> options
	) { }

	public record OptionResponse(Long id, String label, String matchValue, String audioUrl, String audioStoragePath, boolean correct) { }

	public record QuestionResponse(
		Long id,
		String questionType,
		String promptText,
		String audioUrl,
		String audioStoragePath,
		String correctAnswerText,
		List<OptionResponse> options
	) { }

	public record PretestSummaryResponse(Long id, Long classId, String title, String description, int questionCount, LocalDateTime createdAt) { }

	public record PretestDetailResponse(
		Long id,
		Long classId,
		String title,
		String description,
		List<QuestionResponse> questions,
		LocalDateTime createdAt
	) { }

	public record StudentOptionResponse(Long id, String label, String matchValue, String audioUrl) { }

	public record StudentQuestionResponse(Long id, String questionType, String promptText, String audioUrl, List<StudentOptionResponse> options) { }

	public record AttemptSummary(Integer score, Integer totalQuestions, LocalDateTime submittedAt) { }

	public record StudentPretestResponse(
		Long id,
		Long classId,
		String title,
		String description,
		List<StudentQuestionResponse> questions,
		AttemptSummary latestAttempt
	) { }

	public record StudentPretestListItem(Long id, String title, String description, int questionCount, AttemptSummary latestAttempt) { }

	public record SubmitAnswerRequest(Long questionId, String responseText) { }

	public record SubmitAttemptRequest(List<SubmitAnswerRequest> answers) { }

	public record AnswerResult(Long questionId, boolean correct) { }

	public record SubmitAttemptResponse(Long attemptId, int score, int totalQuestions, List<AnswerResult> results) { }

	public record AudioUploadResponse(String storagePath, String downloadUrl) { }

	public record AttemptResultResponse(
		Long attemptId,
		Long studentId,
		String studentFirstName,
		String studentLastName,
		int score,
		int totalQuestions,
		LocalDateTime submittedAt
	) { }
}
