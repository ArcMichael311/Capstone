package com.phonexis.backend.Config;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
	private static final Logger LOGGER = LoggerFactory.getLogger(CorsConfig.class);

	@Value("${app.frontend-url:}")
	private String frontendUrl;

	// Vercel gives every deployment its own URL (https://phonexis-<random>-phonexis.vercel.app),
	// so an exact FRONTEND_URL breaks on each redeploy. These patterns cover this Vercel project.
	// Override with FRONTEND_URL_PATTERNS (comma-separated, "*" = any characters).
	@Value("${app.frontend-url-patterns:https://phonexis.vercel.app,https://phonexis-*-phonexis.vercel.app}")
	private String frontendUrlPatterns;

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		List<String> allowedOrigins = new ArrayList<>(List.of(
			"http://localhost:3000",
			"http://127.0.0.1:3000"
		));
		addOrigins(allowedOrigins, frontendUrlPatterns);
		addOrigins(allowedOrigins, frontendUrl);

		// Printed at startup so a "Backend unavailable" error in the browser (usually a CORS block)
		// can be diagnosed from the Render logs: the website's URL must match one of these.
		LOGGER.info("CORS allowed origins (FRONTEND_URL / FRONTEND_URL_PATTERNS): {}", allowedOrigins);

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

	private static void addOrigins(List<String> allowedOrigins, String commaSeparated) {
		if (commaSeparated == null || commaSeparated.isBlank()) {
			return;
		}
		for (String origin : commaSeparated.split(",")) {
			String normalizedOrigin = origin.trim();
			while (normalizedOrigin.endsWith("/")) {
				normalizedOrigin = normalizedOrigin.substring(0, normalizedOrigin.length() - 1);
			}
			// Browsers send the origin without a path, e.g. https://site.vercel.app (no "/login").
			int pathStart = normalizedOrigin.indexOf('/', normalizedOrigin.indexOf("://") + 3);
			if (normalizedOrigin.contains("://") && pathStart > 0) {
				normalizedOrigin = normalizedOrigin.substring(0, pathStart);
			}
			if (!normalizedOrigin.isEmpty() && !allowedOrigins.contains(normalizedOrigin)) {
				allowedOrigins.add(normalizedOrigin);
			}
		}
	}
}
