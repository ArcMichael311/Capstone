package com.phonexis.backend.Controller;

import java.net.URI;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
	@Value("${app.frontend-url:}")
	private String frontendUrl;

	@GetMapping("/")
	public ResponseEntity<Void> frontend() {
		if (frontendUrl == null || frontendUrl.isBlank()) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}

		return ResponseEntity.status(HttpStatus.FOUND)
			.location(URI.create(frontendUrl.trim()))
			.build();
	}

	@GetMapping("/health")
	public Map<String, String> health() {
		return Map.of("status", "ok");
	}
}