// package com.mysite.auth_service.model.jwt;

// import java.time.LocalDateTime;
// import java.util.UUID;

// import lombok.Data;

// @Data
// public class AuthorizationCodeToken {
//     private String clientId;
//     private String redirectUri;
//     private LocalDateTime expirationDateTime;
//     private UUID uniqueId;
//     private String userId;

//     public AuthorizationCodeToken(String clientId, String redirectUri, String userId){
//         this.clientId = clientId;
//         this.redirectUri = redirectUri;
//         this.expirationDateTime = LocalDateTime.now().plusMinutes(2);
//         this.uniqueId = UUID.randomUUID();
//         this.userId = userId;
//     }

//     public AuthorizationCodeToken() {}
// }
