package com.mysite.auth_service.infastructure;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.lang.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.mysite.auth_service.model.PendingUser;
import com.mysite.auth_service.model.mongo.TestMongoRecord;
import com.mysite.auth_service.model.mongo.User;
import com.mysite.auth_service.repository.TestRecordsRepository;
import com.mysite.auth_service.repository.UserRepository;

@Service
public class MongoService {

  private final UserRepository userRepository;
  private final TestRecordsRepository testRecordsRepository;

  public MongoService(UserRepository userRepository,
      TestRecordsRepository testRecordsRepository) {
    this.userRepository = userRepository;
    this.testRecordsRepository = testRecordsRepository;
  }

  public Boolean saveMongoTestRecord(TestMongoRecord record) {
    Optional<TestMongoRecord> existingRecord = testRecordsRepository.findById(record.getId());
    if (existingRecord.isPresent()) {
      return false; // record exists
    }
    testRecordsRepository.save(record);
    return true;
  }

  public User createUser(PendingUser userData) {
    Collection<GrantedAuthority> authorities = List.of(
        new SimpleGrantedAuthority("SCOPE_product.read"),
        new SimpleGrantedAuthority("ROLE_USER"),
        new SimpleGrantedAuthority("SCOPE_auth.user.password-reset.create"),
        new SimpleGrantedAuthority("SCOPE_auth.user.account.update"),
        new SimpleGrantedAuthority("SCOPE_user.read"));
    userData.setAuthorities(authorities);
    User user = new User(userData);
    userRepository.save(user);
    return user;
  }

  public Boolean updateUserPassword(String emailOrUsername, String newPassword) {
    userRepository.updatePassword(emailOrUsername, newPassword);
    return true;
  }

  public User getUser(String usernameOrEmail) {
    User foundUserByUsername = this.userRepository.findByUsername(usernameOrEmail);
    User foundUserByEmailAddress = this.userRepository.findByEmailAddress(usernameOrEmail);

    if (foundUserByUsername != null) {
      return foundUserByUsername;
    } else {
      return foundUserByEmailAddress;
    }
  }

  public Boolean deleteUser(@NonNull String username) {
    Assert.hasText(username, "Username must not be null or empty");

    User user = getUser(username);
    String userId = user.getUserId();

    if (userId != null) {
      userRepository.deleteById(userId);
      return true;
    }
    return false;
  }
}
