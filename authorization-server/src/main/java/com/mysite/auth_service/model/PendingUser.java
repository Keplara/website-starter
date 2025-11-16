package com.mysite.auth_service.model;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;

import lombok.Data;

@Data
public class PendingUser implements Serializable {
  private static final long serialVersionUID = 1L;

  private String emailAddress;
  private String username;
  private String password;
  private LocalDateTime createdOn;
  private Collection<GrantedAuthority> authorities;

  public PendingUser(String emailAddress, String username, String password,
      Collection<GrantedAuthority> authorities) {
    this.emailAddress = emailAddress.toLowerCase();
    this.username = username.toLowerCase();
    this.password = password;
    this.createdOn = LocalDateTime.now();
  }
}
