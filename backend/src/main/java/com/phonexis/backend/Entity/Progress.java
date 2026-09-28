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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "progress", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "module_name" }))
public class Progress {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "progress_id")
	private Long progressId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "module_name", nullable = false, length = 100)
	private String moduleName; // e.g., "alphabet", "vowels", "consonants", "cvc"

	@Column(name = "videos_watched", columnDefinition = "TEXT")
	private String videosWatched; // JSON array of video IDs

	@Column(name = "lesson_unlocked", nullable = false)
	private Boolean lessonUnlocked = false;

	@Column(name = "pretest_unlocked", nullable = false)
	private Boolean pretestUnlocked = false;

	@Column(name = "pretest_completed", nullable = false)
	private Boolean pretestCompleted = false;

	@Column(name = "easy_mode_completed", nullable = false)
	private Boolean easyModeCompleted = false;

	@Column(name = "medium_mode_completed", nullable = false)
	private Boolean mediumModeCompleted = false;

	@Column(name = "hard_mode_completed", nullable = false)
	private Boolean hardModeCompleted = false;

	@Column(name = "assessment_scores", columnDefinition = "TEXT")
	private String assessmentScores;

	@Column(name = "module_completion_percentage", nullable = false)
	private Integer completionPercentage = 0;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	public Progress() {
	}

	public Progress(User user, String moduleName) {
		this.user = user;
		this.moduleName = moduleName;
		this.videosWatched = "[]";
		this.lessonUnlocked = false;
		this.pretestUnlocked = false;
		this.pretestCompleted = false;
		this.easyModeCompleted = false;
		this.mediumModeCompleted = false;
		this.hardModeCompleted = false;
		this.completionPercentage = 0;
	}

	// Getters and Setters
	public Long getProgressId() {
		return progressId;
	}

	public void setProgressId(Long progressId) {
		this.progressId = progressId;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public String getModuleName() {
		return moduleName;
	}

	public void setModuleName(String moduleName) {
		this.moduleName = moduleName;
	}

	public String getVideosWatched() {
		return videosWatched;
	}

	public void setVideosWatched(String videosWatched) {
		this.videosWatched = videosWatched;
	}

	public Boolean getLessonUnlocked() {
		return lessonUnlocked;
	}

	public void setLessonUnlocked(Boolean lessonUnlocked) {
		this.lessonUnlocked = lessonUnlocked;
	}

	public Boolean getPretestUnlocked() {
		return pretestUnlocked;
	}

	public void setPretestUnlocked(Boolean pretestUnlocked) {
		this.pretestUnlocked = pretestUnlocked;
	}

	public Boolean getPretestCompleted() {
		return pretestCompleted;
	}

	public void setPretestCompleted(Boolean pretestCompleted) {
		this.pretestCompleted = pretestCompleted;
	}

	public Boolean getEasyModeCompleted() {
		return easyModeCompleted;
	}

	public void setEasyModeCompleted(Boolean easyModeCompleted) {
		this.easyModeCompleted = easyModeCompleted;
	}

	public Boolean getMediumModeCompleted() {
		return mediumModeCompleted;
	}

	public void setMediumModeCompleted(Boolean mediumModeCompleted) {
		this.mediumModeCompleted = mediumModeCompleted;
	}

	public Boolean getHardModeCompleted() {
		return hardModeCompleted;
	}

	public void setHardModeCompleted(Boolean hardModeCompleted) {
		this.hardModeCompleted = hardModeCompleted;
	}

	public String getAssessmentScores() {
		return assessmentScores;
	}

	public void setAssessmentScores(String assessmentScores) {
		this.assessmentScores = assessmentScores;
	}

	public Integer getCompletionPercentage() {
		return completionPercentage;
	}

	public void setCompletionPercentage(Integer completionPercentage) {
		this.completionPercentage = completionPercentage;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	@PrePersist
	public void prePersist() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
		if (updatedAt == null) {
			updatedAt = LocalDateTime.now();
		}
	}

	@PreUpdate
	public void preUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
