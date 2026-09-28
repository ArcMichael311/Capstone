package com.phonexis.backend.Entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "pretest_attempts")
public class PretestAttempt {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "attempt_id")
	private Long attemptId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "pretest_id", nullable = false)
	private Pretest pretest;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@Column(nullable = false)
	private Integer score;

	@Column(name = "total_questions", nullable = false)
	private Integer totalQuestions;

	@Column(name = "submitted_at", nullable = false, updatable = false)
	private LocalDateTime submittedAt;

	@OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<PretestAnswer> answers = new ArrayList<>();

	public Long getAttemptId() { return attemptId; }
	public Pretest getPretest() { return pretest; }
	public void setPretest(Pretest pretest) { this.pretest = pretest; }
	public User getStudent() { return student; }
	public void setStudent(User student) { this.student = student; }
	public Integer getScore() { return score; }
	public void setScore(Integer score) { this.score = score; }
	public Integer getTotalQuestions() { return totalQuestions; }
	public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
	public LocalDateTime getSubmittedAt() { return submittedAt; }
	public List<PretestAnswer> getAnswers() { return answers; }

	@PrePersist
	public void prePersist() {
		if (submittedAt == null) {
			submittedAt = LocalDateTime.now();
		}
	}
}
