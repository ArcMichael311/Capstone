package com.phonexis.backend.Config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.UserRepository;

/**
 * Authenticates requests carrying "Authorization: Bearer <token>".
 * Only a SHA-256 hash of the token is stored in the database, so a leaked
 * database dump cannot be used to hijack sessions.
 */
@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
	private static final int MAX_TOKEN_LENGTH = 256;

	private final UserRepository userRepository;

	public SessionAuthenticationFilter(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {
		String token = readBearerToken(request);
		if (token != null) {
			userRepository.findBySessionToken(hashToken(token)).ifPresent(this::authenticate);
		}
		filterChain.doFilter(request, response);
	}

	private void authenticate(User user) {
		if (user.getSessionExpiresAt() == null || user.getSessionExpiresAt().isBefore(LocalDateTime.now())) {
			return;
		}
		AuthenticatedUser principal = new AuthenticatedUser(user.getUserId(), user.getEmail(), user.getRole());
		UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
			principal,
			null,
			List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
		);
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	private String readBearerToken(HttpServletRequest request) {
		String authorization = request.getHeader("Authorization");
		if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
			return null;
		}
		String token = authorization.substring(7).trim();
		if (token.isEmpty() || token.length() > MAX_TOKEN_LENGTH) {
			return null;
		}
		return token;
	}

	public static String hashToken(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return Base64.getUrlEncoder().withoutPadding()
				.encodeToString(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}
}
