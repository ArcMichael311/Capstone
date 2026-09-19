package com.phonexis.backend.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pretest_options")
public class PretestOption {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "option_id")
	private Long optionId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "question_id", nullable = false)
	private PretestQuestion question;

	@Column(nullable = false, length = 300)
	private String label;

	@Column(name = "match_value", length = 300)
	private String matchValue;

	@Column(name = "audio_storage_path", length = 500)
	private String audioStoragePath;

	@Column(name = "is_correct", nullable = false)
	private boolean correct = false;

	@Column(name = "sort_order", nullable = false)
	private Integer sortOrder = 0;

	public Long getOptionId() { return optionId; }
	public PretestQuestion getQuestion() { return question; }
	public void setQuestion(PretestQuestion question) { this.question = question; }
	public String getLabel() { return label; }
	public void setLabel(String label) { this.label = label; }
	public String getMatchValue() { return matchValue; }
	public void setMatchValue(String matchValue) { this.matchValue = matchValue; }
	public String getAudioStoragePath() { return audioStoragePath; }
	public void setAudioStoragePath(String audioStoragePath) { this.audioStoragePath = audioStoragePath; }
	public boolean isCorrect() { return correct; }
	public void setCorrect(boolean correct) { this.correct = correct; }
	public Integer getSortOrder() { return sortOrder; }
	public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
