package com.mysite.auth_service.configuration.user;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.mysite.auth_service.model.mongo.User;
import com.mysite.auth_service.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmailAddress) throws UsernameNotFoundException {
        // Attempt to find user by username
        User foundUser = this.userRepository.findByUsername(usernameOrEmailAddress);
        // If not found, attempt to find by email address
        if (foundUser == null) {
            foundUser = this.userRepository.findByEmailAddress(usernameOrEmailAddress);
        }

        // If still not found, throw UsernameNotFoundException
        if (foundUser == null) {
            throw new UsernameNotFoundException(
                String.format("User with username or email %s could not be found.", usernameOrEmailAddress)
            );
        }

        return new AdminUserDetails(foundUser);
    }
}