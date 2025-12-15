package com.mysite.auth_service.infastructure;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
public class RedisService {

  private RedisTemplate<String, String> redisTemplate;
  private final ValueOperations<String, String> valueOperations;

  private final long ACCOUNT_TOKEN_EXPIRATION = 5 * 60; // 5 minutes in seconds
  private final long ACCOUNT_IAM_TOKEN_EXPIRATION = 30 * 24 * 60 * 60; // 30 days in seconds

  private final long PASSWORD_RESET_TOKEN_EXPIRATION = 5 * 60; // 5 minutes in seconds
  private final RedisSessionTrackerService redisSessionTrackerService;

  public RedisService(RedisTemplate<String, String> redisTemplate,
      RedisSessionTrackerService redisSessionTrackerService) {
    this.redisTemplate = redisTemplate;
    this.valueOperations = redisTemplate.opsForValue();
    this.redisSessionTrackerService = redisSessionTrackerService;
  }

  /* HELPERS */
  // TODO: Migrate over to user resource server

  public @NonNull String getUserKey(String token) {
    if (token == null || token.isEmpty()) {
      throw new IllegalArgumentException("Token cannot be null or empty");
    }
    return "user:" + token;
  }

  // TODO: Migrate over to user resource server
  private @NonNull String getPasswordResetKey(String token) {
    if (token == null || token.isEmpty()) {
      throw new IllegalArgumentException("Token cannot be null or empty");
    }
    return "passwordReset:" + token;
  }
  // TODO: Migrate over to user resource server

  private Boolean isTokenValid(@NonNull String token) {
    if (token == null || token.isEmpty()) {
      throw new IllegalArgumentException("Token cannot be null or empty");
    }
    return redisTemplate.hasKey(getUserKey(token)) || redisTemplate.hasKey(getPasswordResetKey(token));
  }

  /* ---------------------------- Store Objects ---------------------------- */
  // TODO: DELETE

  /* ---------------------------- Store Objects ---------------------------- */
  // TODO: Migrate over to user resource server

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
   * Retrieve stored Email for password reset. If token is invalid or expired,
   * returns null.
   * if token is valid, return emailAddress, which will follow up with
   * passwordReset database update
   * 
   * @param token The token to retrieve data for
   * @return The stored user data, or null if token is invalid or expired
   */
  // TODO: Migrate over to user resource server

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
  // TODO: Migrate over to user resource server

  public void expireUserToken(String token) {
    String key = getUserKey(token);
    redisTemplate.delete(key);
  }
  // TODO: Migrate over to user resource server

  public void expirePasswordResetToken(String token) {
    String key = getPasswordResetKey(token);
    redisTemplate.delete(key);
  }
  // TODO: Migrate over to user resource server

  public Boolean deleteUserSessions(String userId) {
    if (userId == null) {
      return false;
    }

    return redisSessionTrackerService.deleteAllSessionsForUser(userId);
  }

}