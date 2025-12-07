package com.mysite.auth_service.model.request;

// import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mongodb.lang.Nullable;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateIAMUserRequest {

  @Pattern(regexp = "[a-zA-Z0-9]{10,40}", message = "username must be between 10 and 40 characters.")
  private String username;

  @Pattern(regexp = "[a-zA-Z0-9]{2,}@[a-zA-Z0-9]{2,}.[a-zA-Z]{2,}", message = "emailAddress must be valid")
  private String emailAddress;
  // set password rules later
  private String password;

  @JsonCreator
  public CreateIAMUserRequest(
      @JsonProperty("emailAddress") String emailAddress,
      @JsonProperty("username") String username,
      @JsonProperty("password") String password) {
    this.emailAddress = emailAddress;
    this.username = username;
    this.password = password;
  }

}
