package com.phonexis.backend.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
	@Value("${app.frontend-url:}")
	private String frontendUrl;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		var mapping = registry.addMapping("/api/**")
			.allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://*.vercel.app")
			.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
			.allowedHeaders("*")
			.allowCredentials(false);

		if (frontendUrl != null && !frontendUrl.isBlank()) {
			mapping.allowedOriginPatterns(frontendUrl.trim());
		}
	}
}