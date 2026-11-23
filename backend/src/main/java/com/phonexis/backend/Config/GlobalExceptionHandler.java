package com.phonexis.backend.Config;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Returns consistent JSON errors and never leaks stack traces or internal details to clients.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
	private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler({ CannotCreateTransactionException.class, DataAccessException.class })
	public ResponseEntity<Map<String, Object>> handleDatabaseUnavailable(Exception exception) {
		LOGGER.error("Database error", exception);
		return body(HttpStatus.SERVICE_UNAVAILABLE, "Database is temporarily unavailable. Please try again later.");
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException exception) {
		HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
		return body(status, exception.getReason() != null ? exception.getReason() : status.getReasonPhrase());
	}

	// Let Spring Security turn these into proper 401/403 responses.
	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException exception) {
		return body(HttpStatus.FORBIDDEN, "You are not allowed to perform this action");
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<Map<String, Object>> handleAuthentication(AuthenticationException exception) {
		return body(HttpStatus.UNAUTHORIZED, "Authentication required");
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<Map<String, Object>> handleUploadTooLarge(MaxUploadSizeExceededException exception) {
		return body(HttpStatus.CONTENT_TOO_LARGE, "Uploaded file is too large");
	}

	@ExceptionHandler({ HttpMessageNotReadableException.class, MissingServletRequestParameterException.class,
		MethodArgumentTypeMismatchException.class, IllegalArgumentException.class })
	public ResponseEntity<Map<String, Object>> handleBadRequest(Exception exception) {
		return body(HttpStatus.BAD_REQUEST, "Invalid request");
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<Map<String, Object>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException exception) {
		return body(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed");
	}

	@ExceptionHandler(NoResourceFoundException.class)
	public ResponseEntity<Map<String, Object>> handleNotFound(NoResourceFoundException exception) {
		return body(HttpStatus.NOT_FOUND, "Not found");
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleUnexpected(Exception exception) {
		LOGGER.error("Unexpected error", exception);
		return body(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please try again.");
	}

	private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
		return ResponseEntity.status(status).body(Map.of(
			"status", status.value(),
			"error", status.getReasonPhrase(),
			"message", message
		));
	}
}
