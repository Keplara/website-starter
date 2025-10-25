package com.mysite.auth_service.controller;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mysite.auth_service.service.SimpleEmailService;
import com.mysite.auth_service.configuration.ResponseLog;
import com.mysite.auth_service.configuration.exceptions.AuthApiException;
import com.mysite.auth_service.configuration.responseObjects.BasicResponse;
import com.mysite.auth_service.model.jwt.AccountToken;
import com.mysite.auth_service.model.jwt.ResetPasswordToken;
import com.mysite.auth_service.model.mongo.User;
import com.mysite.auth_service.model.request.CreateAccountRequest;
import com.mysite.auth_service.service.AuthService;
import com.mysite.auth_service.service.RedisTokenService;
import com.mysite.auth_service.service.TokenService;

import jakarta.validation.constraints.NotBlank;
import java.io.IOException;
import java.net.URISyntaxException;
import java.security.GeneralSecurityException;
import javax.mail.MessagingException;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@Validated
public class AuthController {
	private final AuthService authService;
	private final TokenService tokenService;
	private final SimpleEmailService simpleEmailService;

	private RedisTemplate<String, String> redisTemplate;

	private PasswordEncoder passwordEncoder;

	private RedisTokenService redisTokenService;

	public AuthController(RedisTokenService redisTokenService, RedisTemplate<String, String> redisTemplate,
			PasswordEncoder passwordEncoder, SimpleEmailService simpleEmailService, AuthService authService,
			TokenService tokenService) {
		this.authService = authService;
		this.redisTemplate = redisTemplate;
		this.tokenService = tokenService;
		this.simpleEmailService = simpleEmailService;
		this.passwordEncoder = passwordEncoder;
		this.redisTokenService = redisTokenService;
	}

	@GetMapping("test-authenticated")
	public String sendTestAuthenticated() throws AuthApiException {
		return "Authenticated Success";
	}

	@GetMapping("test-unauthenticated")
	public String sendTestUnauthenticated() throws AuthApiException {
		this.simpleEmailService.sendEmail("grantmitchell@mysite.com", "First Email Subject",
				"<div><img src=\"https://avatars.githubusercontent.com/u/154090351?s=200&v=4\"><h2>Test Email Succeeds!</h2></div>");
		return "Unauthenticated Success";
	}

	@PostMapping("send-test-email")
	public String sendTestEmail() throws AuthApiException {
		this.simpleEmailService.sendEmail("grantmitchell@mysite.com", "First Email Subject",
				"<div><img src=\"https://avatars.githubusercontent.com/u/154090351?s=200&v=4\"><h2>Test Email Succeeds!</h2></div>");
		return "Email sent successfully!";
	}

	@ExceptionHandler(value = { AuthApiException.class })
	protected ResponseEntity<String> handleExceptions(AuthApiException ex) {
		return new ResponseEntity<String>(ex.getMessage(), HttpStatus.BAD_REQUEST);
	}
	// Needs to be refactored

	@PostMapping("/create-account")
	public BasicResponse createAccount(@RequestBody(required = false) CreateAccountRequest accountRequest)
			throws AuthApiException, IOException, MessagingException, GeneralSecurityException {
		User existingUserByEmail = authService.getUser(accountRequest.getEmailAddress());

		if (existingUserByEmail != null) {
			throw new AuthApiException(
					String.format("User with email '%s' already exists.", existingUserByEmail.getEmailAddress()));
		} else {
			String accountJwtToken = tokenService.createAccountToken(accountRequest.getEmailAddress(),
					accountRequest.getPassword(), accountRequest.getUsername());
			simpleEmailService.sendEmail(accountRequest.getEmailAddress(), "Create Account",
					"Click the link below to create your account. Once you click the link you will be redirected to mysite.com as a signed in user. Thank you for signing up with us today! \n \n https://accounts.mysite.com/verify-new-account?token="
							+ accountJwtToken);
			return BasicResponse.builder()
					.message("Thank you for signing up with us! Please look out for an email to verify your account.")
					.status(HttpStatus.OK).build();
		}
	}

