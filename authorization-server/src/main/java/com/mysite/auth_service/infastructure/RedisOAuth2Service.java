package com.mysite.auth_service.infastructure;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2DeviceCode;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.core.OAuth2UserCode;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationCode;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

/**
 * Redis-backed {@link OAuth2AuthorizationService} that stores the full
 * {@link OAuth2Authorization} object using the provided
 * {@link RedisTemplate}. The implementation mirrors the semantics of
 * {@code InMemoryOAuth2AuthorizationService} while maintaining lightweight
 * token
 * indexes for common lookup paths. When an index is missing (for example the
 * authorization code was not indexed yet) the service performs a fallback
 * scan across stored authorizations and recreates the missing index.
 */
@Service
public class RedisOAuth2Service implements OAuth2AuthorizationService {

  private static final Logger log = LoggerFactory.getLogger(RedisOAuth2Service.class);

  private static final String AUTHORIZATION_PREFIX = "oauth2:authorization:";
  private static final String INITIALIZED_AUTHORIZATION_PREFIX = "oauth2:authorization:initialized:";
  private static final String STATE_PREFIX = "oauth2:state:";
  private static final String CODE_PREFIX = "oauth2:code:";
  private static final String ACCESS_PREFIX = "oauth2:access:";
  private static final String REFRESH_PREFIX = "oauth2:refresh:";
  private static final String ID_TOKEN_PREFIX = "oauth2:id:";
  private static final String DEVICE_CODE_PREFIX = "oauth2:device:";
  private static final String USER_CODE_PREFIX = "oauth2:user:";

  private static final Duration DEFAULT_INITIALIZED_TTL = Duration.ofMinutes(5);
  private static final Duration DEFAULT_CODE_TTL = Duration.ofMinutes(5);
  private static final Duration DEFAULT_STATE_TTL = Duration.ofMinutes(10);
  private static final Duration DEFAULT_ACCESS_TTL = Duration.ofHours(1);
  private static final Duration DEFAULT_REFRESH_TTL = Duration.ofDays(30);
  private static final Duration DEFAULT_DEVICE_USER_TTL = Duration.ofMinutes(10);
  private static final Duration DEFAULT_ID_TOKEN_TTL = Duration.ofMinutes(5);

  private final RedisTemplate<String, OAuth2Authorization> redisTemplate;

  public RedisOAuth2Service(RedisTemplate<String, OAuth2Authorization> redisTemplate) {
    Assert.notNull(redisTemplate, "redisTemplate cannot be null");
    this.redisTemplate = redisTemplate;
  }

  @Override
  public void save(OAuth2Authorization authorization) {
    Assert.notNull(authorization, "authorization cannot be null");

    // Remove any stale initialized snapshot before re-saving.
    redisTemplate.delete(INITIALIZED_AUTHORIZATION_PREFIX + authorization.getId());

    if (!isComplete(authorization)) {
      storeInitializedAuthorization(authorization);
      return;
    }

    OAuth2Authorization existing = redisTemplate.opsForValue().get(AUTHORIZATION_PREFIX + authorization.getId());
    if (existing != null) {
      clearTokenIndexes(existing);
    }

    storeCompletedAuthorization(authorization);
    indexAuthorization(authorization);
  }

  @Override
  public void remove(OAuth2Authorization authorization) {
    Assert.notNull(authorization, "authorization cannot be null");

    clearTokenIndexes(authorization);
    redisTemplate.delete(AUTHORIZATION_PREFIX + authorization.getId());
    redisTemplate.delete(INITIALIZED_AUTHORIZATION_PREFIX + authorization.getId());
  }

  @Override
  @Nullable
  public OAuth2Authorization findById(String id) {
    Assert.hasText(id, "id cannot be empty");

    OAuth2Authorization authorization = redisTemplate.opsForValue().get(AUTHORIZATION_PREFIX + id);
    if (authorization != null) {
      return authorization;
    }
    return redisTemplate.opsForValue().get(INITIALIZED_AUTHORIZATION_PREFIX + id);
  }

