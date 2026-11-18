package com.phonexis.backend.Config;

import java.io.IOException;
import java.util.List;
import java.time.LocalDateTime;

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

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
	private final UserRepository userRepository;

	public SessionAuthenticationFilter(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {
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
	}
}
