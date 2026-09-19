package com.phonexis.backend.Entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "pretest_questions")
public class PretestQuestion {
	public enum QuestionType {
		MULTIPLE_CHOICE,
		MATCHING,
		IDENTIFICATION,
		TRUE_FALSE,
		FILL_BLANK
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "question_id")
	private Long questionId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "pretest_id", nullable = false)
	private Pretest pretest;

	@Enumerated(EnumType.STRING)
	@Column(name = "question_type", nullable = false, length = 30)
	private QuestionType questionType;

	@Column(name = "prompt_text", nullable = false, length = 500)
	private String promptText;

	@Column(name = "audio_storage_path", length = 500)
	private String audioStoragePath;

	@Column(name = "correct_answer_text", length = 300)
	private String correctAnswerText;

	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder = 0;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	@OrderBy("sortOrder ASC")
	private List<PretestOption> options = new ArrayList<>();

	public Long getQuestionId() { return questionId; }
	public Pretest getPretest() { return pretest; }
	public void setPretest(Pretest pretest) { this.pretest = pretest; }
	public QuestionType getQuestionType() { return questionType; }
	public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }
	public String getPromptText() { return promptText; }
	public void setPromptText(String promptText) { this.promptText = promptText; }
	public String getAudioStoragePath() { return audioStoragePath; }
	public void setAudioStoragePath(String audioStoragePath) { this.audioStoragePath = audioStoragePath; }
	public String getCorrectAnswerText() { return correctAnswerText; }
	public void setCorrectAnswerText(String correctAnswerText) { this.correctAnswerText = correctAnswerText; }
	public Integer getSortOrder() { return sortOrder; }
	public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public List<PretestOption> getOptions() { return options; }

	@PrePersist
	public void prePersist() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
	}
}