	@PostMapping("/verify-new-account")
	public ResponseEntity<Object> verifyAccount(@RequestBody String token) throws AuthApiException, URISyntaxException {
		AccountToken account = tokenService.parseAccountToken(token);
		User existingUser = authService.getUser(account.getUsername());
		if (existingUser != null) {
			throw new AuthApiException(String.format("User '%s' has already been created.", existingUser.getUserId()));
		}
		authService.createUser(account.getUsername(), account.getEmailAddress(), account.getPassword());

		ResponseLog response = new ResponseLog(String.format("Account has been created for %s.", account.getEmailAddress()),
				HttpStatus.OK);
		simpleEmailService.sendEmail(account.getEmailAddress(), "Welcome to MySite!",
				"Thank you for joining us in our journey in a healthy world!");

		return response.getResponse();
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<Object> forgotPassword(
			@RequestParam(required = false) @NotBlank(message = "Username or Email Address must be set.") String emailOrUsername)
			throws AuthApiException {
		User existingUser = authService.getUser(emailOrUsername);
		if (existingUser == null) {
			throw new AuthApiException(String.format("User does not exist."));
		}
		String resetPasswordToken = tokenService.createResetPasswordToken(emailOrUsername);
		redisTokenService.addToken(resetPasswordToken);
		ResponseLog response = new ResponseLog(String.format("Email has been sent with a verification token."),
				HttpStatus.OK);
		simpleEmailService.sendEmail(existingUser.getEmailAddress(), "Password Reset",
				"Please click the link below to reset your password. \n https://accounts.mysite.com/update-password?token="
						+ resetPasswordToken);

		return response.getResponse();
	}

	@PostMapping("/reset-password")
	public ResponseEntity<Object> resetPassword(@RequestBody String token,
			@RequestParam(name = "newPassword", required = false) @NotBlank(message = "newPassword must be set.") String newPassword)
			throws AuthApiException, URISyntaxException {
		if (!redisTokenService.isTokenActive(token)) {
			throw new AuthApiException("Token has expired");
		}
		;

		ResetPasswordToken resetPasswordToken = tokenService.parseResetPasswordToken(token);
		System.out.println(resetPasswordToken.getEmailOrUsername());
		User updatedUser = authService.updateUserPassword(resetPasswordToken.getEmailOrUsername(), newPassword);
		redisTokenService.expireToken(token);

		// if user already updated their password make token expire.
		ResponseLog response = new ResponseLog(
				String.format("Password has been updated for %s", updatedUser.getEmailAddress()), HttpStatus.OK);
		simpleEmailService.sendEmail(updatedUser.getEmailAddress(), "Your password has been updated :)",
				"If this isn't you please contact us so we can help resolve the issue.");

		return response.getResponse();
	}

	// Create Auth Client
	// Create Admin Client
	// Create login on the Main Client

	// @PreAuthorize("hasAuthority('SCOPE_admin.user.create')")
	@PostMapping("/create-admin-account")
	public String createAdminAccount(@RequestBody(required = false) CreateAccountRequest accountRequest)
			throws AuthApiException, IOException, MessagingException, GeneralSecurityException {
		User existingUserByEmail = authService.getUser(accountRequest.getEmailAddress());

		if (existingUserByEmail != null) {
			throw new AuthApiException(
					String.format("Admin User with email '%s' already exists.", existingUserByEmail.getEmailAddress()));
		} else {
			String accountJwtToken = tokenService.createAccountToken(accountRequest.getEmailAddress(),
					accountRequest.getPassword(), accountRequest.getUsername());
			simpleEmailService.sendEmail(accountRequest.getEmailAddress(), "Create Account",
					"Click the link below to create your account. Once you click the link you will be redirected to mysite.com as a signed in user. Thank you for signing up with us today! \n \n https://accounts.mysite.com/verify-new-account?token="
							+ accountJwtToken);
			return accountJwtToken;
		}
	}

	// @PreAuthorize("hasAuthority('SCOPE_admin.user.create')")
	@PostMapping("/verify-new-admin-account")
	public ResponseEntity<Object> verifyAdminAccount(@RequestBody String token)
			throws AuthApiException, URISyntaxException {
		AccountToken account = tokenService.parseAccountToken(token);
		User existingUser = authService.getUser(account.getUsername());
		if (existingUser != null) {
			throw new AuthApiException(String.format("User '%s' has already been created.", existingUser.getUserId()));
		}
		authService.createAdminUser(account.getUsername(), account.getEmailAddress(), account.getPassword());

		ResponseLog response = new ResponseLog(String.format("Account has been created for %s.", account.getEmailAddress()),
				HttpStatus.OK);
		simpleEmailService.sendEmail(account.getEmailAddress(), "Welcome to MySite!",
				"Thank you for joining us in our journey in a healthy world!");

		return response.getResponse();
	}

	// // authorization client calls
	// @PostMapping("/login")
	// public Boolean login(@RequestBody LoginRequest loginRequest) throws
	// AuthenticationException, AuthApiException, MalformedURLException {
	// User user = authService.getUser(loginRequest.getUsername());
	// if (user == null){
	// throw new AuthApiException("User does not exist, please verify the
	// credentials you are entering are correct.");
	// }

	// String encryptedPasswordFromDatabase = user.getPassword(); // Assuming
	// getPassword() returns the encrypted password

	// boolean passwordMatch = passwordEncoder.matches(loginRequest.getPassword(),
	// encryptedPasswordFromDatabase);

	// if (!passwordMatch) {
	// throw new AuthApiException("Invalid username or password."); // or return an
	// error message indicating invalid credentials
	// }

	// // send back redirect uri
	// return true;
	// }

	// @PutMapping("/logout/{userId}")
	// public void logout(Authentication authentication) {
	// // remove reddis token attached to user.
	// }

}
