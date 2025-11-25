package com.mysite.auth_service.infastructure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.session.data.redis.RedisSessionRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Service
public class RedisSessionTrackerService {

  private final RedisTemplate<String, Object> redisTemplate;
  private static final String SESSION_TRACKER_PREFIX = "user:sessions:";

  private RedisSessionRepository sessionRepository;

  @Value("${spring.session.tracker.timeout:PT720H}")
  private Duration SESSION_EXPIRATION;

  public RedisSessionTrackerService(RedisSessionRepository sessionRepository,
      RedisTemplate<String, Object> redisTemplate) {
    this.sessionRepository = sessionRepository;
    this.redisTemplate = redisTemplate;
  }

  /**
   * Track a new session by userId
   */
  public void registerSession(String userId, String sessionId) {
    if (userId == null || sessionId == null) {
      throw new IllegalArgumentException("userId and sessionId cannot be null");
    }
    redisTemplate.opsForSet().add(SESSION_TRACKER_PREFIX + userId, sessionId);
    assert SESSION_EXPIRATION != null;
    redisTemplate.expire(SESSION_TRACKER_PREFIX + userId, SESSION_EXPIRATION);
  }

  /**
   * Remove a session when logged out or expired
   */
  public void deregisterSession(String userId, String sessionId) {
    redisTemplate.opsForSet().remove(SESSION_TRACKER_PREFIX + userId, sessionId);
  }

  /**
   * Delete all sessions by user (called on account deletion)
   */
  public Boolean deleteAllSessionsForUser(String userId) {
    String key = SESSION_TRACKER_PREFIX + userId;
    Set<Object> sessionIds = redisTemplate.opsForSet().members(key);

    if (sessionIds != null) {
      sessionIds.forEach(sessionId -> {
        sessionRepository.deleteById(sessionId.toString());
      });
    }

    // delete tokens

    redisTemplate.delete(key);
    return true;
  }
}
