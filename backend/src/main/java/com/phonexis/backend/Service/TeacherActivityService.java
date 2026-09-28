package com.phonexis.backend.Service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.TeacherActivity;
import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.TeacherActivityRepository;
import com.phonexis.backend.Repository.UserRepository;

@Service
public class TeacherActivityService {
	private final TeacherActivityRepository activityRepository;
	private final UserRepository userRepository;

	public TeacherActivityService(TeacherActivityRepository activityRepository, UserRepository userRepository) {
		this.activityRepository = activityRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<ActivityResponse> listActivities(Long teacherId) {
		User teacher = getTeacher(teacherId);
		return activityRepository.findByTeacherOrderByCreatedAtDesc(teacher).stream().map(ActivityResponse::new).toList();
	}

	@Transactional
	public ActivityResponse createActivity(Long teacherId, CreateActivityRequest request) {
		User teacher = getTeacher(teacherId);
		String moduleKey = normalize(request.moduleKey());
		String title = clean(request.title());
		String focus = clean(request.focus());
		String instructions = clean(request.instructions());
		if (!moduleKey.equals("vowels") && !moduleKey.equals("consonants")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity module must be vowels or consonants");
		}
		if (title.isEmpty() || focus.isEmpty() || instructions.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity title, focus, and instructions are required");
		}

		TeacherActivity activity = new TeacherActivity();
		activity.setTeacher(teacher);
		activity.setModuleKey(moduleKey);
		activity.setTitle(title);
		activity.setFocus(focus);
		activity.setInstructions(instructions);
		return new ActivityResponse(activityRepository.save(activity));
	}

	private User getTeacher(Long teacherId) {
		User teacher = userRepository.findById(teacherId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
		if (teacher.getRole() != User.Role.TEACHER) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only teacher accounts can manage activities");
		}
		return teacher;
	}

	private String normalize(String value) { return value == null ? "" : value.trim().toLowerCase(); }
	private String clean(String value) { return value == null ? "" : value.trim(); }

	public record CreateActivityRequest(String moduleKey, String title, String focus, String instructions) { }

	public record ActivityResponse(Long id, Long teacherId, String moduleKey, String title, String focus, String instructions, java.time.LocalDateTime createdAt) {
		public ActivityResponse(TeacherActivity activity) {
			this(activity.getActivityId(), activity.getTeacher().getId(), activity.getModuleKey(), activity.getTitle(), activity.getFocus(), activity.getInstructions(), activity.getCreatedAt());
		}
	}
}
