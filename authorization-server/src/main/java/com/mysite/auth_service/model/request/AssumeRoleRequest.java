package com.mysite.auth_service.model.request;

import jakarta.validation.constraints.NotBlank;

public class AssumeRoleRequest {

  @NotBlank(message = "Role name is required")
  private String roleName;

  public AssumeRoleRequest() {
  }

  public AssumeRoleRequest(String roleName) {
    this.roleName = roleName;
  }

  public String getRoleName() {
    return roleName;
  }

  public void setRoleName(String roleName) {
    this.roleName = roleName;
  }
}
