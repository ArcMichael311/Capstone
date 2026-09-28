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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "class_enrollments", uniqueConstraints = @UniqueConstraint(columnNames = { "class_id", "student_id" }))
public class ClassEnrollment {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "enrollment_id")
	private Long enrollmentId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "class_id", nullable = false)
	private ClassSection classSection;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@Column(name = "added_at", nullable = false, updatable = false)
	private LocalDateTime addedAt;

	public Long getEnrollmentId() { return enrollmentId; }
	public ClassSection getClassSection() { return classSection; }
	public void setClassSection(ClassSection classSection) { this.classSection = classSection; }
	public User getStudent() { return student; }
	public void setStudent(User student) { this.student = student; }
	public LocalDateTime getAddedAt() { return addedAt; }

	@PrePersist
	public void prePersist() {
		if (addedAt == null) {
			addedAt = LocalDateTime.now();
		}
	}
}
