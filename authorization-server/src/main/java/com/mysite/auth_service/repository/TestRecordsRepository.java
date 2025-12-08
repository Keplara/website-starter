package com.mysite.auth_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mysite.auth_service.model.mongo.TestMongoRecord;

public interface TestRecordsRepository extends MongoRepository<TestMongoRecord, String> {

    // You can add other custom queries here if needed
    // e.g., findBySomeField(String value);
}