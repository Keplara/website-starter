package com.mysite.auth_service.configuration.exceptions;


public class AuthApiException extends Exception {
    
    private String message;

    public AuthApiException(String message){
        this.message = message;
    }

    @Override
    public String getMessage() {
        return message;
    }
}
