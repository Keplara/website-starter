// package com.mysite.auth_service.controller;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.ExceptionHandler;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestBody;

// import com.mysite.auth_service.configuration.exceptions.AuthApiException;
// import com.mysite.auth_service.model.mongo.TestMongoRecord;

// public class TestController {

// @GetMapping("test-authenticated")
// public String sendTestAuthenticated() throws AuthApiException {
// return "Authenticated Success";
// }

// @PostMapping("send-test-email")
// public String sendTestEmail() throws AuthApiException {
// this.simpleEmailService.sendEmail("grantmitchell@mysite.com", "First Email
// Subject",
// "<div><img
// src=\"https://avatars.githubusercontent.com/u/154090351?s=200&v=4\"><h2>Test
// Email Succeeds!</h2></div>");
// return "Email sent successfully!";
// }

// @ExceptionHandler(value = { AuthApiException.class })
// protected ResponseEntity<String> handleExceptions(AuthApiException ex) {
// return new ResponseEntity<String>(ex.getMessage(), HttpStatus.BAD_REQUEST);
// }

// // Needs to be refactored
// @PostMapping("/test-mongo-record")
// public Boolean createMongoRecord(@RequestBody TestMongoRecord record) {
// // Save the record to MongoDB
// return authService.saveMongoTestRecord(record);
// // account service
// }
// }
