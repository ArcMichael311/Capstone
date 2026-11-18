package com.phonexis.backend.Config;

import java.io.IOException;
<<<<<<< HEAD
import java.time.LocalDateTime;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
=======
import java.util.List;
import java.time.LocalDateTime;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
>>>>>>> dcc1ad01afacd6547e0e7ae27ff0138a20bb8ac7
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
<<<<<<< HEAD
	public static final String SESSION_COOKIE = "PHONEXIS_SESSION";
=======
>>>>>>> dcc1ad01afacd6547e0e7ae27ff0138a20bb8ac7
	private final UserRepository userRepository;

	public SessionAuthenticationFilter(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {
<<<<<<< HEAD
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
		UsernamePasswordAuthenticationToken authentication =
			new UsernamePasswordAuthenticationToken(
				user.getEmail(),
				null,
				List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
			);
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	private String readSessionCookie(HttpServletRequest request) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return null;
		}
		for (Cookie cookie : cookies) {
			if (SESSION_COOKIE.equals(cookie.getName())) {
				return cookie.getValue();
			}
		}
		return null;
=======
		String authorization = request.getHeader("Authorization");
		if (authorization != null && authorization.startsWith("Bearer ")) {
			String token = authorization.substring(7).trim();
			if (!token.isEmpty()) {
				userRepository.findBySessionToken(token).ifPresent(user -> {
					if (user.getSessionExpiresAt() != null
						&& user.getSessionExpiresAt().isBefore(LocalDateTime.now())) {
						return;
					}
					UsernamePasswordAuthenticationToken authentication =
						new UsernamePasswordAuthenticationToken(
							user.getEmail(),
							null,
							List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
						);
					SecurityContextHolder.getContext().setAuthentication(authentication);
					request.setAttribute("authenticatedUserId", user.getUserId());
					request.setAttribute("authenticatedUserRole", user.getRole().name());
				});
			}
		}

		filterChain.doFilter(request, response);
>>>>>>> dcc1ad01afacd6547e0e7ae27ff0138a20bb8ac7
	}
}
