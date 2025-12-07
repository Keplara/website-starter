package com.mysite.auth_service.model.mongo;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("groups")
public class Group {
  @Id
  private String groupId;

  private String name;
  private String description;
  private List<String> roleIds;
  private List<String> scopes;
  private List<String> memberIds;

  public Group() {
  }

  public Group(String name, String description, List<String> roleIds, List<String> scopes, List<String> memberIds) {
    this.name = name;
    this.description = description;
    this.roleIds = roleIds;
    this.scopes = scopes;
    this.memberIds = memberIds;
  }

  public String getGroupId() {
    return groupId;
  }

  public void setGroupId(String groupId) {
    this.groupId = groupId;
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

  public List<String> getRoleIds() {
    return roleIds;
  }

  public void setRoleIds(List<String> roleIds) {
    this.roleIds = roleIds;
  }

  public List<String> getScopes() {
    return scopes;
  }

  public void setScopes(List<String> scopes) {
    this.scopes = scopes;
  }

  public List<String> getMemberIds() {
    return memberIds;
  }

  public void setMemberIds(List<String> memberIds) {
    this.memberIds = memberIds;
  }
}
