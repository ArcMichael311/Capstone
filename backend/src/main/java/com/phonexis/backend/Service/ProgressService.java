package com.phonexis.backend.Service;

import java.util.List;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.GameScore;
import com.phonexis.backend.Entity.Progress;
import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.GameScoreRepository;
import com.phonexis.backend.Repository.ProgressRepository;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class ProgressService {
	private final ProgressRepository progressRepository;
	private final UserRepository userRepository;
	private final GameScoreRepository gameScoreRepository;

	private static final Set<String> GAME_NAMES = Set.of("alphaquest", "vowelrush", "wordblast", "balloonpop");

	@Value("${app.device-lock.enabled:true}")
	private boolean deviceLockEnabled = true;

	public ProgressService(ProgressRepository progressRepository, UserRepository userRepository, GameScoreRepository gameScoreRepository) {
		this.progressRepository = progressRepository;
		this.userRepository = userRepository;
		this.gameScoreRepository = gameScoreRepository;
	}

	@Transactional(readOnly = true)
	public ProgressDTO getProgress(Long userId, String moduleName) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElseGet(() -> createDefaultProgress(user, moduleName));

		return new ProgressDTO(progress);
	}

	@Transactional
	public ProgressDTO updateVideosWatched(Long userId, String moduleName, String deviceId, List<Integer> videoIds) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		assertActiveDevice(user, deviceId);

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElseGet(() -> createDefaultProgress(user, moduleName));

		// Update videos watched
		Set<Integer> uniqueVideoIds = new LinkedHashSet<>(videoIds == null ? List.of() : videoIds);
		String videosJson = "[" + String.join(",", uniqueVideoIds.stream().map(String::valueOf).toList()) + "]";
		progress.setVideosWatched(videosJson);

		// Check if all required videos are watched for this module
		int requiredVideos = getRequiredVideosCount(moduleName);
		if (requiredVideos > 0) {
			int watchedCount = Math.min(uniqueVideoIds.size(), requiredVideos);
			int learningCompletion = Math.round((watchedCount / (float) requiredVideos) * 100);
			int assessmentCompletion = Boolean.TRUE.equals(progress.getPretestCompleted()) ? 100 : 0;
			progress.setCompletionPercentage(Math.max(learningCompletion, assessmentCompletion));
		}
		if (requiredVideos > 0 && uniqueVideoIds.size() >= requiredVideos) {
			progress.setLessonUnlocked(true);
			progress.setPretestUnlocked(true);
		}

		progressRepository.save(progress);
		return new ProgressDTO(progress);
	}

	@Transactional(readOnly = true)
	public boolean canAccessLesson(Long userId, String moduleName, String deviceId) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		assertActiveDevice(user, deviceId);

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElse(null);

		return progress != null && progress.getLessonUnlocked();
	}

	@Transactional(readOnly = true)
	public boolean canAccessPretest(Long userId, String moduleName, String deviceId) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		assertActiveDevice(user, deviceId);

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElse(null);

		return progress != null && progress.getPretestUnlocked();
	}

	@Transactional
	public ProgressDTO updateModuleCompletion(Long userId, String moduleName, String deviceId, UpdateProgressRequest request) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		assertActiveDevice(user, deviceId);

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElseGet(() -> createDefaultProgress(user, moduleName));

		// Update completion flags
		if (request.easyModeCompleted() != null) {
			progress.setEasyModeCompleted(request.easyModeCompleted());
		}
		if (request.mediumModeCompleted() != null) {
			progress.setMediumModeCompleted(request.mediumModeCompleted());
		}
		if (request.hardModeCompleted() != null) {
			progress.setHardModeCompleted(request.hardModeCompleted());
		}
		if (request.pretestCompleted() != null) {
			progress.setPretestCompleted(request.pretestCompleted());
		}
		if (request.videosWatched() != null) {
			Set<Integer> uniqueVideoIds = new LinkedHashSet<>(request.videosWatched());
			String videosJson = "[" + String.join(",", uniqueVideoIds.stream().map(String::valueOf).toList()) + "]";
			progress.setVideosWatched(videosJson);
		}
		if (request.assessmentScores() != null) {
			progress.setAssessmentScores(request.assessmentScores());
		}
		if (request.activityProgress() != null) {
			progress.setActivityProgress(request.activityProgress());
		}

		// Calculate completion percentage for alphabet (needs all 3 modes completed)
		if ("alphabet".equalsIgnoreCase(moduleName)) {
			if (progress.getEasyModeCompleted() && progress.getMediumModeCompleted() && progress.getHardModeCompleted()) {
				progress.setCompletionPercentage(100);
			} else {
				int completed = 0;
				if (progress.getEasyModeCompleted()) completed++;
				if (progress.getMediumModeCompleted()) completed++;
				if (progress.getHardModeCompleted()) completed++;
				progress.setCompletionPercentage(Math.round((completed / 3.0f) * 100));
			}
		} else {
			// Recompute from the watched videos (the frontend sends them on every sync) so the
			// percentage follows the student's real progress instead of staying at its old value.
			int learningCompletion = calculateLearningCompletion(moduleName, progress.getVideosWatched());
			int assessmentCompletion = Boolean.TRUE.equals(progress.getPretestCompleted()) ? 100 : 0;
			progress.setCompletionPercentage(Math.max(learningCompletion, assessmentCompletion));
			if (learningCompletion >= 100) {
				progress.setLessonUnlocked(true);
				progress.setPretestUnlocked(true);
			}
		}

		progressRepository.save(progress);
		return new ProgressDTO(progress);
	}

	@Transactional(readOnly = true)
	public List<ProgressDTO> getUserProgress(Long userId) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		ensureDefaultProgressRows(user);
		List<Progress> progressList = progressRepository.findByUser(user);
		return progressList.stream().map(this::withLearningCompletion).toList();
	}

	@Transactional
	private void ensureDefaultProgressRows(User user) {
		for (String moduleName : List.of("alphabet", "vowels", "consonants", "cvc")) {
			progressRepository.findByUserAndModuleName(user, moduleName)
				.orElseGet(() -> progressRepository.save(new Progress(user, moduleName)));
		}
	}

	private Progress createDefaultProgress(User user, String moduleName) {
		Progress progress = new Progress(user, moduleName);
		progressRepository.save(progress);
		return progress;
	}

	// Rows saved before the completion fix may still hold 0% even though every video was watched.
	private ProgressDTO withLearningCompletion(Progress progress) {
		ProgressDTO dto = new ProgressDTO(progress);
		if ("alphabet".equalsIgnoreCase(progress.getModuleName())) {
			return dto;
		}
		int stored = progress.getCompletionPercentage() == null ? 0 : progress.getCompletionPercentage();
		int learning = calculateLearningCompletion(progress.getModuleName(), progress.getVideosWatched());
		if (learning <= stored) {
			return dto;
		}
		return new ProgressDTO(
			dto.progressId(), dto.moduleName(), dto.videosWatched(), dto.lessonUnlocked(), dto.pretestUnlocked(),
			dto.pretestCompleted(), dto.easyModeCompleted(), dto.mediumModeCompleted(), dto.hardModeCompleted(),
			learning, dto.assessmentScores(), dto.activityProgress(), dto.createdAt(), dto.updatedAt()
		);
	}

	private int calculateLearningCompletion(String moduleName, String videosWatchedJson) {
		int requiredVideos = getRequiredVideosCount(moduleName);
		if (requiredVideos <= 0 || videosWatchedJson == null) {
			return 0;
		}
		long watchedCount = java.util.Arrays.stream(videosWatchedJson.replaceAll("[\\[\\]\\s]", "").split(","))
			.filter(id -> !id.isEmpty())
			.distinct()
			.count();
		return Math.round((Math.min(watchedCount, requiredVideos) / (float) requiredVideos) * 100);
	}

	@Transactional
	public GameScoreDTO recordGameScore(Long userId, String gameName, String deviceId, Integer score) {
		String normalizedGame = gameName == null ? "" : gameName.trim().toLowerCase();
		if (!GAME_NAMES.contains(normalizedGame)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown game: " + gameName);
		}
		if (score == null || score < 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Score must be zero or more");
		}

		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		assertActiveDevice(user, deviceId);

		GameScore gameScore = gameScoreRepository.findByUserAndGameName(user, normalizedGame)
			.orElseGet(() -> new GameScore(user, normalizedGame));
		gameScore.setLastScore(score);
		gameScore.setBestScore(Math.max(gameScore.getBestScore() == null ? 0 : gameScore.getBestScore(), score));
		gameScore.setTimesPlayed((gameScore.getTimesPlayed() == null ? 0 : gameScore.getTimesPlayed()) + 1);

		return new GameScoreDTO(gameScoreRepository.save(gameScore));
	}

	@Transactional(readOnly = true)
	public List<GameScoreDTO> getGameScores(Long userId) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		return gameScoreRepository.findByUser(user).stream().map(GameScoreDTO::new).toList();
	}

	private int getRequiredVideosCount(String moduleName) {
		return switch (moduleName.toLowerCase()) {
			case "vowels" -> 3;
			case "consonants" -> 6;
			case "alphabet" -> 0;
			case "cvc" -> 1;
			default -> 0;
		};
	}

	private void assertActiveDevice(User user, String deviceId) {
		if (!deviceLockEnabled) {
			return;
		}
		String activeDeviceId = user.getActiveDeviceId();
		String requestedDeviceId = deviceId == null ? "" : deviceId.trim();
		if (activeDeviceId == null || activeDeviceId.isBlank() || requestedDeviceId.isEmpty()
			|| !activeDeviceId.equals(requestedDeviceId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This device is not authorized for the account");
		}
	}

	// DTOs
	public record ProgressDTO(
		Long progressId,
		String moduleName,
		String videosWatched,
		Boolean lessonUnlocked,
		Boolean pretestUnlocked,
		Boolean pretestCompleted,
		Boolean easyModeCompleted,
		Boolean mediumModeCompleted,
		Boolean hardModeCompleted,
		Integer completionPercentage,
		String assessmentScores,
		String activityProgress,
		java.time.LocalDateTime createdAt,
		java.time.LocalDateTime updatedAt
	) {
		public ProgressDTO(Progress progress) {
			this(
				progress.getProgressId(),
				progress.getModuleName(),
				progress.getVideosWatched(),
				progress.getLessonUnlocked(),
				progress.getPretestUnlocked(),
				progress.getPretestCompleted(),
				progress.getEasyModeCompleted(),
				progress.getMediumModeCompleted(),
				progress.getHardModeCompleted(),
				progress.getCompletionPercentage(),
				progress.getAssessmentScores(),
				progress.getActivityProgress(),
				progress.getCreatedAt(),
				progress.getUpdatedAt()
			);
		}
	}

	public record GameScoreDTO(
		String gameName,
		Integer bestScore,
		Integer lastScore,
		Integer timesPlayed,
		java.time.LocalDateTime updatedAt
	) {
		public GameScoreDTO(GameScore gameScore) {
			this(
				gameScore.getGameName(),
				gameScore.getBestScore(),
				gameScore.getLastScore(),
				gameScore.getTimesPlayed(),
				gameScore.getUpdatedAt()
			);
		}
	}

	public record GameScoreRequest(String gameName, Integer score) {
	}

	public record UpdateProgressRequest(
		Boolean easyModeCompleted,
		Boolean mediumModeCompleted,
		Boolean hardModeCompleted,
		Boolean pretestCompleted,
		List<Integer> videosWatched,
		String assessmentScores,
		String activityProgress
	) {
	}
}
