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
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.data.redis.RedisIndexedSessionRepository;
import org.springframework.session.data.redis.RedisSessionExpirationStore;
import org.springframework.session.data.redis.SortedSetRedisSessionExpirationStore;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableCaching
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 60)
public class RedisConfig {

    @Value("${redis.username}")
    String username = "Supervisor";

    @Value("${redis.password}")
    String password = "Supervisor";

    @Value("${redis.host}")
    String host = "host.docker.internal";

    @Value("${redis.port}")
    Integer port = 6379;

    @Value("${local.session.timeout}")
    Duration sessionExpiration;

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
    public RedisTemplate<String, RegisteredClient> redisTemplate(JedisConnectionFactory jedisConnectionFactory) {
        RedisTemplate<String, RegisteredClient> template = new RedisTemplate<>();
        template.setConnectionFactory(jedisConnectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
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