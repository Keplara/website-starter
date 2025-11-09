package com.mysite.auth_service.service;

import java.net.URISyntaxException;
import java.util.Collection;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;

import com.mysite.auth_service.configuration.exceptions.AuthApiException;
import com.mysite.auth_service.configuration.responseObjects.BasicResponse;
import com.mysite.auth_service.infastructure.MongoService;
import com.mysite.auth_service.infastructure.RedisService;
import com.mysite.auth_service.infastructure.SimpleEmailService;
import com.mysite.auth_service.model.PendingUser;
import com.mysite.auth_service.model.mongo.User;
import com.mysite.auth_service.model.request.CreateUserRequest;

@Service
public class UserService {

  private final SimpleEmailService simpleEmailService;

  @Value("${local.authClientBaseUrl}")
  private String authClientBaseUrl;

  @Value("${local.companyName}")
  private String companyName;
  private final PasswordEncoder passwordEncoder;

  private RedisService redisService;
  private MongoService mongoService;

  public UserService(RedisService redisService, RedisTemplate<String, String> redisTemplate,
      PasswordEncoder passwordEncoder, MongoService mongoService, SimpleEmailService simpleEmailService) {
    this.simpleEmailService = simpleEmailService;
    this.redisService = redisService;
    this.mongoService = mongoService;
    this.passwordEncoder = passwordEncoder;
  }

  public Boolean createUserRequest(CreateUserRequest userRequest, String authClientBaseUrl)
      throws AuthApiException {
    // Check if a user with the provided email already exists
    User existingUserByEmail = mongoService.getUser(userRequest.getEmailAddress());
    if (existingUserByEmail != null) {
      // If user exists, throw exception to prevent duplicate user creation
      throw new AuthApiException(
          String.format("User with email '%s' already exists.", existingUserByEmail.getEmailAddress()));
    } else {
      // Extract email from request
      String emailAddress = userRequest.getEmailAddress();
      Collection<GrantedAuthority> authorities = List.of(
          new SimpleGrantedAuthority("SCOPE_product.read"),
          new SimpleGrantedAuthority("ROLE_USER"),
          new SimpleGrantedAuthority("SCOPE_auth.user.password-reset.create"),
          new SimpleGrantedAuthority("SCOPE_auth.user.user.update"),
          new SimpleGrantedAuthority("SCOPE_user.read"));
      // Create user verification data and store in Redis
      // Token will expire automatically after a configured duration
      String userBaseURLToken = this.redisService.storeUser(
          new PendingUser(
              emailAddress,
              userRequest.getUsername(),
              this.passwordEncoder.encode(userRequest.getPassword()), authorities));

      // emailService.sendUserVerificationEmail(emailAddress, userBaseURLToken);
      // Build the verification URL with the token
      String userVerificationUrl = String.format("%s/verify?token=%s", authClientBaseUrl, userBaseURLToken);

      // Email body with instructions for verifying the user
      String body = String.format(
          "Please click the link below to verify your user.\n%s",
          userVerificationUrl);

      // Send the verification email
      simpleEmailService.sendEmail(
          userRequest.getEmailAddress(),
          "User Verification",
          body);

      // Return a success response to the client
      return true;
    }
  }

  public Boolean verifyUserCreationToken(String token) throws AuthApiException {
    // Retrieve the user verification data from Redis using the token.
    // If the token has expired or does not exist, getStoredUser() returns null.
    PendingUser user = redisService.getStoredUser(token);
    // Return true if the token is valid (exists), false if it has expired or is
    // invalid.
    return user != null;
  }

  public User confirmUserCreation(String token, String authClientBaseUrl) throws AuthApiException {

    // Retrieve the user verification data from Redis using the token
    // If the token has expired or is invalid, getStoredUser() will return null
    PendingUser userData = redisService.getStoredUser(token);
    if (userData == null) {
      throw new AuthApiException("Token has expired");
    }

    // Check if a user with the same username already exists
    // This handles rare race conditions if two requests try to confirm the same
    // token
    User existingUser = mongoService.getUser(userData.getUsername().toLowerCase());

    // Immediately expire the token to prevent it from being reused

    // If the user already exists, throw an exception
    if (existingUser != null) {
      throw new AuthApiException(String.format(
          "User '%s' has already been created.", existingUser.getUserId()));
    }

    redisService.expireUserToken(token);
    // Create the user in the system with the verified username, email, and password
    User createdUser = mongoService.createUser(userData);

    // Send a welcome email to the newly created user
    simpleEmailService.sendEmail(
        userData.getEmailAddress(),
        String.format("Welcome to %s!", companyName),
        "Thank you for joining us");

    // Return the response to the client
    return createdUser;
  }

