package com.mysite.auth_service.model.jwt;

import lombok.Data;

@Data
public class ResetPasswordToken {
    private String emailOrUsername;
    private String newPassword;

    public ResetPasswordToken(String emailOrUsername,String newPassword){
        this.emailOrUsername = emailOrUsername;
        this.newPassword = newPassword;
    }

    public ResetPasswordToken() {}
}
