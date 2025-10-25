package com.mysite.auth_service.configuration.user;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.mysite.auth_service.model.mongo.User;

public class AdminUserDetails  implements UserDetails {
 
      private String userId;
    
      private String password;
    
      private String emailAddress;

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
    
      public AdminUserDetails() {
      }
    
      public AdminUserDetails(User user) {
        this.emailAddress = user.getEmailAddress();
        this.username = user.getEmailAddress();
        this.password = user.getPassword();
        this.authorities = user.getAuthorities();
      }

      public AdminUserDetails(String username, String emailAddress, String password) {
        this.password = password;
        this.emailAddress = emailAddress;
        this.username = username;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"));
        this.expired = false;
        this.accountLocked = false;
        this.credentialsExpired = false;
        this.enabled = true;
      }

      public AdminUserDetails(String username, String emailAddress) {
        this.emailAddress = emailAddress;
        this.username = username;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"));
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
        claims.put("roles", this.authorities);
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
    
      @Override
      public boolean isAccountNonExpired() {
        return !this.expired;
      }
    
      @Override
      public boolean isAccountNonLocked() {
        return !this.accountLocked;
      }
    
      @Override
      public boolean isCredentialsNonExpired() {
        return !this.credentialsExpired;
      }
    
      @Override
      public boolean isEnabled() {
        return this.enabled;
      }
    
      @Override
      public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
      }
    
      @Override
      public String getPassword() {
        return this.password;
      }
    
      @Override
      public String getUsername() {
        return this.username;
      }
    
    }