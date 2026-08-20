package com.phonexis.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonexis.backend.Service.ModuleGameService;

@RestController
@RequestMapping("/api/module-games")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"})
public class ModuleGameController {
	private final ModuleGameService moduleGameService;

	public ModuleGameController(ModuleGameService moduleGameService) {
		this.moduleGameService = moduleGameService;
	}

	@GetMapping
	public ResponseEntity<List<ModuleGameService.ModuleGameResponse>> listGames() {
		return ResponseEntity.ok(moduleGameService.listGames());
	}

	@GetMapping("/{id}")
	public ResponseEntity<ModuleGameService.ModuleGameResponse> getGame(@PathVariable Long id) {
		return ResponseEntity.ok(moduleGameService.getGame(id));
	}

	@GetMapping("/module/{moduleKey}")
	public ResponseEntity<List<ModuleGameService.ModuleGameResponse>> getGamesByModule(@PathVariable String moduleKey) {
		return ResponseEntity.ok(moduleGameService.listGamesByModule(moduleKey));
	}

	@GetMapping("/key/{gameKey}")
	public ResponseEntity<ModuleGameService.ModuleGameResponse> getGameByKey(@PathVariable String gameKey) {
		return ResponseEntity.ok(moduleGameService.getGameByKey(gameKey));
	}

	@PostMapping
	public ResponseEntity<ModuleGameService.ModuleGameResponse> createGame(@RequestBody ModuleGameService.CreateGameRequest request) {
		return ResponseEntity.ok(moduleGameService.createGame(request));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ModuleGameService.ModuleGameResponse> updateGame(@PathVariable Long id, @RequestBody ModuleGameService.UpdateGameRequest request) {
		return ResponseEntity.ok(moduleGameService.updateGame(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> deleteGame(@PathVariable Long id) {
		moduleGameService.deleteGame(id);
		return ResponseEntity.ok(new MessageResponse("Game deleted successfully"));
	}

	public record MessageResponse(String message) {
	}
}