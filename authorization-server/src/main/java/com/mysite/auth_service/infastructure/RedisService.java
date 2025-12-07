package com.mysite.auth_service.infastructure;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import com.mysite.auth_service.model.PendingUser;

@Service
public class RedisService {

  private RedisTemplate<String, String> redisTemplate;
  private final ValueOperations<String, String> valueOperations;
  private final ValueOperations<String, PendingUser> pendingUserValueOperations;

  private final long ACCOUNT_TOKEN_EXPIRATION = 5 * 60; // 5 minutes in seconds
  private final long ACCOUNT_IAM_TOKEN_EXPIRATION = 30 * 24 * 60 * 60; // 30 days in seconds

  private final long PASSWORD_RESET_TOKEN_EXPIRATION = 5 * 60; // 5 minutes in seconds
  private final RedisSessionTrackerService redisSessionTrackerService;

  public RedisService(RedisTemplate<String, String> redisTemplate,
      RedisTemplate<String, PendingUser> redisUserVerifcationDataTemplate,
      RedisSessionTrackerService redisSessionTrackerService) {
    this.redisTemplate = redisTemplate;
    this.valueOperations = redisTemplate.opsForValue();
    this.pendingUserValueOperations = redisUserVerifcationDataTemplate.opsForValue();
    this.redisSessionTrackerService = redisSessionTrackerService;
  }

  /* HELPERS */
  public String getUserKey(String token) {
    return "user:" + token;
  }

  private String getPasswordResetKey(String token) {
    return "passwordReset:" + token;
  }

  private Boolean isTokenValid(String token) {
    if (token == null || token.isEmpty()) {
      throw new IllegalArgumentException("Token cannot be null or empty");
    }
    return redisTemplate.hasKey(getUserKey(token)) || redisTemplate.hasKey(getPasswordResetKey(token));
  }

  /* ---------------------------- Store Objects ---------------------------- */
  public String storeUser(PendingUser userData) {
    String token = java.util.UUID.randomUUID().toString();
    String key = getUserKey(token);
    if (userData == null) {
      throw new IllegalArgumentException("userData cannot be null");
    }
    pendingUserValueOperations.set(key, userData, ACCOUNT_TOKEN_EXPIRATION, TimeUnit.SECONDS);

    return token;
  }

  /* ---------------------------- Store Objects ---------------------------- */
  public String storeIAMUser(PendingUser userData) {
    String token = java.util.UUID.randomUUID().toString();
    String key = getUserKey(token);
    if (userData == null) {
      throw new IllegalArgumentException("userData cannot be null");
    }
    pendingUserValueOperations.set(key, userData, ACCOUNT_IAM_TOKEN_EXPIRATION, TimeUnit.SECONDS);

    return token;
  }

  public String storePasswordReset(String emailOrUsername) {
    String token = java.util.UUID.randomUUID().toString();
    String key = getPasswordResetKey(token);
    if (emailOrUsername == null) {
      throw new IllegalArgumentException("userData cannot be null");
    }
    valueOperations.set(key, emailOrUsername, PASSWORD_RESET_TOKEN_EXPIRATION, TimeUnit.SECONDS);

    return token;
  }

  /* ---------------------------- Get Data ---------------------------- */

  /**
   * Retrieve stored user verification data.
   * 
   * @param token The token to retrieve data for
   * @return The stored user data, or null if token is invalid or expired
   */
  public PendingUser getStoredUser(String token) {
    if (token == null || token.isEmpty()) {
      return null;
    }

    String key = getUserKey(token);
    Boolean exists = isTokenValid(token);
    if (Boolean.FALSE.equals(exists)) {
      return null;
    }

    PendingUser userVerificationData = pendingUserValueOperations.get(key);
    return userVerificationData;
  }

  /**
   * Retrieve stored Email for password reset. If token is invalid or expired,
   * returns null.
   * if token is valid, return emailAddress, which will follow up with
   * passwordReset database update
   * 
   * @param token The token to retrieve data for
   * @return The stored user data, or null if token is invalid or expired
   */
  public String getStoredPasswordResetUser(String token) {
    if (token == null || token.isEmpty()) {
      return null;
    }

    String key = getPasswordResetKey(token);
    Boolean exists = isTokenValid(token);
    if (Boolean.FALSE.equals(exists)) {
      return null;
    }

    String emailAddress = valueOperations.get(key);
    return emailAddress;
  }

  /*
   * ---------------------------- REMOVE ----------------------------
   */

  public void expireUserToken(String token) {
    String key = getUserKey(token);
    redisTemplate.delete(key);
  }

  public void expirePasswordResetToken(String token) {
    String key = getPasswordResetKey(token);
    redisTemplate.delete(key);
  }

  public Boolean deleteUserSessions(String userId) {
    if (userId == null) {
      return false;
    }

    return redisSessionTrackerService.deleteAllSessionsForUser(userId);
  }

}