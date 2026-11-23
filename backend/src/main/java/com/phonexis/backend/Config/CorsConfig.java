package com.phonexis.backend.Config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * CORS is registered with Spring Security (see SecurityConfig#cors) so that browser
 * preflight (OPTIONS) requests are answered before authentication runs. Registering it
 * only with Spring MVC makes preflights fail with 401 and the frontend can't connect.
 *
 * Allowed origins come from FRONTEND_URL (comma-separated). Localhost is always allowed
 * for development.
 */
@Configuration
public class CorsConfig {
	@Value("${app.frontend-url:}")
	private String frontendUrl;

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		List<String> allowedOrigins = new ArrayList<>(List.of(
			"http://localhost:3000",
			"http://127.0.0.1:3000"
		));

		if (frontendUrl != null && !frontendUrl.isBlank()) {
			for (String origin : frontendUrl.split(",")) {
				String normalizedOrigin = origin.trim();
				while (normalizedOrigin.endsWith("/")) {
					normalizedOrigin = normalizedOrigin.substring(0, normalizedOrigin.length() - 1);
				}
				if (!normalizedOrigin.isEmpty() && !allowedOrigins.contains(normalizedOrigin)) {
					allowedOrigins.add(normalizedOrigin);
				}
			}
		}

		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(allowedOrigins);
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Device-Id"));
		// Auth uses a Bearer header, not cookies, so credentials are not needed (reduces CSRF risk).
		configuration.setAllowCredentials(false);
		configuration.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", configuration);
		return source;
	}
}
