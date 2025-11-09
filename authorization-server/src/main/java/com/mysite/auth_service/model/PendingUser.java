package com.mysite.auth_service.model;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import lombok.Data;

@Data
public class PendingUser {

  private String emailAddress;
  private String username;
  private String password;
  private LocalDateTime createdOn;
  private Collection<GrantedAuthority> authorities;

  public PendingUser(String emailAddress, String username, String password,
      Collection<GrantedAuthority> authorities) {
    this.emailAddress = emailAddress;
    this.username = username;
    this.password = password;
    this.createdOn = LocalDateTime.now();
  }
}
