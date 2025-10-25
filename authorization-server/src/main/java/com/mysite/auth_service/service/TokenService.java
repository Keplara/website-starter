package com.mysite.auth_service.service;

import org.springframework.stereotype.Service;

import com.mysite.auth_service.configuration.exceptions.AuthApiException;
import com.mysite.auth_service.factory.TokenFactory;
import com.mysite.auth_service.model.IdToken;
import com.mysite.auth_service.model.jwt.AccountToken;
import com.mysite.auth_service.model.jwt.ResetPasswordToken;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

@Service
public class TokenService {
    private TokenFactory tokenBuilder;

    public TokenService(TokenFactory tokenBuilder) {
        this.tokenBuilder = tokenBuilder;
    }

    public String createAccountToken(String emailAddress, String password, String username){
        Claims claims = Jwts.claims()
        .add("emailAddress", emailAddress)
        .add("password", password)
        .add("username", username).build();
        return tokenBuilder.createToken(30, claims, true);
    }

    public String createResetPasswordToken(String emailAddressOrUsername){
        Claims claims = Jwts.claims()
        .add("emailOrUsername", emailAddressOrUsername).build();
        return tokenBuilder.createToken(15, claims, true);
    }
    
    public ResetPasswordToken parseResetPasswordToken(String token) throws AuthApiException {
        ResetPasswordToken createResetPasswordJwt = new ResetPasswordToken();
        Claims claims =  tokenBuilder.getClaims(token);
        createResetPasswordJwt.setEmailOrUsername((String) claims.get("emailOrUsername"));
        createResetPasswordJwt.setNewPassword((String) claims.get("newPassword"));
        return createResetPasswordJwt;
    }


    public AccountToken parseAccountToken(String token) throws AuthApiException {
        AccountToken createAccountJwt = new AccountToken();
        Claims claims =  tokenBuilder.getClaims(token);
        createAccountJwt.setEmailAddress((String) claims.get("emailAddress"));
        createAccountJwt.setUsername((String) claims.get("username"));
        createAccountJwt.setPassword((String) claims.get("password"));
        return createAccountJwt;
    }


    public String createIdToken(IdToken idToken){
        Claims claims = Jwts.claims()
        .add("iss", idToken.getIssuerUrl().toString())
        .add("sub", idToken.getUserId())
        .add("aud", idToken.getClientId())
        .add("exp", idToken.getExpirationDateTime())
        .add("iat", idToken.getIssueDateTime())        
        .build();
        return tokenBuilder.createToken(30, claims, true);
    }

}
