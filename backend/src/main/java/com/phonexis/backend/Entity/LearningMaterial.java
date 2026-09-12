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
@Table(name = "learning_materials")
public class LearningMaterial {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "material_id")
	private Long materialId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "class_id", nullable = false)
	private ClassSection classSection;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = false)
	private User teacher;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(name = "file_name", nullable = false, length = 255)
	private String fileName;

	@Column(name = "storage_path", nullable = false, length = 500)
	private String storagePath;

	@Column(name = "content_type", length = 150)
	private String contentType;

	@Column(name = "material_type", nullable = false, length = 20)
	private String materialType;

	@Column(name = "file_size")
	private Long fileSize;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public Long getMaterialId() { return materialId; }
	public ClassSection getClassSection() { return classSection; }
	public void setClassSection(ClassSection classSection) { this.classSection = classSection; }
	public User getTeacher() { return teacher; }
	public void setTeacher(User teacher) { this.teacher = teacher; }
	public String getTitle() { return title; }
	public void setTitle(String title) { this.title = title; }
	public String getFileName() { return fileName; }
	public void setFileName(String fileName) { this.fileName = fileName; }
	public String getStoragePath() { return storagePath; }
	public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
	public String getContentType() { return contentType; }
	public void setContentType(String contentType) { this.contentType = contentType; }
	public String getMaterialType() { return materialType; }
	public void setMaterialType(String materialType) { this.materialType = materialType; }
	public Long getFileSize() { return fileSize; }
	public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
	public LocalDateTime getCreatedAt() { return createdAt; }

	@PrePersist
	public void prePersist() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
	}
}
