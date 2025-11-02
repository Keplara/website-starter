package com.mysite.auth_service.model.mongo;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("test_mongo_record")

public class TestMongoRecord {
  @Indexed(unique = true)
  public String id;

  public String getId() {
    return this.id;
  }

  public String name;
  public Integer value;
}
