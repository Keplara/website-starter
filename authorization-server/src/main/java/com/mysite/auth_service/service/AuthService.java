package com.mysite.auth_service.service;

import org.springframework.stereotype.Service;

import com.mysite.auth_service.model.mongo.User;
import com.mysite.auth_service.repository.UserRepository;

import java.util.List;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }
public Boolean createAdminUser(String username, String emailAddress, String password){
  String hashedPassword = passwordEncoder.encode(password);
  Collection<GrantedAuthority> authorities = List.of(
      new SimpleGrantedAuthority("ROLE_USER"),
      new SimpleGrantedAuthority("ROLE_ADMIN"),
      new SimpleGrantedAuthority("SCOPE_user.update"),
      new SimpleGrantedAuthority("SCOPE_user.read"),
      new SimpleGrantedAuthority("SCOPE_user.create"),
      new SimpleGrantedAuthority("SCOPE_user.delete"),
      new SimpleGrantedAuthority("SCOPE_product.read"),
      new SimpleGrantedAuthority("SCOPE_product.create"),
      new SimpleGrantedAuthority("SCOPE_product.delete"),
      new SimpleGrantedAuthority("SCOPE_product.update"));

  User user = new User(username, emailAddress, hashedPassword, authorities);
  userRepository.save(user);
  return true;
}
  public Boolean createUser(String username, String emailAddress, String password) {
    String hashedPassword = passwordEncoder.encode(password);
    Collection<GrantedAuthority> authorities = List.of(
        new SimpleGrantedAuthority("SCOPE_product.read"),
        new SimpleGrantedAuthority("ROLE_USER"),
        new SimpleGrantedAuthority("SCOPE_user.read"));

    User user = new User(username, emailAddress, hashedPassword, authorities);
    userRepository.save(user);
    return true;
  }

  public User updateUserPassword(String emailOrUsername, String newPassword){
    String hashedPassword = passwordEncoder.encode(newPassword);
    userRepository.updatePassword(emailOrUsername, hashedPassword);
    return getUser(emailOrUsername);
  }

  public String findUserId(String userName, String email) {
    return "";
  }

  public User getUser(String username) {
    User foundUserByUsername = this.userRepository.findByUsername(username);
    User foundUserByEmailAddress = this.userRepository.findByEmailAddress(username);

    if (foundUserByUsername != null) {
      return foundUserByUsername;
    } else {
      return foundUserByEmailAddress;
    }
  }

}
