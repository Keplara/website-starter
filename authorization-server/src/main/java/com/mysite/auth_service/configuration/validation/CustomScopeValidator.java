package com.mysite.auth_service.configuration.validation;

import java.util.Collection;
import java.util.Set;
import java.util.function.Consumer;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationContext;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationException;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationToken;

import com.mysite.auth_service.configuration.user.CustomUserDetailsService;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public class CustomScopeValidator implements Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext> {

    private final CustomUserDetailsService userDetailsService;

    public CustomScopeValidator(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Override
    public void accept(OAuth2AuthorizationCodeRequestAuthenticationContext context) {
    // Extract requested scopes
    OAuth2AuthorizationCodeRequestAuthenticationToken authentication = context.getAuthentication();
    Collection<? extends GrantedAuthority> requestedScopes = authentication.getAuthorities();
    System.out.println(authentication.getScopes());
    // Define allowed scopes
    Set<String> allowedScopes = Set.of("SCOPE_user.read");
    try {
    userDetailsService.loadUserByUsername(authentication.getName());
    }
    catch (UsernameNotFoundException e){
        throw new OAuth2AuthorizationCodeRequestAuthenticationException(
            new OAuth2Error("access_denied", "Not authenticated. ", null),
            authentication
        );
    }
    // Validate requested scopes
    for (GrantedAuthority authority : requestedScopes) {
        if (!allowedScopes.contains(authority.getAuthority())) {
            throw new OAuth2AuthorizationCodeRequestAuthenticationException(
                new OAuth2Error("invalid_scope", "User not allowed to request scope: " + authority.getAuthority(), null),
                authentication
            );
        }
    }
    }
}
