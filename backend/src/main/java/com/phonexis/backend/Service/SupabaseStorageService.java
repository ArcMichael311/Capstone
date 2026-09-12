package com.phonexis.backend.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SupabaseStorageService {
	private static final Pattern SIGNED_URL_PATTERN = Pattern.compile("\"signedURL\"\\s*:\\s*\"([^\"]*)\"");

	private final HttpClient httpClient = HttpClient.newBuilder()
		.connectTimeout(Duration.ofSeconds(15))
		.build();

	@Value("${supabase.url:}")
	private String supabaseUrl;

	@Value("${supabase.service-role-key:}")
	private String serviceRoleKey;

	@Value("${supabase.storage.bucket:learning-materials}")
	private String bucket;

	public boolean isConfigured() {
		return notBlank(supabaseUrl) && notBlank(serviceRoleKey);
	}

	private void requireConfigured() {
		if (!isConfigured()) {
			throw new ResponseStatusException(
				HttpStatus.SERVICE_UNAVAILABLE,
				"Supabase Storage is not configured on the backend. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
			);
		}
	}

	public void upload(String objectPath, byte[] bytes, String contentType) {
		requireConfigured();
		try {
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(storageBase() + "/object/" + bucket + "/" + objectPath))
				.timeout(Duration.ofSeconds(60))
				.header("Authorization", "Bearer " + serviceRoleKey)
				.header("apikey", serviceRoleKey)
				.header("Content-Type", notBlank(contentType) ? contentType : "application/octet-stream")
				.header("x-upsert", "true")
				.POST(HttpRequest.BodyPublishers.ofByteArray(bytes))
				.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() >= 300) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Supabase Storage upload failed: " + response.body());
			}
		} catch (IOException | InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach Supabase Storage: " + e.getMessage());
		}
	}

	public void delete(String objectPath) {
		requireConfigured();
		try {
			String body = "{\"prefixes\":[\"" + jsonEscape(objectPath) + "\"]}";
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(storageBase() + "/object/" + bucket))
				.timeout(Duration.ofSeconds(30))
				.header("Authorization", "Bearer " + serviceRoleKey)
				.header("apikey", serviceRoleKey)
				.header("Content-Type", "application/json")
				.method("DELETE", HttpRequest.BodyPublishers.ofString(body))
				.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() >= 300) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Supabase Storage delete failed: " + response.body());
			}
		} catch (IOException | InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach Supabase Storage: " + e.getMessage());
		}
	}

	public String createSignedUrl(String objectPath, int expiresInSeconds) {
		requireConfigured();
		try {
			String body = "{\"expiresIn\":" + expiresInSeconds + "}";
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(storageBase() + "/object/sign/" + bucket + "/" + objectPath))
				.timeout(Duration.ofSeconds(30))
				.header("Authorization", "Bearer " + serviceRoleKey)
				.header("apikey", serviceRoleKey)
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(body))
				.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() >= 300) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Supabase Storage signing failed: " + response.body());
			}

			Matcher matcher = SIGNED_URL_PATTERN.matcher(response.body());
			if (!matcher.find()) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Supabase Storage did not return a signed URL");
			}

			return storageBase() + matcher.group(1);
		} catch (IOException | InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach Supabase Storage: " + e.getMessage());
		}
	}

	private String storageBase() {
		return trimTrailingSlash(supabaseUrl) + "/storage/v1";
	}

	private String trimTrailingSlash(String value) {
		return value != null && value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
	}

	private boolean notBlank(String value) {
		return value != null && !value.isBlank();
	}

	private String jsonEscape(String value) {
		return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
	}
}
