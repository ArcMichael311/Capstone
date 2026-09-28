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
		List<String> allowedOrigins = new ArrayList<>(List.of(
			"http://localhost:*",
			"http://127.0.0.1:*",
			"https://*.vercel.app"
		));

		if (frontendUrl != null && !frontendUrl.isBlank()) {
			for (String origin : frontendUrl.split(",")) {
				String normalizedOrigin = origin.trim();
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