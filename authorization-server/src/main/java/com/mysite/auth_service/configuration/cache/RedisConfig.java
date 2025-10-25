package com.mysite.auth_service.configuration.cache;

// import java.time.Duration;
// 
// import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
// import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
// import org.springframework.data.redis.serializer.JdkSerializationRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
// import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
// import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.session.data.redis.RedisIndexedSessionRepository;
import org.springframework.session.data.redis.RedisSessionExpirationStore;
// import org.springframework.session.data.redis.RedisSessionRepository;
import org.springframework.session.data.redis.SortedSetRedisSessionExpirationStore;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

// import com.mysite.auth_service.configuration.RedisRegisteredClientRepository;

import org.springframework.beans.factory.annotation.Value;



@Configuration
@EnableCaching
@EnableRedisHttpSession(maxInactiveIntervalInSeconds =60)
public class RedisConfig {

    @Value("${redis.username}")
    String username = "Grant";

    @Value("${redis.password}")
    String password = "Grant";

    @Value("${redis.host}")
    String host = "host.docker.internal";

    @Bean
    public JedisConnectionFactory jedisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(host); 
        config.setPort(6379);
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

    // @Bean
    // public RedisSessionRepository redisSessionRepository(RedisTemplate<String, Object> redisTemplate) {
    //     RedisSessionRepository repository = new RedisSessionRepository(redisTemplate);
    //     repository.setDefaultMaxInactiveInterval(Duration.ofMinutes(1));
    //     return repository;
    // }

	// @Bean
	// public RedisCacheManagerBuilderCustomizer myRedisCacheManagerBuilderCustomizer() {
	// 	return (builder) -> builder
    //     .withCacheConfiguration("spring:session:sessions:*",
    //          RedisCacheConfiguration
    //             .defaultCacheConfig()
    //                 .entryTtl(Duration.ofMinutes(1)));
	// }
}