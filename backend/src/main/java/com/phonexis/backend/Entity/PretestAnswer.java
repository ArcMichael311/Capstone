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
@Table(name = "pretest_answers")
public class PretestAnswer {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "answer_id")
	private Long answerId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "attempt_id", nullable = false)
	private PretestAttempt attempt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "question_id", nullable = false)
	private PretestQuestion question;

	@Column(name = "response_text", length = 500)
	private String responseText;

	@Column(name = "is_correct", nullable = false)
	private boolean correct = false;

	public Long getAnswerId() { return answerId; }
	public PretestAttempt getAttempt() { return attempt; }
	public void setAttempt(PretestAttempt attempt) { this.attempt = attempt; }
	public PretestQuestion getQuestion() { return question; }
	public void setQuestion(PretestQuestion question) { this.question = question; }
	public String getResponseText() { return responseText; }
	public void setResponseText(String responseText) { this.responseText = responseText; }
	public boolean isCorrect() { return correct; }
	public void setCorrect(boolean correct) { this.correct = correct; }
}
