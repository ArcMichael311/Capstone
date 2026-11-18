package com.phonexis.backend.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
	private final SessionAuthenticationFilter sessionAuthenticationFilter;
	private final CsrfCookieFilter csrfCookieFilter;

	public SecurityConfig(SessionAuthenticationFilter sessionAuthenticationFilter, CsrfCookieFilter csrfCookieFilter) {
		this.sessionAuthenticationFilter = sessionAuthenticationFilter;
		this.csrfCookieFilter = csrfCookieFilter;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.exceptionHandling(exception -> exception.authenticationEntryPoint(
				new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers("/health", "/", "/api/auth/login", "/api/auth/register",
					"/api/auth/restore-session", "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
				.requestMatchers("/api/**").authenticated()
				.requestMatchers("/actuator/health").permitAll()
				.anyRequest().denyAll())
			.addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
			.addFilterAfter(csrfCookieFilter, SessionAuthenticationFilter.class);

		return http.build();
	}
}
