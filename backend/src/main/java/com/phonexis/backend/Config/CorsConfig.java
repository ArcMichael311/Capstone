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
 * preflight (OPTIONS) requests are answered before authentication runs.
 *
 * Why every website is allowed by default: this API authenticates with a Bearer token sent
 * in the Authorization header, never with cookies, and credentials are disabled below. Another
 * website cannot read or send a user's token, so restricting origins adds no protection here -
 * it only broke the app whenever the frontend's address changed (every Vercel deploy gets a new
 * URL), which showed up as "Backend unavailable".
 *
 * To restrict it anyway, set CORS_ALLOW_ALL_ORIGINS=false and list the sites in FRONTEND_URL
 * (comma-separated, "*" wildcards allowed, e.g. https://phonexis-*-phonexis.vercel.app).
 */
@Configuration
public class CorsConfig {
	private static final Logger LOGGER = LoggerFactory.getLogger(CorsConfig.class);

	@Value("${app.cors.allow-all-origins:true}")
	private boolean allowAllOrigins;

	@Value("${app.frontend-url:}")
	private String frontendUrl;

	@Value("${app.frontend-url-patterns:https://phonexis.vercel.app,https://phonexis-*-phonexis.vercel.app}")
	private String frontendUrlPatterns;

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		List<String> allowedOrigins = new ArrayList<>();
		if (allowAllOrigins) {
			allowedOrigins.add("*");
		} else {
			allowedOrigins.add("http://localhost:3000");
			allowedOrigins.add("http://127.0.0.1:3000");
			addOrigins(allowedOrigins, frontendUrlPatterns);
			addOrigins(allowedOrigins, frontendUrl);
		}
		LOGGER.info("CORS allowed origins: {}", allowedOrigins);

		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(allowedOrigins);
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Device-Id"));
		// Never send cookies cross-site: auth is the Bearer header only (this is what makes "*" safe).
		configuration.setAllowCredentials(false);
		configuration.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", configuration);
		source.registerCorsConfiguration("/health", configuration);
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
			int schemeEnd = normalizedOrigin.indexOf("://");
			int pathStart = schemeEnd < 0 ? -1 : normalizedOrigin.indexOf('/', schemeEnd + 3);
			if (pathStart > 0) {
				normalizedOrigin = normalizedOrigin.substring(0, pathStart);
			}
			if (!normalizedOrigin.isEmpty() && !allowedOrigins.contains(normalizedOrigin)) {
				allowedOrigins.add(normalizedOrigin);
			}
		}
	}
}
