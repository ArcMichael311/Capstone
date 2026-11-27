package com.phonexis.backend.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Verifies a Supabase Auth access token by asking Supabase who it belongs to.
 * Once Supabase has checked the user's password, the backend trusts that result instead of
 * comparing its own copy of the password (which drifts after a Supabase password reset).
 */
@Service
public class SupabaseAuthService {
	private static final Logger LOGGER = LoggerFactory.getLogger(SupabaseAuthService.class);
	private static final int MAX_TOKEN_LENGTH = 4096;

	private final HttpClient httpClient = HttpClient.newBuilder()
		.connectTimeout(Duration.ofSeconds(10))
		.build();
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Value("${supabase.url:}")
	private String supabaseUrl;

	// Any project API key works for /auth/v1/user; the service-role key is already configured for storage.
	@Value("${supabase.auth-api-key:${supabase.service-role-key:}}")
	private String supabaseApiKey;

	public boolean isConfigured() {
		return supabaseUrl != null && !supabaseUrl.isBlank() && supabaseApiKey != null && !supabaseApiKey.isBlank();
	}

	public SupabaseUser verifyAccessToken(String accessToken) {
		if (!isConfigured()) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Supabase login is not configured on the server");
		}
		if (accessToken == null || accessToken.isBlank() || accessToken.length() > MAX_TOKEN_LENGTH) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Supabase session");
		}

		HttpResponse<String> response;
		try {
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(supabaseUrl.replaceAll("/+$", "") + "/auth/v1/user"))
				.timeout(Duration.ofSeconds(15))
				.header("apikey", supabaseApiKey)
				.header("Authorization", "Bearer " + accessToken.trim())
				.GET()
				.build();
			response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
		} catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify the login with Supabase");
		} catch (Exception exception) {
			LOGGER.warn("Supabase token verification failed: {}", exception.getMessage());
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify the login with Supabase");
		}

		if (response.statusCode() == 401 || response.statusCode() == 403) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired Supabase session");
		}
		if (response.statusCode() < 200 || response.statusCode() >= 300) {
			LOGGER.warn("Supabase /auth/v1/user returned {}", response.statusCode());
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify the login with Supabase");
		}

		try {
			JsonNode user = objectMapper.readTree(response.body());
			String email = text(user.path("email"));
			if (email.isBlank()) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Supabase account has no email");
			}
			JsonNode metadata = user.path("user_metadata");
			String firstName = firstNonBlank(text(metadata.path("firstname")), text(metadata.path("firstName")));
			String lastName = firstNonBlank(text(metadata.path("lastname")), text(metadata.path("lastName")));
			return new SupabaseUser(email.trim().toLowerCase(), firstName, lastName);
		} catch (ResponseStatusException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify the login with Supabase");
		}
	}

	private static String text(JsonNode node) {
		return node == null || node.isMissingNode() || node.isNull() ? "" : node.asString("").trim();
	}

	private static String firstNonBlank(String first, String second) {
		return first != null && !first.isBlank() ? first : (second == null ? "" : second);
	}

	public record SupabaseUser(String email, String firstName, String lastName) {
	}
}
