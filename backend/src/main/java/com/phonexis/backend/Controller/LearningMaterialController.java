package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.phonexis.backend.Service.LearningMaterialService;

@RestController
@RequestMapping("/api/learning-materials")
public class LearningMaterialController {
	private final LearningMaterialService learningMaterialService;

	public LearningMaterialController(LearningMaterialService learningMaterialService) {
		this.learningMaterialService = learningMaterialService;
	}

	@PostMapping(value = "/class/{classId}", consumes = "multipart/form-data")
	public ResponseEntity<LearningMaterialService.MaterialResponse> upload(
		@PathVariable Long classId,
		@RequestParam Long teacherId,
		@RequestParam(required = false) String title,
		@RequestParam("file") MultipartFile file
	) {
		return ResponseEntity.ok(learningMaterialService.upload(classId, teacherId, title, file));
	}

	@GetMapping("/class/{classId}")
	public ResponseEntity<List<LearningMaterialService.MaterialResponse>> listMaterials(@PathVariable Long classId) {
		return ResponseEntity.ok(learningMaterialService.listMaterials(classId));
	}

	@DeleteMapping("/{materialId}")
	public ResponseEntity<MessageResponse> deleteMaterial(@PathVariable Long materialId, @RequestParam Long teacherId) {
		learningMaterialService.deleteMaterial(materialId, teacherId);
		return ResponseEntity.ok(new MessageResponse("Material deleted successfully"));
	}

	public record MessageResponse(String message) { }
}
