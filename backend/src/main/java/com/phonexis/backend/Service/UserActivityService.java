package com.phonexis.backend.Service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Entity.UserActivity;
import com.phonexis.backend.Repository.UserActivityRepository;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class UserActivityService {
	private final UserActivityRepository activityRepository;
	private final UserRepository userRepository;

	public UserActivityService(UserActivityRepository activityRepository, UserRepository userRepository) {
		this.activityRepository = activityRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	public ActivityDTO record(Long userId, String moduleName, String action, String details) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		String normalizedModule = requireValue(moduleName, "Module name");
		String normalizedAction = requireValue(action, "Activity action");
		String normalizedDetails = details == null ? null : details.trim();
		if (normalizedDetails != null && normalizedDetails.length() > 1000) {
			normalizedDetails = normalizedDetails.substring(0, 1000);
		}

		return new ActivityDTO(activityRepository.save(new UserActivity(user, normalizedModule, normalizedAction, normalizedDetails)));
	}

	@Transactional(readOnly = true)
	public List<ActivityDTO> list(Long userId) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		return activityRepository.findTop100ByUserOrderByCreatedAtDesc(user).stream().map(ActivityDTO::new).toList();
	}

	private String requireValue(String value, String label) {
		String normalized = value == null ? "" : value.trim();
		if (normalized.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required");
		}
		return normalized;
	}

	public record ActivityDTO(Long activityId, String moduleName, String action, String details, java.time.LocalDateTime createdAt) {
		public ActivityDTO(UserActivity activity) {
			this(activity.getActivityId(), activity.getModuleName(), activity.getAction(), activity.getDetails(), activity.getCreatedAt());
		}
	}
}