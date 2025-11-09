package com.mysite.auth_service.model.response;

import java.time.LocalDateTime;

public class IsValidBooleanResponse {

  private LocalDateTime timestamp;
  private Boolean valid;

  public IsValidBooleanResponse(Boolean valid) {
    this.timestamp = LocalDateTime.now();
    this.valid = valid;
  }

  public LocalDateTime getTimestamp() {
    return timestamp;
  }

  public Boolean getValid() {
    return valid;
  }
}
