package com.phonexis.backend.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.ClassSection;
import com.phonexis.backend.Entity.LearningMaterial;
import com.phonexis.backend.Repository.ClassSectionRepository;
import com.phonexis.backend.Repository.LearningMaterialRepository;

@Service
public class LearningMaterialService {
	private static final Map<String, String> ALLOWED_EXTENSIONS = Map.of(
		"ppt", "ppt",
		"pptx", "ppt",
		"pdf", "pdf",
		"mp4", "mp4",
		"mp3", "mp3"
	);
	private static final int SIGNED_URL_TTL_SECONDS = 600;

	private final LearningMaterialRepository learningMaterialRepository;
	private final ClassSectionRepository classSectionRepository;
	private final SupabaseStorageService supabaseStorageService;

	@Value("${app.max-upload-size-mb:50}")
	private long maxUploadSizeMb;

	public LearningMaterialService(
		LearningMaterialRepository learningMaterialRepository,
		ClassSectionRepository classSectionRepository,
		SupabaseStorageService supabaseStorageService
	) {
		this.learningMaterialRepository = learningMaterialRepository;
		this.classSectionRepository = classSectionRepository;
		this.supabaseStorageService = supabaseStorageService;
	}

	@Transactional
	public MaterialResponse upload(Long classId, Long teacherId, String title, MultipartFile file) {
		ClassSection classSection = getOwnedClass(classId, teacherId);

		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A file is required");
		}

		long maxBytes = maxUploadSizeMb * 1024L * 1024L;
		if (file.getSize() > maxBytes) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds the " + maxUploadSizeMb + "MB upload limit");
		}

		String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "material";
		String extension = extensionOf(originalName);
		String materialType = ALLOWED_EXTENSIONS.get(extension);
		if (materialType == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PPT, PDF, MP4, and MP3 files are allowed");
		}

		String cleanTitle = title != null && !title.isBlank() ? title.trim() : stripExtension(originalName);
		String storagePath = "class-" + classId + "/" + UUID.randomUUID() + "-" + sanitizeFileName(originalName);

		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded file");
		}

		supabaseStorageService.upload(storagePath, bytes, file.getContentType());

		LearningMaterial material = new LearningMaterial();
		material.setClassSection(classSection);
		material.setTeacher(classSection.getTeacher());
		material.setTitle(cleanTitle);
		material.setFileName(originalName);
		material.setStoragePath(storagePath);
		material.setContentType(file.getContentType());
		material.setMaterialType(materialType);
		material.setFileSize(file.getSize());

		return toResponse(learningMaterialRepository.save(material));
	}

	@Transactional(readOnly = true)
	public List<MaterialResponse> listMaterials(Long classId) {
		ClassSection classSection = getClassEntity(classId);
		return learningMaterialRepository.findByClassSectionOrderByCreatedAtDesc(classSection).stream()
			.map(this::toResponse)
			.toList();
	}

	@Transactional
	public void deleteMaterial(Long materialId, Long teacherId) {
		LearningMaterial material = getMaterialEntity(materialId);
		if (teacherId == null || !material.getTeacher().getUserId().equals(teacherId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This material does not belong to that teacher account");
		}

		deleteMaterialEntity(material);
	}

	/**
	 * Best-effort cleanup used when an entire class is deleted: removes every material's
	 * storage object and database row. Storage failures are swallowed so a Supabase Storage
	 * outage (or missing configuration) never blocks deleting the class locally.
	 */
	@Transactional
	public void deleteAllForClass(ClassSection classSection) {
		for (LearningMaterial material : learningMaterialRepository.findByClassSectionOrderByCreatedAtDesc(classSection)) {
			try {
				supabaseStorageService.delete(material.getStoragePath());
			} catch (ResponseStatusException e) {
				// Ignore storage cleanup failures; the class deletion should still proceed.
			}
			learningMaterialRepository.delete(material);
		}
	}

	private void deleteMaterialEntity(LearningMaterial material) {
		supabaseStorageService.delete(material.getStoragePath());
		learningMaterialRepository.delete(material);
	}

	private LearningMaterial getMaterialEntity(Long materialId) {
		return learningMaterialRepository.findById(materialId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material not found"));
	}

	private ClassSection getClassEntity(Long classId) {
		if (classId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class id is required");
		}

		return classSectionRepository.findById(classId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
	}

	private ClassSection getOwnedClass(Long classId, Long teacherId) {
		ClassSection classSection = getClassEntity(classId);
		if (teacherId == null || !classSection.getTeacher().getUserId().equals(teacherId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This class does not belong to that teacher account");
		}
		return classSection;
	}

	private MaterialResponse toResponse(LearningMaterial material) {
		String downloadUrl = supabaseStorageService.isConfigured()
			? supabaseStorageService.createSignedUrl(material.getStoragePath(), SIGNED_URL_TTL_SECONDS)
			: null;

		return new MaterialResponse(
			material.getMaterialId(),
			material.getClassSection().getClassId(),
			material.getTitle(),
			material.getFileName(),
			material.getMaterialType(),
			material.getContentType(),
			material.getFileSize(),
			material.getCreatedAt(),
			downloadUrl
		);
	}

	private String extensionOf(String fileName) {
		int dotIndex = fileName.lastIndexOf('.');
		return dotIndex >= 0 && dotIndex < fileName.length() - 1 ? fileName.substring(dotIndex + 1).toLowerCase() : "";
	}

	private String stripExtension(String fileName) {
		int dotIndex = fileName.lastIndexOf('.');
		return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
	}

	private String sanitizeFileName(String fileName) {
		return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
	}

	public record MaterialResponse(
		Long id,
		Long classId,
		String title,
		String fileName,
		String materialType,
		String contentType,
		Long fileSize,
		LocalDateTime createdAt,
		String downloadUrl
	) { }
}
