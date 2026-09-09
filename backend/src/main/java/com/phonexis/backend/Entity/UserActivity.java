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
import jakarta.persistence.Table;

@Entity
@Table(name = "user_activity")
public class UserActivity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "activity_id")
	private Long activityId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "module_name", nullable = false, length = 100)
	private String moduleName;

	@Column(name = "action", nullable = false, length = 100)
	private String action;

	@Column(name = "details", length = 1000)
	private String details;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public UserActivity() {
	}

	public UserActivity(User user, String moduleName, String action, String details) {
		this.user = user;
		this.moduleName = moduleName;
		this.action = action;
		this.details = details;
	}

	@PrePersist
	public void prePersist() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
	}

	public Long getActivityId() { return activityId; }
	public User getUser() { return user; }
	public String getModuleName() { return moduleName; }
	public String getAction() { return action; }
	public String getDetails() { return details; }
	public LocalDateTime getCreatedAt() { return createdAt; }
}