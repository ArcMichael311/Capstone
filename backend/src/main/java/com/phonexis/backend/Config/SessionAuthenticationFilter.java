package com.phonexis.backend.Config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Repository.UserRepository;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
	public static final String SESSION_COOKIE = "PHONEXIS_SESSION";
	private final UserRepository userRepository;

	public SessionAuthenticationFilter(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {
		String token = readSessionCookie(request);
		if (token != null) {
			userRepository.findBySessionToken(token).ifPresent(user -> authenticate(user));
		}
		filterChain.doFilter(request, response);
	}
	private void authenticate(User user) {
		if (user.getSessionExpiresAt() != null
			&& user.getSessionExpiresAt().isBefore(LocalDateTime.now())) {
			return;
		}
		SecurityContextHolder.getContext().setAuthentication(
			new UsernamePasswordAuthenticationToken(
				user.getEmail(),
				null,
				List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
			));
	}

	private String readSessionCookie(HttpServletRequest request) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) return null;
		for (Cookie cookie : cookies) {
			if (SESSION_COOKIE.equals(cookie.getName())) return cookie.getValue();
		}
		return null;
	}
}
