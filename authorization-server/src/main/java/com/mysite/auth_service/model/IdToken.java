package com.mysite.auth_service.model;

import java.net.URL;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class IdToken {

    @JsonProperty("iss")
    private URL issuerUrl;
    
    @JsonProperty("sub")
    private String userId;

    @JsonProperty("aud")
    private String clientId;

    @JsonProperty("exp")
    private LocalDateTime expirationDateTime;

    @JsonProperty("iat")
    private LocalDateTime issueDateTime;

    public IdToken(){}

    public IdToken(URL issuerUrl, String userId, String clientId, LocalDateTime expirationDateTime, LocalDateTime issueDateTime){
        this.issuerUrl = issuerUrl;
        this.userId = userId;
        this.clientId = clientId;
        this.expirationDateTime = expirationDateTime;
        this.issueDateTime = issueDateTime;
    }
}
