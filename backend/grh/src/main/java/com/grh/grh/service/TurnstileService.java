package com.grh.grh.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class TurnstileService {

    private final RestTemplate restTemplate;

    @Value("${turnstile.enabled:false}")
    private boolean turnstileEnabled;

    @Value("${turnstile.verify-url:https://challenges.cloudflare.com/turnstile/v0/siteverify}")
    private String verifyUrl;

    @Value("${turnstile.secret-key:}")
    private String secretKey;

    public void verifyToken(String token, String remoteIp) {
        if (!turnstileEnabled) {
            return;
        }

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Captcha verification failed");
        }

        if (secretKey == null || secretKey.isBlank()) {
            log.error("Turnstile is enabled but turnstile.secret-key is missing");
            throw new IllegalStateException("Captcha verification is unavailable");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("secret", secretKey);
        body.add("response", token);
        if (remoteIp != null && !remoteIp.isBlank()) {
            body.add("remoteip", remoteIp);
        }

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        TurnstileVerifyResponse response = restTemplate.postForObject(
            verifyUrl,
            entity,
            TurnstileVerifyResponse.class
        );

        if (response == null || !Boolean.TRUE.equals(response.success())) {
            throw new IllegalArgumentException("Captcha verification failed");
        }
    }

    public record TurnstileVerifyResponse(Boolean success) {}
}
