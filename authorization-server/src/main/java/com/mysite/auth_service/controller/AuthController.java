package com.mysite.auth_service.controller;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mysite.auth_service.configuration.exceptions.AuthApiException;
import com.mysite.auth_service.configuration.responseObjects.BasicResponse;
import com.mysite.auth_service.model.mongo.User;
import com.mysite.auth_service.model.request.CreateUserRequest;
import com.mysite.auth_service.service.UserService;

import jakarta.validation.constraints.NotBlank;
import java.io.IOException;
import java.net.URISyntaxException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Map;

import javax.mail.MessagingException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@Validated
@RequestMapping("/auth")
public class AuthController {
	private final UserService userService;

	@Value("${local.authClientBaseUrl}")
	private String authClientBaseUrl;

	@Value("${local.companyName}")
	private String companyName;

	public AuthController(UserService userService) {
		this.userService = userService;
	}

	/*
	 * ===========================
	 * Password Reset Functionality
	 * ===========================
	 */
	/**
	 * Endpoint to initiate user creation by sending a verification email to the
	 * user.
	 * The user provides their email, username, and password, and the system
	 * generates
	 * a one-time token stored in Redis for user verification.
	 *
	 * Frontend flow:
	 * 1. User submits signup form with email, username, and password.
	 * 2. Backend generates token and stores it in Redis with expiration.
	 * 3. Verification email is sent with a magic link to confirm the user.
	 *
	 * @param userRequest The request body containing email, username, and
	 *                    password.
	 * @return BasicResponse indicating that the verification email has been sent.
	 * @throws AuthApiException If the email is already associated with an existing
	 *                          user.
	 * @throws IOException,     MessagingException, GeneralSecurityException If
	 *                          email sending fails.
	 */

	@PostMapping("/create-user/request")
	public BasicResponse createUserRequest(@RequestBody(required = false) CreateUserRequest userRequest)
			throws AuthApiException, IOException, MessagingException, GeneralSecurityException {
		Boolean isUserTokenCreated = userService.createUserRequest(userRequest, authClientBaseUrl);
		// If user token creation failed, throw an exception
		if (!isUserTokenCreated) {
			throw new AuthApiException("User token could not be created.");
		}

		return BasicResponse.builder()
				.message("Thank you for signing up with us! Please look out for an email to verify your user.")
				.status(HttpStatus.OK)
				.build();
	}

	@GetMapping("/create-user/verify")
	public ResponseEntity<Map<String, Object>> verifyUserCreationToken(@RequestParam String token)
			throws AuthApiException {
		return ResponseEntity
				.ok()
				.body(Map.of(
						"timestamp", LocalDateTime.now(),
						"valid", userService.verifyUserCreationToken(token),
						"message", "User does not exist."));
	}

	@PostMapping("/create-user/confirm")
	public ResponseEntity<Object> confirmUser(@RequestParam String token)
			throws AuthApiException, URISyntaxException {
		User createdUser = userService.confirmUserCreation(token, authClientBaseUrl);
		// create-user not work --- IGNORE ---
		return ResponseEntity
				.ok()
				.body(Map.of(
						"timestamp", LocalDateTime.now(),
						"message", String.format("User has been created for %s.", createdUser.getEmailAddress())));
	}

	/*
	 * ===========================
	 * Password Reset Functionality
	 * ===========================
	 */
	@PostMapping("/password-reset/request")
	public ResponseEntity<Object> PasswordResetRequest(
			@RequestParam(required = false) @NotBlank(message = "Username or Email Address must be set.") String emailOrUsername)
			throws AuthApiException {
		userService.passwordResetRequest(emailOrUsername, authClientBaseUrl);

		return ResponseEntity
				.ok()
				.body(Map.of(
						"timestamp", LocalDateTime.now(),
						"message",
						String.format("If an account with %s exists, a password reset email has been sent.", emailOrUsername)));
	}

	@GetMapping("/password-reset/verify")
	public ResponseEntity<Object> verifyPasswordResetToken(@RequestParam String token) throws AuthApiException {
		return ResponseEntity
				.ok()
				.body(Map.of(
						"timestamp", LocalDateTime.now(),
						"valid", userService.verifyPasswordResetToken(token),
						"message", "User does not exist."));
	}

	@PostMapping("/password-reset/confirm")
	public ResponseEntity<Object> passwordReset(@RequestParam String token,
			@RequestParam(name = "newPassword", required = false) @NotBlank(message = "newPassword must be set.") String newPassword)
			throws AuthApiException, URISyntaxException {
		String emailAddress = userService.confirmPasswordReset(token, newPassword);
		return ResponseEntity
				.ok()
				.body(Map.of(
						"timestamp", LocalDateTime.now(),
						"message", String.format("Password has been updated for %s", emailAddress)));
	}

	// Delete acccount
	/// Require scope user.user.delete
	/// only delete the user of the logged in user which is store in the redis
	// token
	/// // delete current session after delete user
	/// revoke access token

	/**
	 * Delete the currently logged-in user user.
	 * 
	 * Security:
	 * - Requires the scope 'SCOPE_user.user.delete'.
	 * - Only deletes the user of the authenticated user.
	 * 
	 * Steps:
	 * 1. Retrieve current user from security context / token.
	 * 2. Delete the user from the database.
	 * 3. Delete any active sessions from Redis.
	 * 4. Revoke the access token.
	 */
	@DeleteMapping("/user")
	@PreAuthorize("hasAuthority('SCOPE_user.user.delete')")
	public ResponseEntity<BasicResponse> deleteUser(@AuthenticationPrincipal UserDetails userDetails,
			@RequestHeader("Authorization") String authHeader) throws AuthApiException {
		userService.deleteUser(userDetails, authHeader);
		return ResponseEntity.ok(
				BasicResponse.builder()
						.message("Your user has been deleted successfully.")
						.status(HttpStatus.OK)
						.build());
	}

}
