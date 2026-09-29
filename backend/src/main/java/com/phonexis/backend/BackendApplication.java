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
		return args -> ensureSeedAccount(userRepository, "ADMIN", User.Role.ADMIN, "Admin", "User");
	}

	@Bean
	public CommandLineRunner createTeacherIfMissing(UserRepository userRepository) {
		return args -> ensureSeedAccount(userRepository, "TEACHER", User.Role.TEACHER, "Teacher", "User");
	}

	// Creates (or promotes) the account described by <PREFIX>_EMAIL / <PREFIX>_PASSWORD
	// in the backend DB with the given role, then mirrors it into Supabase Auth when
	// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
	private static void ensureSeedAccount(UserRepository userRepository, String prefix, User.Role role, String defaultFirstName, String defaultLastName) {
		try {
			final String email = System.getenv(prefix + "_EMAIL");
			final String password = System.getenv(prefix + "_PASSWORD");
			final String firstName = getEnvOrDefault(prefix + "_FIRST_NAME", defaultFirstName);
			final String lastName = getEnvOrDefault(prefix + "_LAST_NAME", defaultLastName);
			final String supabaseUrl = getEnvOrDefault("SUPABASE_URL", getEnvOrDefault("REACT_APP_SUPABASE_URL", ""));
			final String supabaseServiceKey = getEnvOrDefault("SUPABASE_SERVICE_ROLE_KEY", "");
			final String roleLabel = role.name().toLowerCase();

			if (email == null || email.isBlank() || password == null || password.isBlank()) {
				System.out.println(prefix + "_EMAIL or " + prefix + "_PASSWORD not set; skipping " + roleLabel + " creation.");
				return;
			}

			Optional<User> existingUser = userRepository.findByEmailIgnoreCase(email);
			User user = existingUser.orElseGet(User::new);
			user.setFirstName(firstName);
			user.setLastName(lastName);
			user.setEmail(email);
			user.setPasswordHash(PASSWORD_ENCODER.encode(password));
			user.setRole(role);
			userRepository.save(user);
			System.out.println((existingUser.isPresent() ? "Updated" : "Created") + " " + roleLabel + " in backend DB: " + email);

			if (supabaseUrl.isBlank() || supabaseServiceKey.isBlank()) {
				System.out.println("SUPABASE_URL/REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; skipping Supabase auth sync.");
				return;
			}

			ensureSupabaseAuthUser(supabaseUrl, supabaseServiceKey, email, password, roleLabel, firstName, lastName);
		} catch (Exception e) {
			System.err.println("Failed to ensure " + prefix.toLowerCase() + " account: " + e.getMessage());
		}
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

	private static void ensureSupabaseAuthUser(String supabaseUrl, String supabaseServiceKey, String email, String password, String role, String firstName, String lastName) {
		try {
			HttpClient http = HttpClient.newHttpClient();
			String baseUrl = supabaseUrl.replaceAll("/+$", "");
			String userMetadata = "{"
				+ "\"role\":\"" + jsonEscape(role) + "\","
				+ "\"firstname\":\"" + jsonEscape(firstName) + "\","
				+ "\"lastname\":\"" + jsonEscape(lastName) + "\""
				+ "}";

			String createBody = "{"
				+ "\"email\":\"" + jsonEscape(email) + "\","
				+ "\"password\":\"" + jsonEscape(password) + "\","
				+ "\"email_confirm\":true,"
				+ "\"user_metadata\":" + userMetadata
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
				System.out.println("Created Supabase auth " + role + " user: " + email);
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

			String marker = "\"email\":\"" + jsonEscape(email) + "\"";
			int emailIndex = listResponse.body().indexOf(marker);
			if (emailIndex < 0) {
				System.err.println("Supabase user not found after create attempt: " + email);
				return;
			}

			int idLabelIndex = listResponse.body().lastIndexOf("\"id\":\"", emailIndex);
			if (idLabelIndex < 0) {
				System.err.println("Unable to resolve Supabase user id for: " + email);
				return;
			}

			int idStart = idLabelIndex + 6;
			int idEnd = listResponse.body().indexOf('"', idStart);
			if (idEnd <= idStart) {
				System.err.println("Invalid Supabase user id payload for: " + email);
				return;
			}

			String userId = listResponse.body().substring(idStart, idEnd);
			String updateBody = "{"
				+ "\"password\":\"" + jsonEscape(password) + "\","
				+ "\"user_metadata\":" + userMetadata
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
				System.out.println("Updated Supabase auth " + role + " user role/password: " + email);
			} else {
				System.err.println("Failed to update Supabase auth " + role + " user: " + updateResponse.statusCode() + " " + updateResponse.body());
			}
		} catch (Exception e) {
			System.err.println("Error syncing Supabase " + role + " user: " + e.getMessage());
		}
	}

}