  public Boolean updateUserPassword(String emailOrUsername, String newPassword) {
    String hashedPassword = passwordEncoder.encode(newPassword);
    return mongoService.updateUserPassword(emailOrUsername, hashedPassword);
  }

  public User getUser(String usernameOrEmail) {
    User foundUserByUsername = this.mongoService.getUser(usernameOrEmail);
    return foundUserByUsername;
  }

  /*
   * ===========================
   * Password Reset Functionality
   * ===========================
   */
  public Boolean passwordResetRequest(String emailOrUsername, String authClientBaseUrl) throws AuthApiException {
    User existingUser = mongoService.getUser(emailOrUsername);
    if (existingUser == null) {
      throw new AuthApiException(String.format("User does not exist."));
    }

    String token = redisService.storePasswordReset(existingUser.getEmailAddress());

    String resetUrl = String.format("%s/reset-password?token=%s", authClientBaseUrl, token);

    String body = String.format(
        "Please click the link below to reset your password.\n%s",
        resetUrl);

    simpleEmailService.sendEmail(
        existingUser.getEmailAddress(),
        "Password Reset",
        body);

    return true;
  }

  public Boolean verifyPasswordResetToken(@RequestParam String token) throws AuthApiException {
    String emailAddress = redisService.getStoredPasswordResetUser(token);
    return emailAddress != null;
  }

  public String confirmPasswordReset(String token, String newPassword)
      throws AuthApiException, URISyntaxException {
    String emailAddress = redisService.getStoredPasswordResetUser(token);
    if (emailAddress == null) {
      throw new AuthApiException("Token has expired");
    }

    mongoService.updateUserPassword(emailAddress, newPassword);
    redisService.expirePasswordResetToken(token);

    // if user already updated their password make token expire.
    simpleEmailService.sendEmail(emailAddress, "Your password has been updated :)",
        "If this isn't you please contact us so we can help resolve the issue.");

    return emailAddress;
  }

  // Delete acccount
  /// Require scope user.user.delete
  /// only delete the user of the logged in user which is store in the redis
  // token
  /// // delete current session after delete user
  /// revoke access token

  /**
   * Delete the currently logged-in user user.
   * 
   * Security:
   * - Requires the scope 'SCOPE_user.user.delete'.
   * - Only deletes the user of the authenticated user.
   * 
   * Steps:
   * 1. Retrieve current user from security context / token.
   * 2. Delete the user from the database.
   * 3. Delete any active sessions from Redis.
   * 4. Revoke the access token.
   */
  public ResponseEntity<BasicResponse> deleteUser(UserDetails userDetails, String authHeader) throws AuthApiException {

    if (userDetails == null) {
      throw new AuthApiException("User must be authenticated to delete user.");
    }

    String username = userDetails.getUsername();
    User user = mongoService.getUser(username);
    if (user == null || username == null) {
      throw new AuthApiException("User does not exist.");
    }
    // 1️⃣ Delete user from database
    Boolean isDeleted = mongoService.deleteUser(username);
    if (!isDeleted) {
      throw new AuthApiException("User could not be deleted.");
    }
    // 2️⃣ Delete user session(s) from Redis
    isDeleted = redisService.deleteUserSessions(user.getUserId());
    if (!isDeleted) {
      throw new AuthApiException("User could not be deleted.");
    }
    // // 3️⃣ Revoke the access token provided in the Authorization header
    // if (authHeader != null && authHeader.startsWith("Bearer ")) {
    // String accessToken = authHeader.substring(7);
    // redisService.revokeAccessToken(accessToken);
    // }

    // 4️⃣ Return success response
    return ResponseEntity.ok(
        BasicResponse.builder()
            .message("Your user has been deleted successfully.")
            .status(HttpStatus.OK)
            .build());
  }

}
