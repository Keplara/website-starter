package com.mysite.auth_service.configuration;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.util.Assert;

import java.util.Set;


public class RedisRegisteredClientRepository implements RegisteredClientRepository {

    private static final String REGISTERED_CLIENT_PREFIX = "registered_client:";

    private final ValueOperations<String, RegisteredClient> valueOperations;
    private final RedisTemplate<String, RegisteredClient> redisTemplate;

    public RedisRegisteredClientRepository(RedisTemplate<String, RegisteredClient> redisTemplate, 
                                           RegisteredClient... registrations) {
        this.redisTemplate = redisTemplate;
        this.valueOperations = redisTemplate.opsForValue();
        Assert.notEmpty(registrations, "registrations cannot be empty");

        for (RegisteredClient registration : registrations) {
            Assert.notNull(registration, "registration cannot be null");
            save(registration);
        }
    }

    // New method to remove a registered client by ID
    public void remove(String id) {
        Assert.hasText(id, "id cannot be empty");
        redisTemplate.delete(REGISTERED_CLIENT_PREFIX + id);
    }

    // New method to remove a registered client by client ID
    public void removeByClientId(String clientId) {
        Assert.hasText(clientId, "clientId cannot be empty");

        Set<String> keys = redisTemplate.keys(REGISTERED_CLIENT_PREFIX + "*");
        if (keys != null) {
            for (String key : keys) {
                RegisteredClient registeredClient = valueOperations.get(key);

                if (registeredClient != null && clientId.equals(registeredClient.getClientId())) {
                    redisTemplate.delete(key);
                }
            }
        }
    }

    @Override
    public void save(RegisteredClient registeredClient) {

        Assert.notNull(registeredClient, "registeredClient cannot be null");
        
        removeByClientId(registeredClient.getClientId());

        assertUniqueIdentifiers(registeredClient);
        
        valueOperations.set(REGISTERED_CLIENT_PREFIX + registeredClient.getId(), registeredClient);
    }

    @Override
    public RegisteredClient findById(String id) {
        Assert.hasText(id, "id cannot be empty");
        return valueOperations.get(REGISTERED_CLIENT_PREFIX + id);
    }

    @Override
    public RegisteredClient findByClientId(String clientId) {
        Assert.hasText(clientId, "clientId cannot be empty");

        Set<String> keys = redisTemplate.keys(REGISTERED_CLIENT_PREFIX + "*");
        if (keys != null) {
            for (String key : keys) {
                RegisteredClient registeredClient = valueOperations.get(key);
                if (registeredClient != null && clientId.equals(registeredClient.getClientId())) {
                    return registeredClient;
                }
            }
        }
        System.out.println("Registered client not found for clientId: " + clientId);
        return null;
    }

    private void assertUniqueIdentifiers(RegisteredClient registeredClient) {
        RegisteredClient existingById = findById(registeredClient.getId());
        if (existingById != null) {
            throw new IllegalArgumentException("Registered client must be unique. " +
                    "Found duplicate identifier: " + registeredClient.getId());
        }

        RegisteredClient existingByClientId = findByClientId(registeredClient.getClientId());
        if (existingByClientId != null) {
            throw new IllegalArgumentException("Registered client must be unique. " +
                    "Found duplicate client identifier: " + registeredClient.getClientId());
        }
    }
}