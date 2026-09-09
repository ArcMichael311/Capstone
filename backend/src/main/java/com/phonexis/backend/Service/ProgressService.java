package com.phonexis.backend.Service;

import java.util.List;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.Progress;
import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.ProgressRepository;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class ProgressService {
	private final ProgressRepository progressRepository;
	private final UserRepository userRepository;

	public ProgressService(ProgressRepository progressRepository, UserRepository userRepository) {
		this.progressRepository = progressRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public ProgressDTO getProgress(Long userId, String moduleName) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElse(createDefaultProgress(user, moduleName));

		return new ProgressDTO(progress);
	}

	@Transactional
	public ProgressDTO updateVideosWatched(Long userId, String moduleName, List<Integer> videoIds) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElse(createDefaultProgress(user, moduleName));

		// Update videos watched
		Set<Integer> uniqueVideoIds = new LinkedHashSet<>(videoIds == null ? List.of() : videoIds);
		String videosJson = "[" + String.join(",", uniqueVideoIds.stream().map(String::valueOf).toList()) + "]";
		progress.setVideosWatched(videosJson);

		// Check if all required videos are watched for this module
		int requiredVideos = getRequiredVideosCount(moduleName);
		if (requiredVideos > 0) {
			int watchedCount = Math.min(uniqueVideoIds.size(), requiredVideos);
			progress.setCompletionPercentage(Math.round((watchedCount / (float) requiredVideos) * 100));
		}
		if (requiredVideos > 0 && uniqueVideoIds.size() >= requiredVideos) {
			progress.setLessonUnlocked(true);
			progress.setPretestUnlocked(true);
		}

		progressRepository.save(progress);
		return new ProgressDTO(progress);
	}

	@Transactional(readOnly = true)
	public boolean canAccessLesson(Long userId, String moduleName) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElse(null);

		return progress != null && progress.getLessonUnlocked();
	}

	@Transactional(readOnly = true)
	public boolean canAccessPretest(Long userId, String moduleName) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElse(null);

		return progress != null && progress.getPretestUnlocked();
	}

	@Transactional
	public ProgressDTO updateModuleCompletion(Long userId, String moduleName, UpdateProgressRequest request) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		Progress progress = progressRepository.findByUserAndModuleName(user, moduleName)
			.orElse(createDefaultProgress(user, moduleName));

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
			// Preserve video-based completion until the module pretest is complete.
			if (progress.getPretestCompleted()) {
				progress.setCompletionPercentage(100);
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
		return progressList.stream().map(ProgressDTO::new).toList();
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

	private int getRequiredVideosCount(String moduleName) {
		return switch (moduleName.toLowerCase()) {
			case "vowels" -> 3;
			case "consonants" -> 6;
			case "alphabet" -> 0;
			case "cvc" -> 1;
			default -> 0;
		};
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
				progress.getCreatedAt(),
				progress.getUpdatedAt()
			);
		}
	}

	public record UpdateProgressRequest(
		Boolean easyModeCompleted,
		Boolean mediumModeCompleted,
		Boolean hardModeCompleted,
		Boolean pretestCompleted,
		List<Integer> videosWatched
	) {
	}
}