  @Override
  @Nullable
  public OAuth2Authorization findByToken(String token, @Nullable OAuth2TokenType tokenType) {
    Assert.hasText(token, "token cannot be empty");

    OAuth2Authorization authorization = resolveFromIndexes(token, tokenType);
    if (authorization != null) {
      return authorization;
    }

    authorization = scanForAuthorization(token, tokenType);
    if (authorization != null) {
      // Ensure future lookups are fast once we recover the record.
      indexAuthorization(authorization);
    }
    return authorization;
  }

  private void storeInitializedAuthorization(OAuth2Authorization authorization) {
    Duration ttl = DEFAULT_INITIALIZED_TTL;
    redisTemplate.opsForValue().set(INITIALIZED_AUTHORIZATION_PREFIX + authorization.getId(), authorization,
        ttl.toMillis(), TimeUnit.MILLISECONDS);
    log.debug("Stored initialized authorization {} with ttl {}", authorization.getId(), ttl);
  }

  private void storeCompletedAuthorization(OAuth2Authorization authorization) {
    Duration ttl = resolveAuthorizationTtl(authorization);
    redisTemplate.opsForValue().set(AUTHORIZATION_PREFIX + authorization.getId(), authorization, ttl.toMillis(),
        TimeUnit.MILLISECONDS);
    log.debug("Stored authorization {} with ttl {}", authorization.getId(), ttl);
  }

  private void indexAuthorization(OAuth2Authorization authorization) {
    if (!isComplete(authorization)) {
      return;
    }

    storeStateIndex(authorization);
    storeAuthorizationCodeIndex(authorization);
    storeAccessTokenIndex(authorization);
    storeRefreshTokenIndex(authorization);
    storeIdTokenIndex(authorization);
    storeDeviceCodeIndex(authorization);
    storeUserCodeIndex(authorization);
  }

  private void clearTokenIndexes(OAuth2Authorization authorization) {
    List<String> keys = new ArrayList<>();

    String state = authorization.getAttribute(OAuth2ParameterNames.STATE);
    if (state != null) {
      keys.add(STATE_PREFIX + state);
    }

    OAuth2Authorization.Token<OAuth2AuthorizationCode> code = authorization.getToken(OAuth2AuthorizationCode.class);
    if (code != null && code.getToken() != null) {
      keys.add(CODE_PREFIX + code.getToken().getTokenValue());
    }

    OAuth2Authorization.Token<OAuth2AccessToken> access = authorization.getToken(OAuth2AccessToken.class);
    if (access != null && access.getToken() != null) {
      keys.add(ACCESS_PREFIX + access.getToken().getTokenValue());
    }

    OAuth2Authorization.Token<OAuth2RefreshToken> refresh = authorization.getToken(OAuth2RefreshToken.class);
    if (refresh != null && refresh.getToken() != null) {
      keys.add(REFRESH_PREFIX + refresh.getToken().getTokenValue());
    }

    OAuth2Authorization.Token<OidcIdToken> idToken = authorization.getToken(OidcIdToken.class);
    if (idToken != null && idToken.getToken() != null) {
      keys.add(ID_TOKEN_PREFIX + idToken.getToken().getTokenValue());
    }

    OAuth2Authorization.Token<OAuth2DeviceCode> deviceCode = authorization.getToken(OAuth2DeviceCode.class);
    if (deviceCode != null && deviceCode.getToken() != null) {
      keys.add(DEVICE_CODE_PREFIX + deviceCode.getToken().getTokenValue());
    }

    OAuth2Authorization.Token<OAuth2UserCode> userCode = authorization.getToken(OAuth2UserCode.class);
    if (userCode != null && userCode.getToken() != null) {
      keys.add(USER_CODE_PREFIX + userCode.getToken().getTokenValue());
    }

    if (!keys.isEmpty()) {
      redisTemplate.delete(keys);
    }
  }

