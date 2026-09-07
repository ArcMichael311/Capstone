package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.LearningModuleService;

@RestController
@RequestMapping("/api/modules")
public class LearningModuleController {
	private final LearningModuleService learningModuleService;

	public LearningModuleController(LearningModuleService learningModuleService) {
		this.learningModuleService = learningModuleService;
	}

	@GetMapping
	public ResponseEntity<List<LearningModuleService.ModuleResponse>> listModules() {
		return ResponseEntity.ok(learningModuleService.listModules());
	}

	@GetMapping("/{id}")
	public ResponseEntity<LearningModuleService.ModuleResponse> getModule(@PathVariable Long id) {
		return ResponseEntity.ok(learningModuleService.getModule(id));
	}

	@GetMapping("/key/{moduleKey}")
	public ResponseEntity<LearningModuleService.ModuleResponse> getModuleByKey(@PathVariable String moduleKey) {
		return ResponseEntity.ok(learningModuleService.getModuleByKey(moduleKey));
	}

	@PostMapping
	public ResponseEntity<LearningModuleService.ModuleResponse> createModule(@RequestBody LearningModuleService.CreateModuleRequest request) {
		return ResponseEntity.ok(learningModuleService.createModule(request));
	}

	@PutMapping("/{id}")
	public ResponseEntity<LearningModuleService.ModuleResponse> updateModule(@PathVariable Long id, @RequestBody LearningModuleService.UpdateModuleRequest request) {
		return ResponseEntity.ok(learningModuleService.updateModule(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> deleteModule(@PathVariable Long id) {
		learningModuleService.deleteModule(id);
		return ResponseEntity.ok(new MessageResponse("Module deleted successfully"));
	}

	public record MessageResponse(String message) {
	}
}