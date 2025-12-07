package com.mysite.auth_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mysite.auth_service.model.mongo.Role;

public interface RoleRepository extends MongoRepository<Role, String> {

  Role findByName(String name);
}
