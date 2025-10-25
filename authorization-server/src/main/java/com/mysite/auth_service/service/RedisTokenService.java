package com.mysite.auth_service.service;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisTokenService {
       
        @Autowired
        private RedisTemplate<String, String> redisTemplate;
    
        private final long DEFAULT_EXPIRY_DURATION = 15 * 60; // 15 minutes in seconds
    
        /**
         * Add a token to Redis with a specified expiry duration.
         *
         * @param token the unique token to store
         * @param value the associated value (e.g., user identifier)
         * @param expiryDuration the expiry duration in seconds
         */
        public void addToken(String token, long expiryDuration) {
            String key = "resetToken:" + token;
            redisTemplate.opsForValue().set(key, "", expiryDuration, TimeUnit.SECONDS);
        }
    
        /**
         * Add a token to Redis with the default expiry duration.
         *
         * @param token the unique token to store
         * @param value the associated value (e.g., user identifier)
         */
        public void addToken(String token) {
            addToken(token, DEFAULT_EXPIRY_DURATION);
        }
    
    
        /**
         * Expire (delete) a token from Redis.
         *
         * @param token the token to expire
         */
        public void expireToken(String token) {
            String key = "resetToken:" + token;
            redisTemplate.delete(key);
        }
    
        /**
         * Check if a token exists in Redis.
         *
         * @param token the token to check
         * @return true if the token exists, false otherwise
         */
        public boolean isTokenActive(String token) {
            String key = "resetToken:" + token;
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        }
    }