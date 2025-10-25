package com.mysite.auth_service.model.mongo;

// import java.time.LocalDate;
import java.util.Collection;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.HashMap;

@Document("user")
public class User {
  @Id
  private String userId;

  private String password;

  @Indexed(unique = true)
  private String emailAddress;

  @Indexed(unique = true)
  private String username;

  // TODO
  private Boolean authenticatorEnabled;

  // TODO With Twillo
  // private Boolean twoFactorEnabled;

  private Collection<? extends GrantedAuthority> authorities;

  private Boolean expired;
  private Boolean accountLocked;
  private Boolean credentialsExpired;
  private Boolean enabled;

  // private String name;
  // // user profile endpoint
  // private String profile;
  // private String picture;
  // private LocalDate birthdate;
  // private String zone;
  // private String local;
  // private String phoneNumber;
  // private String address;

  public User() {
  }

  public User(String username, String emailAddress, String password, Collection<? extends GrantedAuthority> authorities) {
    this.password = password;
    this.emailAddress = emailAddress;
    this.username = username;
    this.authorities = authorities;
    this.authorities = authorities;
    this.expired = false;
    this.accountLocked = false;
    this.credentialsExpired = false;
    this.enabled = true;
  }

  public Map<String, Object> getClaims() {
    Map<String, Object> claims = new HashMap<>();
    claims.put("userId", this.userId);
    claims.put("username", this.username);
    claims.put("email", this.emailAddress);
    claims.put("authorities", this.authorities);
    claims.put("enabled", this.enabled);
    claims.put("authenticatorEnabled", this.authenticatorEnabled);
    return claims;
  }

  public String getUserId() {
    return this.userId;
  }

  public String getEmailAddress() {
    return this.emailAddress;
  }

  public String getUsernameOrEmailAddress() {
    return emailAddress != null ? emailAddress : username;
  }

  public boolean isAccountNonExpired() {
    return !this.expired;
  }

  public boolean isAccountNonLocked() {
    return !this.accountLocked;
  }

  public boolean isCredentialsNonExpired() {
    return !this.credentialsExpired;
  }

  public boolean isEnabled() {
    return this.enabled;
  }

  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }

  public String getPassword() {
    return this.password;
  }

  public String getUsername() {
    return this.username;
  }

}