package com.phonexis.backend.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Basic brute-force protection: after MAX_FAILURES failed logins for the same key
 * (email or client IP) the key is locked for LOCK_DURATION. In-memory, per instance.
 */
@Service
public class LoginAttemptService {
	private static final int MAX_FAILURES = 5;
	private static final Duration WINDOW = Duration.ofMinutes(15);
	private static final Duration LOCK_DURATION = Duration.ofMinutes(15);
	private static final int MAX_TRACKED_KEYS = 50_000;

	private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

	public void checkAllowed(String... keys) {
		Instant now = Instant.now();
		for (String key : keys) {
			Attempt attempt = key == null ? null : attempts.get(key);
			if (attempt != null && attempt.lockedUntil != null && attempt.lockedUntil.isAfter(now)) {
				throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
					"Too many failed login attempts. Please try again in a few minutes.");
			}
		}
	}

	public void recordFailure(String... keys) {
		Instant now = Instant.now();
		if (attempts.size() > MAX_TRACKED_KEYS) {
			attempts.entrySet().removeIf(entry -> entry.getValue().windowStart.plus(WINDOW).isBefore(now)
				&& (entry.getValue().lockedUntil == null || entry.getValue().lockedUntil.isBefore(now)));
		}
		for (String key : keys) {
			if (key == null) {
				continue;
			}
			attempts.compute(key, (k, existing) -> {
				Attempt attempt = existing == null || existing.windowStart.plus(WINDOW).isBefore(now)
					? new Attempt(now)
					: existing;
				attempt.failures++;
				if (attempt.failures >= MAX_FAILURES) {
					attempt.lockedUntil = now.plus(LOCK_DURATION);
				}
				return attempt;
			});
		}
	}

	public void recordSuccess(String key) {
		if (key != null) {
			attempts.remove(key);
		}
	}

	private static final class Attempt {
		private final Instant windowStart;
		private int failures;
		private Instant lockedUntil;

		private Attempt(Instant windowStart) {
			this.windowStart = windowStart;
		}
	}
}
