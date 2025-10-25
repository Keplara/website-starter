package com.mysite.auth_service.model.jwt;
import lombok.Data;

@Data
public class AccountToken {

    private String username;
    private String emailAddress;
    private String password;

    public AccountToken(String username, String emailAddress, String password){
        this.username = username;
        this.emailAddress = emailAddress;
        this.password = password;
    }

    public AccountToken() {}

}