  private void storeAuthorizationCodeIndex(OAuth2Authorization authorization) {
    OAuth2Authorization.Token<OAuth2AuthorizationCode> code = authorization.getToken(OAuth2AuthorizationCode.class);
    if (code == null || code.getToken() == null) {
      return;
    }

    Duration ttl = resolveTtl(code.getToken().getExpiresAt(), DEFAULT_CODE_TTL);
    redisTemplate.opsForValue().set(CODE_PREFIX + code.getToken().getTokenValue(), authorization, ttl.toMillis(),
        TimeUnit.MILLISECONDS);
  }

  private void storeAccessTokenIndex(OAuth2Authorization authorization) {
    OAuth2Authorization.Token<OAuth2AccessToken> accessToken = authorization.getToken(OAuth2AccessToken.class);
    if (accessToken == null || accessToken.getToken() == null) {
      return;
    }

    Duration ttl = resolveTtl(accessToken.getToken().getExpiresAt(), DEFAULT_ACCESS_TTL);
    redisTemplate.opsForValue().set(ACCESS_PREFIX + accessToken.getToken().getTokenValue(), authorization,
        ttl.toMillis(), TimeUnit.MILLISECONDS);
  }

  private void storeRefreshTokenIndex(OAuth2Authorization authorization) {
    OAuth2Authorization.Token<OAuth2RefreshToken> refreshToken = authorization.getToken(OAuth2RefreshToken.class);
    if (refreshToken == null || refreshToken.getToken() == null) {
      return;
    }

    Duration ttl = resolveTtl(refreshToken.getToken().getExpiresAt(), DEFAULT_REFRESH_TTL);
    redisTemplate.opsForValue().set(REFRESH_PREFIX + refreshToken.getToken().getTokenValue(), authorization,
        ttl.toMillis(), TimeUnit.MILLISECONDS);
  }

  private void storeStateIndex(OAuth2Authorization authorization) {
    String state = authorization.getAttribute(OAuth2ParameterNames.STATE);
    if (state == null) {
      return;
    }
    redisTemplate.opsForValue().set(STATE_PREFIX + state, authorization, DEFAULT_STATE_TTL.toMillis(),
        TimeUnit.MILLISECONDS);
  }

  private void storeIdTokenIndex(OAuth2Authorization authorization) {
    OAuth2Authorization.Token<OidcIdToken> idToken = authorization.getToken(OidcIdToken.class);
    if (idToken == null || idToken.getToken() == null) {
      return;
    }

    Duration ttl = resolveTtl(idToken.getToken().getExpiresAt(), DEFAULT_ID_TOKEN_TTL);
    redisTemplate.opsForValue().set(ID_TOKEN_PREFIX + idToken.getToken().getTokenValue(), authorization,
        ttl.toMillis(), TimeUnit.MILLISECONDS);
  }

  private void storeDeviceCodeIndex(OAuth2Authorization authorization) {
    OAuth2Authorization.Token<OAuth2DeviceCode> deviceCode = authorization.getToken(OAuth2DeviceCode.class);
    if (deviceCode == null || deviceCode.getToken() == null) {
      return;
    }

    Duration ttl = resolveTtl(deviceCode.getToken().getExpiresAt(), DEFAULT_DEVICE_USER_TTL);
    redisTemplate.opsForValue().set(DEVICE_CODE_PREFIX + deviceCode.getToken().getTokenValue(), authorization,
        ttl.toMillis(), TimeUnit.MILLISECONDS);
  }

  private void storeUserCodeIndex(OAuth2Authorization authorization) {
    OAuth2Authorization.Token<OAuth2UserCode> userCode = authorization.getToken(OAuth2UserCode.class);
    if (userCode == null || userCode.getToken() == null) {
      return;
    }

    Duration ttl = resolveTtl(userCode.getToken().getExpiresAt(), DEFAULT_DEVICE_USER_TTL);
    redisTemplate.opsForValue().set(USER_CODE_PREFIX + userCode.getToken().getTokenValue(), authorization,
        ttl.toMillis(), TimeUnit.MILLISECONDS);
  }

