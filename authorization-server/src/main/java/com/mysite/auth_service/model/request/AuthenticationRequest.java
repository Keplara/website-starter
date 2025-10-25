package com.mysite.auth_service.model.request;

import org.springframework.lang.Nullable;

import lombok.Data;

import java.util.List;

@Data
public class AuthenticationRequest {
  @Nullable
  private String userName;
  
  @Nullable
  private String emailAddress;
  
  @Nullable
  private String token;
  
  @Nullable
  private String password;

  private List<String> rolesRequested;

  private List<String> resourcesRequested;

  private List<String> userResources;

  private List<String> userRoles;
  
  private String ipAddress;

  private Long passwordAttempts;

}
