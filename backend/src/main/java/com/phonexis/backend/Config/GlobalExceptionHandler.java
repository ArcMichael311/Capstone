package com.phonexis.backend.Config;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {
	private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler({ CannotCreateTransactionException.class, DataAccessException.class })
	public ResponseEntity<Map<String, Object>> handleDatabaseUnavailable(Exception exception) {
		LOGGER.error("Database is unreachable", exception);
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
			"status", HttpStatus.SERVICE_UNAVAILABLE.value(),
			"error", "Service Unavailable",
			"message", "Database connection failed. Check the datasource configuration (SUPABASE_DB_URL/USER/PASSWORD) and network connectivity."
		));
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException exception) {
		HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
		return ResponseEntity.status(status).body(Map.of(
			"status", status.value(),
			"error", status.getReasonPhrase(),
			"message", exception.getReason() != null ? exception.getReason() : status.getReasonPhrase()
		));
	}
}
