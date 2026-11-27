package com.phonexis.backend.Config;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Keeps the backend awake on Render's free plan, which stops a service after ~15 minutes
 * without incoming traffic (the next visitor then waits up to a minute for it to start).
 * Pings the service's own public /health URL every 10 minutes. Does nothing unless
 * app.keep-awake.url (RENDER_EXTERNAL_URL, set by Render automatically) is present.
 */
@Configuration
@EnableScheduling
public class KeepAwakeScheduler {
	private static final Logger LOGGER = LoggerFactory.getLogger(KeepAwakeScheduler.class);

	private final HttpClient httpClient = HttpClient.newBuilder()
		.connectTimeout(Duration.ofSeconds(10))
		.build();

	@Value("${app.keep-awake.enabled:true}")
	private boolean enabled;

	@Value("${app.keep-awake.url:}")
	private String publicUrl;

	@Scheduled(initialDelayString = "PT5M", fixedDelayString = "PT10M")
	public void ping() {
		if (!enabled || publicUrl == null || publicUrl.isBlank()) {
			return;
		}
		try {
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(publicUrl.replaceAll("/+$", "") + "/health"))
				.timeout(Duration.ofSeconds(20))
				.GET()
				.build();
			httpClient.send(request, HttpResponse.BodyHandlers.discarding());
		} catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
		} catch (Exception exception) {
			LOGGER.debug("Keep-awake ping failed: {}", exception.getMessage());
		}
	}
}
