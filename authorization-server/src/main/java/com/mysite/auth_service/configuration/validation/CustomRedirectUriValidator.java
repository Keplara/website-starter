package com.mysite.auth_service.configuration.validation;

import java.util.function.Consumer;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationContext;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationException;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationToken;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;

public class CustomRedirectUriValidator implements Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext> {

	@Override
	public void accept(OAuth2AuthorizationCodeRequestAuthenticationContext authenticationContext) {
		OAuth2AuthorizationCodeRequestAuthenticationToken authorizationCodeRequestAuthentication =
			authenticationContext.getAuthentication();
		RegisteredClient registeredClient = authenticationContext.getRegisteredClient();
		String requestedRedirectUri = authorizationCodeRequestAuthentication.getRedirectUri();

		// Use exact string matching when comparing client redirect URIs against pre-registered URIs
		if (!registeredClient.getRedirectUris().contains(requestedRedirectUri)) {
			OAuth2Error error = new OAuth2Error(OAuth2ErrorCodes.INVALID_REQUEST);
			throw new OAuth2AuthorizationCodeRequestAuthenticationException(error, null);
		}
	}
}