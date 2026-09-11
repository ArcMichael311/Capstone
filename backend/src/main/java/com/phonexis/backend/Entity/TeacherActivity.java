package com.phonexis.backend.Entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "teacher_activities")
public class TeacherActivity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "activity_id")
	private Long activityId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = false)
	private User teacher;

	@Column(name = "module_key", nullable = false, length = 40)
	private String moduleKey;

	@Column(nullable = false, length = 150)
	private String title;

	@Column(nullable = false, length = 200)
	private String focus;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String instructions;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	public Long getActivityId() { return activityId; }
	public User getTeacher() { return teacher; }
	public void setTeacher(User teacher) { this.teacher = teacher; }
	public String getModuleKey() { return moduleKey; }
	public void setModuleKey(String moduleKey) { this.moduleKey = moduleKey; }
	public String getTitle() { return title; }
	public void setTitle(String title) { this.title = title; }
	public String getFocus() { return focus; }
	public void setFocus(String focus) { this.focus = focus; }
	public String getInstructions() { return instructions; }
	public void setInstructions(String instructions) { this.instructions = instructions; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public LocalDateTime getUpdatedAt() { return updatedAt; }

	@PrePersist
	public void prePersist() {
		if (createdAt == null) createdAt = LocalDateTime.now();
		if (updatedAt == null) updatedAt = LocalDateTime.now();
	}

	@PreUpdate
	public void preUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
