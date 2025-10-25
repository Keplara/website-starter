package com.mysite.auth_service.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationContext;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationProvider;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationValidator;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.security.interfaces.RSAPublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.KeyPairGenerator;

import com.mysite.auth_service.configuration.user.CustomUserDetailsService;
import com.mysite.auth_service.configuration.validation.CustomRedirectUriValidator;
import com.mysite.auth_service.configuration.validation.CustomScopeValidator;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;

import org.springframework.security.oauth2.jwt.JwtDecoder;
import com.nimbusds.jose.proc.SecurityContext;

import jakarta.servlet.http.HttpServletResponse;

import java.security.KeyPair;

@Order(Ordered.HIGHEST_PRECEDENCE)
@Configuration
public class OAuth2SecurityConfig {
	
	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of("http://localhost:8082"));
		configuration.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	@Bean
	SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http, CustomUserDetailsService cs) throws Exception {
		OAuth2AuthorizationServerConfigurer authorizationServerConfigurer = OAuth2AuthorizationServerConfigurer.authorizationServer();
		http
			.cors(Customizer.withDefaults())
			.csrf(crsf->crsf.disable())
			.authorizeHttpRequests((req) ->
				req
				.requestMatchers("/test-unauthenticated").permitAll()
				.anyRequest().authenticated()
				)
			.securityMatcher(authorizationServerConfigurer.getEndpointsMatcher())
			.with(authorizationServerConfigurer, (authorizationServer) -> authorizationServer
				.authorizationEndpoint(authorizationEndpoint->{
					authorizationEndpoint
                        .authenticationProviders(configureAuthenticationValidator(cs));
					})
					.oidc((oidc) -> oidc
					.clientRegistrationEndpoint((clientRegistrationEndpoint) -> oidc
							.clientRegistrationEndpoint(Customizer.withDefaults()))))
			.oauth2ResourceServer(oauth2ResourceServer -> oauth2ResourceServer.jwt(Customizer.withDefaults()))
			.exceptionHandling((exceptions) -> {
				exceptions.accessDeniedHandler((request, response, accessDeniedException) -> {
					System.out.println("Access Denied.");
					response.setStatus(HttpServletResponse.SC_OK);
					response.getWriter().write("Access Denied.");
					response.getWriter().flush();
				});
				exceptions.defaultAuthenticationEntryPointFor(
						new LoginUrlAuthenticationEntryPoint("http://localhost:8082/login"),
						new MediaTypeRequestMatcher(MediaType.TEXT_HTML));
			});
		return http.build();
	}

	private Consumer<List<AuthenticationProvider>> configureAuthenticationValidator(CustomUserDetailsService cs) {
	return (authenticationProviders) ->
		authenticationProviders.forEach((authenticationProvider) -> {
			if (authenticationProvider instanceof OAuth2AuthorizationCodeRequestAuthenticationProvider) {
				Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext> authenticationValidator =
					// Override default redirect_uri validator
					new CustomRedirectUriValidator()
						// Reuse default scope validator
						.andThen(OAuth2AuthorizationCodeRequestAuthenticationValidator.DEFAULT_SCOPE_VALIDATOR)
						.andThen(new CustomScopeValidator(cs));

				((OAuth2AuthorizationCodeRequestAuthenticationProvider) authenticationProvider)
					.setAuthenticationValidator(authenticationValidator);
			}
		});
	}

  @Bean
	OAuth2TokenCustomizer<JwtEncodingContext> jwtTokenCustomizer() {	
    return context -> {
        if (OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
            context.getClaims().claims(claims -> {
                
                // Extract roles (ROLE_ prefixed authorities)
                Set<String> roles = AuthorityUtils.authorityListToSet(context.getPrincipal().getAuthorities())
                        .stream()
                        .filter(auth -> auth.startsWith("ROLE_"))
                        .map(auth -> auth.replaceFirst("^ROLE_", ""))
                        .collect(Collectors.collectingAndThen(Collectors.toSet(), Collections::unmodifiableSet));
                
                // Extract all user scopes (SCOPE_ prefixed authorities)
                Set<String> userScopes = AuthorityUtils.authorityListToSet(context.getPrincipal().getAuthorities())
                        .stream()
                        .filter(auth -> auth.startsWith("SCOPE_"))
                        .map(auth -> auth.replaceFirst("^SCOPE_", ""))
                        .collect(Collectors.collectingAndThen(Collectors.toSet(), Collections::unmodifiableSet));
                
                // Put claims directly, no filtering against requested scopes
                claims.put("roles", roles); 
                claims.put("authorities", userScopes);
            });
        }
    };
	}

	
	private static KeyPair generateRsaKey() {
		KeyPair keyPair;
		try {
			KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
			keyPairGenerator.initialize(2048);
			keyPair = keyPairGenerator.generateKeyPair();
		} catch (Exception ex) {
			throw new IllegalStateException(ex);
		}
		return keyPair;
	}

	@Bean
	JWKSource<SecurityContext> jwkSource() {
		KeyPair keyPair = generateRsaKey();
		RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
		RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
		RSAKey rsaKey = new RSAKey.Builder(publicKey)
				.privateKey(privateKey)
				.keyID(UUID.randomUUID().toString())
				.build();
		JWKSet jwkSet = new JWKSet(rsaKey);
		return new ImmutableJWKSet<>(jwkSet);
	}

	@Bean
	JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
		return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
	}

	@Bean
	AuthorizationServerSettings authorizationServerSettings() {
		return AuthorizationServerSettings.builder().build();
	}

}
