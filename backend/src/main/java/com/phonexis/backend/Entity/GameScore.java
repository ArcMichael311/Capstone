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
@Table(name = "game_scores", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "game_name" }))
public class GameScore {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "game_score_id")
	private Long gameScoreId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "game_name", nullable = false, length = 40)
	private String gameName; // "alphaquest", "vowelrush", "wordblast", "balloonpop"

	@Column(name = "best_score", nullable = false)
	private Integer bestScore = 0;

	@Column(name = "last_score", nullable = false)
	private Integer lastScore = 0;

	@Column(name = "times_played", nullable = false)
	private Integer timesPlayed = 0;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	public GameScore() {
	}

	public GameScore(User user, String gameName) {
		this.user = user;
		this.gameName = gameName;
	}

	public Long getGameScoreId() {
		return gameScoreId;
	}

	public User getUser() {
		return user;
	}

	public String getGameName() {
		return gameName;
	}

	public Integer getBestScore() {
		return bestScore;
	}

	public void setBestScore(Integer bestScore) {
		this.bestScore = bestScore;
	}

	public Integer getLastScore() {
		return lastScore;
	}

	public void setLastScore(Integer lastScore) {
		this.lastScore = lastScore;
	}

	public Integer getTimesPlayed() {
		return timesPlayed;
	}

	public void setTimesPlayed(Integer timesPlayed) {
		this.timesPlayed = timesPlayed;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	@PrePersist
	public void prePersist() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
		updatedAt = LocalDateTime.now();
	}

	@PreUpdate
	public void preUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
