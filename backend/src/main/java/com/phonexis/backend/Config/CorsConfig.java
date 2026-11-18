package com.phonexis.backend.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
	@Value("${app.frontend-url:}")
	private String frontendUrl;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		List<String> allowedOrigins = new ArrayList<>();

		if (frontendUrl == null || frontendUrl.isBlank()) {
			allowedOrigins.add("http://localhost:3000");
			allowedOrigins.add("http://127.0.0.1:3000");
		}

		if (frontendUrl != null && !frontendUrl.isBlank()) {
			for (String origin : frontendUrl.split(",")) {
				String normalizedOrigin = origin.trim();
				while (normalizedOrigin.endsWith("/")) {
					normalizedOrigin = normalizedOrigin.substring(0, normalizedOrigin.length() - 1);
				}
				if (!normalizedOrigin.isEmpty()) {
					allowedOrigins.add(normalizedOrigin);
				}
			}
		}

		registry.addMapping("/api/**")
			.allowedOriginPatterns(allowedOrigins.toArray(String[]::new))
			.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
			.allowedHeaders("*")
			.allowCredentials(false);
	}
}