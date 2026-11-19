package com.phonexis.backend.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
<<<<<<< HEAD
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.http.HttpStatus;
=======
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
>>>>>>> dcc1ad01afacd6547e0e7ae27ff0138a20bb8ac7
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
	private final SessionAuthenticationFilter sessionAuthenticationFilter;

	public SecurityConfig(SessionAuthenticationFilter sessionAuthenticationFilter) {
		this.sessionAuthenticationFilter = sessionAuthenticationFilter;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
<<<<<<< HEAD
			.exceptionHandling(exception -> exception.authenticationEntryPoint(
				new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers("/health", "/", "/api/auth/login", "/api/auth/register",
=======
			.exceptionHandling(exception -> exception
				.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers("/health", "/api/auth/login", "/api/auth/register",
>>>>>>> dcc1ad01afacd6547e0e7ae27ff0138a20bb8ac7
					"/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
				.requestMatchers("/api/**").authenticated()
				.requestMatchers("/actuator/health").permitAll()
				.anyRequest().denyAll())
			.addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
