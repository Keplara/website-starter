package com.mysite.auth_service.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;

import java.time.Duration;
import java.util.UUID;

@EnableWebSecurity
@Configuration
public class ClientConfig {
	// aws secret manager
	@Value("${local.userAuthClientSecret}")
	private String userAuthClientSecret;

	@Value("${local.adminAuthClientSecret}")
	private String adminAuthClientSecret;

	@Value("${local.iamAuthClientSecret}")
	private String iamAuthClientSecret;

	private PasswordEncoder passwordEncoder;

	public ClientConfig(PasswordEncoder passwordEncoder) {
		this.passwordEncoder = passwordEncoder;
	}

	@Value("${local.userClientBaseUrl}")
	private String userClientBaseURL;

	@Value("${local.adminClientBaseUrl}")
	private String adminClientBaseURL;

	@Bean
	public RedisRegisteredClientRepository registeredClientRepository(
			RedisTemplate<String, RegisteredClient> redisTemplate) {
		String strippedUserClientBaseURL = userClientBaseURL.replaceAll("/+$", "");
		String strippedAdminClientBaseURL = adminClientBaseURL.replaceAll("/+$", "");

		RegisteredClient userAuthClient = RegisteredClient.withId(UUID.randomUUID().toString())
				.clientId("userAuthClient")
				.clientSecret(passwordEncoder.encode(userAuthClientSecret))
				.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
				.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
				.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
				.redirectUris(uris -> {
					uris.add(strippedUserClientBaseURL + "/oauth/callback");
				})
				.postLogoutRedirectUri(strippedUserClientBaseURL)
				.scope("product:read")
				.scope("user:read")
				.scope(OidcScopes.PROFILE)
				.tokenSettings(TokenSettings.builder()
						.authorizationCodeTimeToLive(Duration.ofMinutes(2))
						.accessTokenTimeToLive(Duration.ofMinutes(30))
						.refreshTokenTimeToLive(Duration.ofDays(30))
						.reuseRefreshTokens(false)
						.build())
				.clientSettings(ClientSettings.builder()
						.requireAuthorizationConsent(false)
						.requireProofKey(true)
						.build())
				.build();

		// Used for root users
		RegisteredClient adminAuthClient = RegisteredClient.withId(UUID.randomUUID().toString())
				.clientId("adminAuthClient")
				.clientSecret(passwordEncoder.encode(adminAuthClientSecret))
				.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
				.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
				.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
				.redirectUris(uris -> {
					uris.add(strippedAdminClientBaseURL + "/oauth/callback");
				})
				.postLogoutRedirectUri(strippedAdminClientBaseURL)
				.scope("user:read")
				.scope("product:read")
				.scope("profile:update")
				.scope("metric:read")
				.scope(OidcScopes.PROFILE)
				.tokenSettings(TokenSettings.builder()
						.authorizationCodeTimeToLive(Duration.ofMinutes(2))
						.accessTokenTimeToLive(Duration.ofMinutes(30))
						.refreshTokenTimeToLive(Duration.ofHours(3))
						.reuseRefreshTokens(false)
						.build())
				.clientSettings(ClientSettings.builder()
						.requireAuthorizationConsent(false)
						.requireProofKey(true)
						.build())
				.build();

		RegisteredClient iamAuthClient = RegisteredClient.withId(UUID.randomUUID().toString())
				.clientId("iamAuthClient")
				.clientSecret(passwordEncoder.encode(iamAuthClientSecret))
				.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
				.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
				.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
				.redirectUris(uris -> {
					uris.add(strippedAdminClientBaseURL + "/oauth/callback");
				})
				.postLogoutRedirectUri(strippedAdminClientBaseURL)
				.scope(OidcScopes.PROFILE)
				.tokenSettings(TokenSettings.builder()
						.authorizationCodeTimeToLive(Duration.ofMinutes(2))
						.accessTokenTimeToLive(Duration.ofMinutes(30))
						.refreshTokenTimeToLive(Duration.ofHours(1))
						.reuseRefreshTokens(false)
						.build())
				.clientSettings(ClientSettings.builder()
						.requireAuthorizationConsent(false)
						.requireProofKey(true)
						.build())
				.build();

		// admin auth client
		return new RedisRegisteredClientRepository(redisTemplate, userAuthClient, adminAuthClient, iamAuthClient);
	}

}
