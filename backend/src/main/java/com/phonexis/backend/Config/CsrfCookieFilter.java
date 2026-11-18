package com.phonexis.backend.Config;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CsrfCookieFilter extends OncePerRequestFilter {
	public static final String CSRF_COOKIE = "PHONEXIS_CSRF";
	public static final String CSRF_HEADER = "X-CSRF-Token";
	private static final SecureRandom RANDOM = new SecureRandom();
	private static final Set<String> PUBLIC_MUTATIONS = Set.of(
		"/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password"
	);

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {
		String method = request.getMethod();
		boolean stateChanging = HttpMethod.POST.matches(method)
			|| HttpMethod.PUT.matches(method)
			|| HttpMethod.DELETE.matches(method)
			|| HttpMethod.PATCH.matches(method);

		if (stateChanging && request.getRequestURI().startsWith("/api/")
			&& !PUBLIC_MUTATIONS.contains(request.getRequestURI())) {
			String cookieToken = readCookie(request, CSRF_COOKIE);
			String headerToken = request.getHeader(CSRF_HEADER);
			if (cookieToken == null || headerToken == null
				|| !cookieToken.equals(headerToken)) {
				response.setStatus(HttpStatus.FORBIDDEN.value());
				return;
			}
		}

		filterChain.doFilter(request, response);
	}

	public static ResponseCookie createCsrfCookie(String token, int maxAgeSeconds, HttpServletRequest request) {
		boolean secure = "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))
			|| request.isSecure();
		return ResponseCookie.from(CSRF_COOKIE, token)
			.httpOnly(false)
			.secure(secure)
			.sameSite(secure ? "None" : "Lax")
			.path("/")
			.maxAge(maxAgeSeconds)
			.build();
	}

	public static String createToken() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private String readCookie(HttpServletRequest request, String name) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) return null;
		for (Cookie cookie : cookies) {
			if (name.equals(cookie.getName())) return cookie.getValue();
		}
		return null;
	}
}
