package com.mysite.auth_service.service;

import lombok.Data;

@Data
public class RegisterClientResponse {

    public String clientId;

    public String clientSecret;

    public RegisterClientResponse(){}

    public RegisterClientResponse(String clientId, String clientSecret){
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }
}
