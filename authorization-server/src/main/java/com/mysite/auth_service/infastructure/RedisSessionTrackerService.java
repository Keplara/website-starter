package com.mysite.auth_service.infastructure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import org.springframework.session.data.redis.RedisSessionRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Service
public class RedisSessionTrackerService {

  // private final FindByIndexNameSessionRepository<? extends Session>
  // sessionRepository;
  private final RedisTemplate<String, Object> redisTemplate;
  private final ValueOperations<String, Object> valueOperations;
  private static final String SESSION_TRACKER_PREFIX = "user:sessions:";

  private RedisSessionRepository sessionRepository;

  @Value("${spring.session.timeout}")
  private Duration SESSION_EXPIRATION; // 5 minutes in seconds

  public RedisSessionTrackerService(RedisSessionRepository sessionRepository,
      RedisTemplate<String, Object> redisTemplate) {
    this.sessionRepository = sessionRepository;
    this.redisTemplate = redisTemplate;
    this.valueOperations = redisTemplate.opsForValue();
  }

  /**
   * Track a new session by userId
   */
  public void registerSession(String userId, String sessionId) {
    if (userId == null || sessionId == null) {
      throw new IllegalArgumentException("userId and sessionId cannot be null");
    }
    redisTemplate.opsForSet().add(SESSION_TRACKER_PREFIX + userId, sessionId);
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

    redisTemplate.delete(key);
    return true;
  }
}
