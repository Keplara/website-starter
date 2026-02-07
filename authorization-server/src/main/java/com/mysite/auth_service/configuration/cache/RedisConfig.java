package com.mysite.auth_service.configuration.cache;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.lang.NonNull;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.session.data.redis.RedisIndexedSessionRepository;
import org.springframework.session.data.redis.RedisSessionExpirationStore;
import org.springframework.session.data.redis.SortedSetRedisSessionExpirationStore;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

import org.springframework.beans.factory.annotation.Value;

// move reset password over to user resource server.
@Configuration
@EnableCaching
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800)
public class RedisConfig {

    @Value("${redis.username}")
    String username = "Supervisor";

    @Value("${redis.password}")
    String password = "Supervisor";

    @Value("${redis.host}")
    @NonNull
    String host = "host.docker.internal";

    @Value("${redis.port}")
    Integer port = 6379;

    @Bean
    public JedisConnectionFactory jedisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(host);
        config.setPort(port);
        config.setDatabase(0);
        config.setUsername(username);
        config.setPassword(password);
        return new JedisConnectionFactory(config);
    }

    @Bean
    public RedisTemplate<String, RegisteredClient> redisRegisteredClientTemplate(
            JedisConnectionFactory jedisConnectionFactory) {
        RedisTemplate<String, RegisteredClient> template = new RedisTemplate<>();
        template.setConnectionFactory(jedisConnectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.afterPropertiesSet();

        return template;
    }

    @Bean
    public RedisTemplate<String, OAuth2Authorization> redisOAuth2AuthorizationTemplate(
            JedisConnectionFactory jedisConnectionFactory) {
        RedisTemplate<String, OAuth2Authorization> template = new RedisTemplate<>();
        template.setConnectionFactory(jedisConnectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.afterPropertiesSet();

        return template;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(JedisConnectionFactory jedisConnectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();

        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setConnectionFactory(jedisConnectionFactory);
        template.afterPropertiesSet();

        return template;
    }

    @Bean
    public RedisSessionExpirationStore redisSessionExpirationStore(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setKeySerializer(RedisSerializer.string());
        redisTemplate.setHashKeySerializer(RedisSerializer.string());
        redisTemplate.setConnectionFactory(redisConnectionFactory);
        redisTemplate.afterPropertiesSet();
        return new SortedSetRedisSessionExpirationStore(redisTemplate, RedisIndexedSessionRepository.DEFAULT_NAMESPACE);
    }

}