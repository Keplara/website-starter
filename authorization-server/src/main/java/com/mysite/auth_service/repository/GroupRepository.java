package com.mysite.auth_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.mysite.auth_service.model.mongo.Group;

public interface GroupRepository extends MongoRepository<Group, String> {

  @Query("{ 'memberIds': ?0 }")
  List<Group> findByMemberId(String userId);

  Group findByName(String name);
}
