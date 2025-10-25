package com.mysite.auth_service.configuration.user;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

public class CustomAuthenticationSuccessHandller implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        // Invalidate the session after the token is issued
        HttpSession session = request.getSession(false); // Retrieve existing session
        if (session != null) {
            session.invalidate(); // Invalidate session
        }

        // // Proceed with standard authentication success processing
        // response.sendRedirect("/success"); // Redirect to a success page or another endpoint
    }
}
