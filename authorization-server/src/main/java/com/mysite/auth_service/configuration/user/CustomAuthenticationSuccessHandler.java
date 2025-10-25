package com.mysite.auth_service.configuration.user;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.session.data.redis.RedisIndexedSessionRepository;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private RedisIndexedSessionRepository redisSessionRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // Invalidate the session once OAuth2 authentication is successful
        String sessionId = request.getSession().getId();
        
        // Remove the session from Redis
        redisSessionRepository.deleteById(sessionId);
        
        // You can also log the user out from Spring Security (if desired)
        SecurityContextHolder.clearContext();
        
    }
}