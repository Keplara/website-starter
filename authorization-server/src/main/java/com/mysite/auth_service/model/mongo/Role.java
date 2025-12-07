package com.mysite.auth_service.model.mongo;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("roles")
public class Role {
  @Id
  private String roleId;

  private String name;
  private String description;
  private List<String> scopes;
  private List<String> policyIds;

  public Role() {
  }

  public Role(String name, String description, List<String> scopes, List<String> policyIds) {
    this.name = name;
    this.description = description;
    this.scopes = scopes;
    this.policyIds = policyIds;
  }

  public String getRoleId() {
    return roleId;
  }

  public void setRoleId(String roleId) {
    this.roleId = roleId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public List<String> getScopes() {
    return scopes;
  }

  public void setScopes(List<String> scopes) {
    this.scopes = scopes;
  }

  public List<String> getPolicyIds() {
    return policyIds;
  }

  public void setPolicyIds(List<String> policyIds) {
    this.policyIds = policyIds;
  }
}
