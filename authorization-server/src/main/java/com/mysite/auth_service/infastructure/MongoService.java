package com.mysite.auth_service.infastructure;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.mysite.auth_service.model.PendingUser;
import com.mysite.auth_service.model.mongo.Group;
import com.mysite.auth_service.model.mongo.Role;
import com.mysite.auth_service.model.mongo.TestMongoRecord;
import com.mysite.auth_service.model.mongo.User;
import com.mysite.auth_service.repository.GroupRepository;
import com.mysite.auth_service.repository.RoleRepository;
import com.mysite.auth_service.repository.TestRecordsRepository;
import com.mysite.auth_service.repository.UserRepository;

@Service
public class MongoService {

  private final UserRepository userRepository;
  private final TestRecordsRepository testRecordsRepository;
  private final GroupRepository groupRepository;
  private final RoleRepository roleRepository;

  public MongoService(UserRepository userRepository,
      TestRecordsRepository testRecordsRepository,
      GroupRepository groupRepository,
      RoleRepository roleRepository) {
    this.userRepository = userRepository;
    this.testRecordsRepository = testRecordsRepository;
    this.groupRepository = groupRepository;
    this.roleRepository = roleRepository;
  }

  public Boolean saveMongoTestRecord(@NonNull TestMongoRecord record) {
    String recordId = record.getId();
    if (recordId != null) {
      Optional<TestMongoRecord> existingRecord = testRecordsRepository.findById(recordId);
      if (existingRecord.isPresent()) {
        return false; // record exists
      }
      testRecordsRepository.save(record);
      return true;
    } else {
      throw new IllegalArgumentException("Record ID must not be null");
    }
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

  /**
   * Get all group names for a user
   */
  public List<String> getUserGroups(String userId) {
    List<Group> groups = groupRepository.findByMemberId(userId);
    return groups.stream()
        .map(Group::getName)
        .collect(Collectors.toList());
  }

  /**
   * Get role by ID
   */
  public Role getRole(@NonNull String roleId) {
    return roleRepository.findById(roleId).orElse(null);
  }

  /**
   * Get role by name
   */
  public Role getRoleByName(String roleName) {
    return roleRepository.findByName(roleName);
  }

  /**
   * Get all scopes for a role
   */
  public Set<String> getRoleScopes(@NonNull String roleId) {
    Role role = roleRepository.findById(roleId).orElse(null);
    if (role != null && role.getScopes() != null) {
      return new HashSet<>(role.getScopes());
    }
    return new HashSet<>();
  }

  /**
   * Get all scopes from user's groups
   */
  public Set<String> getUserGroupScopes(String userId) {
    List<Group> groups = groupRepository.findByMemberId(userId);
    Set<String> allScopes = new HashSet<>();

    for (Group group : groups) {
      // Add scopes directly from group
      if (group.getScopes() != null) {
        allScopes.addAll(group.getScopes());
      }

      // Add scopes from roles in the group
      if (group.getRoleIds() != null) {
        for (String roleId : group.getRoleIds()) {
          if (roleId != null) {
            allScopes.addAll(getRoleScopes(roleId));
          }
        }
      }
    }

    return allScopes;
  }

  /**
   * Get all roles from user's groups
   */
  public List<String> getUserGroupRoles(String userId) {
    List<Group> groups = groupRepository.findByMemberId(userId);
    Set<String> roleNames = new HashSet<>();

    for (Group group : groups) {
      if (group.getRoleIds() != null) {
        for (String roleId : group.getRoleIds()) {
          if (roleId != null) {

            Role role = getRole(roleId);
            if (role != null) {
              roleNames.add(role.getName());
            }
          }
        }
      }
    }

    return new ArrayList<>(roleNames);
  }
}
