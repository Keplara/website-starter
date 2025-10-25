package com.mysite.auth_service.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
	@Value("${client.registration.secret}")
	private String secret;

	@Bean
	public RedisRegisteredClientRepository registeredClientRepository(
			RedisTemplate<String, RegisteredClient> redisTemplate) {
		BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
		// Will not work register auth clients manually
		// RegisteredClient clientDeveloperRegistrar =
		// RegisteredClient.withId(UUID.randomUUID().toString())
		// .clientId("internal-registrar-client")
		// .clientSecret("{bcrypt}"+passwordEncoder.encode(secret))
		// .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
		// .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
		// .scope("client.create")
		// .scope("client.read")
		// .clientSettings(ClientSettings.builder()
		// .requireAuthorizationConsent(false)
		// .build())
		// .build();

		RegisteredClient authClientMain = RegisteredClient.withId(UUID.randomUUID().toString())
				.clientId("auth-client")
				.clientSecret("{bcrypt}" + passwordEncoder.encode(secret))
				.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
				.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
				.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
				.redirectUris(uris -> {
					uris.add("http://localhost:8082/callback");
				})
				.postLogoutRedirectUri("http://localhost:8082/logout")
				.scope("product:read")
				.scope("user:read")
				.scope("subscription:bronze")
				.scope("subscription:silver")
				.scope("subscription:gold")
				.scope(OidcScopes.PROFILE)
				.tokenSettings(TokenSettings.builder()
						.authorizationCodeTimeToLive(Duration.ofMinutes(2))
						.accessTokenTimeToLive(Duration.ofMinutes(20))
						.refreshTokenTimeToLive(Duration.ofDays(30))
						.reuseRefreshTokens(false)
						.build())
				.clientSettings(ClientSettings.builder()
						.requireAuthorizationConsent(false)
						.requireProofKey(true)
						.build())
				.build();

		// admin auth client
		return new RedisRegisteredClientRepository(redisTemplate, authClientMain);
	}

}
