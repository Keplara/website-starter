package com.mysite.auth_service.model.response;

public class AssumeRoleResponse {

  private String accessToken;
  private String tokenType = "Bearer";
  private Long expiresIn; // seconds until expiration
  private String assumedRole;
  private String originalUserId;

  public AssumeRoleResponse() {
  }

  public AssumeRoleResponse(String accessToken, Long expiresIn, String assumedRole, String originalUserId) {
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.assumedRole = assumedRole;
    this.originalUserId = originalUserId;
  }

  public String getAccessToken() {
    return accessToken;
  }

  public void setAccessToken(String accessToken) {
    this.accessToken = accessToken;
  }

  public String getTokenType() {
    return tokenType;
  }

  public void setTokenType(String tokenType) {
    this.tokenType = tokenType;
  }

  public Long getExpiresIn() {
    return expiresIn;
  }

  public void setExpiresIn(Long expiresIn) {
    this.expiresIn = expiresIn;
  }

  public String getAssumedRole() {
    return assumedRole;
  }

  public void setAssumedRole(String assumedRole) {
    this.assumedRole = assumedRole;
  }

  public String getOriginalUserId() {
    return originalUserId;
  }

  public void setOriginalUserId(String originalUserId) {
    this.originalUserId = originalUserId;
  }
}