  private Duration resolveAuthorizationTtl(OAuth2Authorization authorization) {
    Duration ttl = DEFAULT_REFRESH_TTL;

    OAuth2Authorization.Token<OAuth2RefreshToken> refreshToken = authorization.getToken(OAuth2RefreshToken.class);
    if (refreshToken != null && refreshToken.getToken() != null) {
      ttl = resolveTtl(refreshToken.getToken().getExpiresAt(), DEFAULT_REFRESH_TTL);
    } else {
      OAuth2Authorization.Token<OAuth2AccessToken> accessToken = authorization.getToken(OAuth2AccessToken.class);
      if (accessToken != null && accessToken.getToken() != null) {
        ttl = resolveTtl(accessToken.getToken().getExpiresAt(), DEFAULT_ACCESS_TTL);
      }
    }

    // Add a buffer so the authorization outlives the longest token slightly.
    return ttl.plusMinutes(5);
  }

  private Duration resolveTtl(@Nullable Instant expiresAt, Duration fallback) {
    if (expiresAt == null) {
      return fallback;
    }

    Duration ttl = Duration.between(Instant.now(), expiresAt);
    if (ttl.isNegative() || ttl.isZero()) {
      return fallback;
    }
    return ttl;
  }

  private boolean isComplete(OAuth2Authorization authorization) {
    return authorization.getAccessToken() != null || authorization.getRefreshToken() != null
        || authorization.getToken(OAuth2AuthorizationCode.class) != null;
  }

  @Nullable
  private OAuth2Authorization resolveFromIndexes(String token, @Nullable OAuth2TokenType tokenType) {
    if (tokenType == null) {
      OAuth2Authorization authorization = findByKey(STATE_PREFIX + token);
      if (authorization != null) {
        return authorization;
      }
      authorization = findByKey(CODE_PREFIX + token);
      if (authorization != null) {
        return authorization;
      }
      authorization = findByKey(ACCESS_PREFIX + token);
      if (authorization != null) {
        return authorization;
      }
      authorization = findByKey(ID_TOKEN_PREFIX + token);
      if (authorization != null) {
        return authorization;
      }
      authorization = findByKey(REFRESH_PREFIX + token);
      if (authorization != null) {
        return authorization;
      }
      authorization = findByKey(DEVICE_CODE_PREFIX + token);
      if (authorization != null) {
        return authorization;
      }
      return findByKey(USER_CODE_PREFIX + token);
    }

    if (OAuth2TokenType.ACCESS_TOKEN.equals(tokenType)) {
      return findByKey(ACCESS_PREFIX + token);
    }
    if (OAuth2TokenType.REFRESH_TOKEN.equals(tokenType)) {
      return findByKey(REFRESH_PREFIX + token);
    }
    if (OidcParameterNames.ID_TOKEN.equals(tokenType.getValue())) {
      return findByKey(ID_TOKEN_PREFIX + token);
    }
    if (OAuth2ParameterNames.STATE.equals(tokenType.getValue())) {
      return findByKey(STATE_PREFIX + token);
    }
    if (OAuth2ParameterNames.CODE.equals(tokenType.getValue())) {
      return findByKey(CODE_PREFIX + token);
    }
    if (OAuth2ParameterNames.DEVICE_CODE.equals(tokenType.getValue())) {
      return findByKey(DEVICE_CODE_PREFIX + token);
    }
    if (OAuth2ParameterNames.USER_CODE.equals(tokenType.getValue())) {
      return findByKey(USER_CODE_PREFIX + token);
    }

    return null;
  }

  @Nullable
  private OAuth2Authorization scanForAuthorization(String token, @Nullable OAuth2TokenType tokenType) {
    Set<String> completedKeys = redisTemplate.keys(AUTHORIZATION_PREFIX + "*");
    if (completedKeys != null) {
      for (String key : completedKeys) {
        OAuth2Authorization authorization = redisTemplate.opsForValue().get(Objects.requireNonNull(key));
        if (authorization != null && matches(authorization, token, tokenType)) {
          log.debug("Recovered authorization {} via completed scan", authorization.getId());
          return authorization;
        }
      }
    }

    Set<String> initializedKeys = redisTemplate.keys(INITIALIZED_AUTHORIZATION_PREFIX + "*");
    if (initializedKeys != null) {
      for (String key : initializedKeys) {
        OAuth2Authorization authorization = redisTemplate.opsForValue().get(Objects.requireNonNull(key));
        if (authorization != null && matches(authorization, token, tokenType)) {
          log.debug("Recovered authorization {} via initialized scan", authorization.getId());
          return authorization;
        }
      }
    }

    return null;
  }

