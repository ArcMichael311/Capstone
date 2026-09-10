package com.phonexis.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.UserRepository;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Optional;

@SpringBootApplication
public class BackendApplication {
	private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner createAdminIfMissing(UserRepository userRepository) {
		return args -> {
			try {
				final String adminEmail = getEnvOrDefault("ADMIN_EMAIL", "phonexisadmin@gmail.com");
				final String adminPassword = getEnvOrDefault("ADMIN_PASSWORD", "phonexisadmin5");
				final String adminFirstName = getEnvOrDefault("ADMIN_FIRST_NAME", "Phonexis");
				final String adminLastName = getEnvOrDefault("ADMIN_LAST_NAME", "Admin");
				final String supabaseUrl = getEnvOrDefault("SUPABASE_URL", getEnvOrDefault("REACT_APP_SUPABASE_URL", ""));
				final String supabaseServiceKey = getEnvOrDefault("SUPABASE_SERVICE_ROLE_KEY", "");

				if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
					System.out.println("ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin creation.");
					return;
				}

				Optional<User> existingAdmin = userRepository.findByEmailIgnoreCase(adminEmail);
				User admin = existingAdmin.orElseGet(User::new);
				admin.setFirstName(adminFirstName);
				admin.setLastName(adminLastName);
				admin.setEmail(adminEmail);
				admin.setPasswordHash(PASSWORD_ENCODER.encode(adminPassword));
				admin.setRole(User.Role.ADMIN);
				userRepository.save(admin);
				System.out.println((existingAdmin.isPresent() ? "Updated" : "Created") + " admin in backend DB: " + adminEmail);

				if (supabaseUrl.isBlank() || supabaseServiceKey.isBlank()) {
					System.out.println("SUPABASE_URL/REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; skipping Supabase auth sync.");
					return;
				}

				ensureSupabaseAdminUser(supabaseUrl, supabaseServiceKey, adminEmail, adminPassword);
			} catch (Exception e) {
				System.err.println("Failed to ensure admin account: " + e.getMessage());
			}
		};
	}

	private static String getEnvOrDefault(String key, String fallback) {
		String value = System.getenv(key);
		if (value == null || value.isBlank()) {
			return fallback;
		}
		return value;
	}

	private static String jsonEscape(String value) {
		return value
			.replace("\\", "\\\\")
			.replace("\"", "\\\"")
			.replace("\n", "\\n")
			.replace("\r", "\\r")
			.replace("\t", "\\t");
	}

	private static void ensureSupabaseAdminUser(String supabaseUrl, String supabaseServiceKey, String adminEmail, String adminPassword) {
		try {
			HttpClient http = HttpClient.newHttpClient();
			String baseUrl = supabaseUrl.replaceAll("/+$", "");

			String createBody = "{"
				+ "\"email\":\"" + jsonEscape(adminEmail) + "\"," 
				+ "\"password\":\"" + jsonEscape(adminPassword) + "\"," 
				+ "\"email_confirm\":true,"
				+ "\"user_metadata\":{\"role\":\"admin\"}"
				+ "}";

			HttpRequest createRequest = HttpRequest.newBuilder()
				.uri(URI.create(baseUrl + "/auth/v1/admin/users"))
				.header("Content-Type", "application/json")
				.header("apikey", supabaseServiceKey)
				.header("Authorization", "Bearer " + supabaseServiceKey)
				.POST(HttpRequest.BodyPublishers.ofString(createBody))
				.build();

			HttpResponse<String> createResponse = http.send(createRequest, HttpResponse.BodyHandlers.ofString());
			if (createResponse.statusCode() >= 200 && createResponse.statusCode() < 300) {
				System.out.println("Created Supabase auth admin user: " + adminEmail);
				return;
			}

			String listUrl = baseUrl + "/auth/v1/admin/users?page=1&per_page=1000";
			HttpRequest listRequest = HttpRequest.newBuilder()
				.uri(URI.create(listUrl))
				.header("apikey", supabaseServiceKey)
				.header("Authorization", "Bearer " + supabaseServiceKey)
				.GET()
				.build();

			HttpResponse<String> listResponse = http.send(listRequest, HttpResponse.BodyHandlers.ofString());
			if (listResponse.statusCode() < 200 || listResponse.statusCode() >= 300) {
				System.err.println("Failed to list Supabase users: " + listResponse.statusCode() + " " + listResponse.body());
				return;
			}

			String marker = "\"email\":\"" + jsonEscape(adminEmail) + "\"";
			int emailIndex = listResponse.body().indexOf(marker);
			if (emailIndex < 0) {
				System.err.println("Supabase user not found after create attempt: " + adminEmail);
				return;
			}

			int idLabelIndex = listResponse.body().lastIndexOf("\"id\":\"", emailIndex);
			if (idLabelIndex < 0) {
				System.err.println("Unable to resolve Supabase user id for: " + adminEmail);
				return;
			}

			int idStart = idLabelIndex + 6;
			int idEnd = listResponse.body().indexOf('"', idStart);
			if (idEnd <= idStart) {
				System.err.println("Invalid Supabase user id payload for: " + adminEmail);
				return;
			}

			String userId = listResponse.body().substring(idStart, idEnd);
			String updateBody = "{"
				+ "\"password\":\"" + jsonEscape(adminPassword) + "\"," 
				+ "\"user_metadata\":{\"role\":\"admin\"}"
				+ "}";

			HttpRequest updateRequest = HttpRequest.newBuilder()
				.uri(URI.create(baseUrl + "/auth/v1/admin/users/" + userId))
				.header("Content-Type", "application/json")
				.header("apikey", supabaseServiceKey)
				.header("Authorization", "Bearer " + supabaseServiceKey)
				.method("PUT", HttpRequest.BodyPublishers.ofString(updateBody))
				.build();

			HttpResponse<String> updateResponse = http.send(updateRequest, HttpResponse.BodyHandlers.ofString());
			if (updateResponse.statusCode() >= 200 && updateResponse.statusCode() < 300) {
				System.out.println("Updated Supabase auth admin user role/password: " + adminEmail);
			} else {
				System.err.println("Failed to update Supabase auth admin user: " + updateResponse.statusCode() + " " + updateResponse.body());
			}
		} catch (Exception e) {
			System.err.println("Error syncing Supabase admin user: " + e.getMessage());
		}
	}

}
