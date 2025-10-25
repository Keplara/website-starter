package com.mysite.auth_service.model.mongo;

import java.time.LocalDate;
import java.time.LocalTime;
import java.lang.String;

import java.util.List;
import java.util.ArrayList;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
import lombok.NoArgsConstructor; 


// this is to track user activity
@Document("userLog")
@NoArgsConstructor
@Data
public class UserLogs {
  @Id
  private String logId;
  
  private String userId;

  private LocalDate lastLogInDate;
  private LocalTime lastLogInTime;
  private LocalDate createdAccountDate;
  private Long loggins;
  private String currentIp;
  private List<String> ipAddresses = new ArrayList<>();

  public UserLogs(String id, String userId,
  LocalDate lastLogInDate, LocalTime lastLogInTime, Long loggins, String currentIp, List<String> ipAddresses  ) {
   this.logId = id;
   this.userId = userId;
   this.lastLogInTime = lastLogInTime;
   this.lastLogInDate = lastLogInDate;
   this.loggins = loggins;
   this.currentIp = currentIp;
   this.ipAddresses = ipAddresses;
 }

}