  private boolean matches(OAuth2Authorization authorization, String token, @Nullable OAuth2TokenType tokenType) {
    if (tokenType == null) {
      return matchesState(authorization, token) || matchesAuthorizationCode(authorization, token)
          || matchesAccessToken(authorization, token) || matchesIdToken(authorization, token)
          || matchesRefreshToken(authorization, token) || matchesDeviceCode(authorization, token)
          || matchesUserCode(authorization, token);
    }

    if (OAuth2TokenType.ACCESS_TOKEN.equals(tokenType)) {
      return matchesAccessToken(authorization, token);
    }
    if (OAuth2TokenType.REFRESH_TOKEN.equals(tokenType)) {
      return matchesRefreshToken(authorization, token);
    }
    if (OidcParameterNames.ID_TOKEN.equals(tokenType.getValue())) {
      return matchesIdToken(authorization, token);
    }
    if (OAuth2ParameterNames.STATE.equals(tokenType.getValue())) {
      return matchesState(authorization, token);
    }
    if (OAuth2ParameterNames.CODE.equals(tokenType.getValue())) {
      return matchesAuthorizationCode(authorization, token);
    }
    if (OAuth2ParameterNames.DEVICE_CODE.equals(tokenType.getValue())) {
      return matchesDeviceCode(authorization, token);
    }
    if (OAuth2ParameterNames.USER_CODE.equals(tokenType.getValue())) {
      return matchesUserCode(authorization, token);
    }

    return false;
  }

  @Nullable
  private OAuth2Authorization findByKey(String key) {
    return redisTemplate.opsForValue().get(Objects.requireNonNull(key));
  }

  private boolean matchesState(OAuth2Authorization authorization, String token) {
    String state = authorization.getAttribute(OAuth2ParameterNames.STATE);
    return state != null && state.equals(token);
  }

  private boolean matchesAuthorizationCode(OAuth2Authorization authorization, String token) {
    OAuth2Authorization.Token<OAuth2AuthorizationCode> code = authorization.getToken(OAuth2AuthorizationCode.class);
    return code != null && code.getToken() != null && token.equals(code.getToken().getTokenValue());
  }

  private boolean matchesAccessToken(OAuth2Authorization authorization, String token) {
    OAuth2Authorization.Token<OAuth2AccessToken> access = authorization.getToken(OAuth2AccessToken.class);
    return access != null && access.getToken() != null && token.equals(access.getToken().getTokenValue());
  }

  private boolean matchesRefreshToken(OAuth2Authorization authorization, String token) {
    OAuth2Authorization.Token<OAuth2RefreshToken> refresh = authorization.getToken(OAuth2RefreshToken.class);
    return refresh != null && refresh.getToken() != null && token.equals(refresh.getToken().getTokenValue());
  }

  private boolean matchesIdToken(OAuth2Authorization authorization, String token) {
    OAuth2Authorization.Token<OidcIdToken> idToken = authorization.getToken(OidcIdToken.class);
    return idToken != null && idToken.getToken() != null && token.equals(idToken.getToken().getTokenValue());
  }

  private boolean matchesDeviceCode(OAuth2Authorization authorization, String token) {
    OAuth2Authorization.Token<OAuth2DeviceCode> device = authorization.getToken(OAuth2DeviceCode.class);
    return device != null && device.getToken() != null && token.equals(device.getToken().getTokenValue());
  }

  private boolean matchesUserCode(OAuth2Authorization authorization, String token) {
    OAuth2Authorization.Token<OAuth2UserCode> userCode = authorization.getToken(OAuth2UserCode.class);
    return userCode != null && userCode.getToken() != null && token.equals(userCode.getToken().getTokenValue());
  }
}
