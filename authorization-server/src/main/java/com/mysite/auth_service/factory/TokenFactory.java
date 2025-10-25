package com.mysite.auth_service.factory;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.mysite.auth_service.configuration.exceptions.AuthApiException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.AeadAlgorithm;
import io.jsonwebtoken.security.KeyAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.Password;
import io.jsonwebtoken.security.SignatureException;

@Component
public class TokenFactory {

    @Value("${local.jwt.secretKey}")
    private String secretKey;

    @Value("${local.jwt.payloadKey}")
    private String payloadKey;

    private AeadAlgorithm enc = Jwts.ENC.A256GCM;
    private Password payloadPassword;

    KeyAlgorithm<Password, Password> alg = Jwts.KEY.PBES2_HS512_A256KW;

    private SecretKey getSigningKey() {
        // Secret key cannot have hyphens
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }

    public String createToken(Integer expirationMinutes, Claims claims, Boolean encryptPayload) {
        Date date = Date
                .from(LocalDateTime.now().plusMinutes(expirationMinutes).atZone(ZoneId.systemDefault()).toInstant());
        if (encryptPayload) {
            return Jwts.builder().issuer("MySite").expiration(date).issuedAt(new Date())
                    .encryptWith(Keys.password(payloadKey.toCharArray()), alg, enc).claims(claims).compact();
        } else {
            return Jwts.builder().issuer("MySite").expiration(date).issuedAt(new Date()).signWith(getSigningKey())
                    .claims(claims).compact();
        }
    }

    public Claims getClaims(String token) throws AuthApiException {
        payloadPassword = Keys.password(payloadKey.toCharArray());

        // replace with if statement.
        try {
            return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
        } catch (MalformedJwtException malformedJwtException) {
            throw new AuthApiException("The token has been manipulated and for this reason it is rejected.");
        } catch (SignatureException signatureException) {
            throw new AuthApiException("The signature has been changed and is not valid.");
        } catch (UnsupportedJwtException unsupportedJwtException) {
            try {
                return Jwts.parser().decryptWith(payloadPassword).build().parseEncryptedClaims(token).getPayload();
            } catch (Exception exception) {
                throw new AuthApiException("Token not authorized.");
            }
        }
    }
}
