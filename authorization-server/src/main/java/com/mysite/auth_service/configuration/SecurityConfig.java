package com.mysite.auth_service.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import com.mysite.auth_service.configuration.user.CustomUserDetailsService;
import com.mysite.auth_service.configuration.user.UsernamePasswordAuthenticationProvider;
import com.mysite.auth_service.infastructure.RedisOAuth2Service;
import com.mysite.auth_service.infastructure.RedisSessionTrackerService;
import com.mysite.auth_service.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class SecurityConfig {

	@Bean
	@Primary
	CustomUserDetailsService userDetailsService(UserRepository userRepository) {
		return new CustomUserDetailsService(userRepository);
	}

	// @Bean
	// PasswordEncoder customPasswordEncoder() {
	// String idForEncode = "bcrypt";
	// Map<String, PasswordEncoder> encoders = new HashMap<>();
	// encoders.put(idForEncode, new BCryptPasswordEncoder());
	// return new DelegatingPasswordEncoder(idForEncode, encoders);
	// }

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	AuthenticationManager authenticationManager(
			CustomUserDetailsService userDetailsService, PasswordEncoder sharedPasswordEncoder) {
		UsernamePasswordAuthenticationProvider authenticationProvider = new UsernamePasswordAuthenticationProvider(
				userDetailsService, sharedPasswordEncoder);
		return new ProviderManager(authenticationProvider);
	}

	@Bean
	SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http, AuthenticationManagerBuilder authManager,
			CustomUserDetailsService userDetailsService, PasswordEncoder sharedPasswordEncoder,
			RedisSessionTrackerService redisSessionTrackerService,
			RedisOAuth2Service authorizationService)
			throws Exception {

		return http
				.sessionManagement(
						sessionManagement -> sessionManagement.sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
								.maximumSessions(5).maxSessionsPreventsLogin(true))
				.csrf(crsf -> crsf.disable())

				.authorizeHttpRequests((authorize) -> authorize
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						// .requestMatchers(HttpMethod.POST, "/auth/create-user/request").permitAll()
						// .requestMatchers(HttpMethod.GET, "/auth/create-user/verify").permitAll()
						// .requestMatchers(HttpMethod.POST, "/auth/create-user/confirm").permitAll()
						.requestMatchers("/.well-known/**").permitAll()
						.requestMatchers("/css/**", "/js/**", "/assets/**").permitAll()
						// TODO: Migrate password reset endpoints to user resource server
						// .requestMatchers(HttpMethod.POST, "/auth/password-reset/request").permitAll()
						// .requestMatchers(HttpMethod.GET, "/auth/password-reset/verify").permitAll()
						// .requestMatchers(HttpMethod.POST, "/auth/password-reset/confirm").permitAll()
						.requestMatchers(HttpMethod.POST, "/oauth2/authorize").permitAll()
						.requestMatchers("/.well-known/jwks.json").permitAll()
						// TODO: Migrate IAM User creation and role assumption to IAM service
						// .requestMatchers(HttpMethod.POST,
						// "/auth/iam/create-user/request").hasRole("ROOT")
						// .requestMatchers(HttpMethod.POST, "/auth/roles/assume").authenticated()
						.requestMatchers("/send-test-email").permitAll()
						.requestMatchers("/test-mongo-record").permitAll()
						.requestMatchers("/error", "/error/**").permitAll()
						.requestMatchers("/login", "/register", "/verify", "/reset-password").permitAll()
						.requestMatchers("/", "/index.html", "/*.js", "/*.css", "/*.ico", "/*.png", "/*.jpg", "/*.svg")
						.permitAll()
						.anyRequest().authenticated())
				.formLogin(formLogin -> {

					formLogin.loginProcessingUrl("/login");
					formLogin.loginPage("/login");
					formLogin.usernameParameter("emailOrUsername");
					formLogin.passwordParameter("password");

					formLogin.failureHandler((request, response, authentication) -> {
						System.out.println("Login failed.");
						String ajaxHeader = request.getHeader("X-Requested-With");
						boolean isAjax = "XMLHttpRequest".equals(ajaxHeader);

						if (isAjax) {
							response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
							response.setContentType("application/json");
							response.setCharacterEncoding("UTF-8");
							response.getWriter().write("{\"error\":\"Invalid credentials\"}");
							response.getWriter().flush();
						} else {
							response.sendRedirect(request.getContextPath() + "/login?error=true&message=Invalid+credentials");
						}
					});
					formLogin.successHandler((request, response, authentication) -> {
						try {
							String userId = authentication.getName();
							String sessionId = request.getSession().getId();
							System.out.println("Login succeeded. UserId: " + userId + ", SessionId: " + sessionId);
							redisSessionTrackerService.registerSession(userId, sessionId);
							System.out.println("Session registered successfully.");
						} catch (Exception e) {
							System.err.println("Failed to register session: " + e.getMessage());
							e.printStackTrace();
						}

						// Check if this is an AJAX request
						String ajaxHeader = request.getHeader("X-Requested-With");
						boolean isAjax = "XMLHttpRequest".equals(ajaxHeader);

						// Get the saved OAuth request from session
						SavedRequest savedRequest = new HttpSessionRequestCache().getRequest(request, response);

						if (isAjax) {
							// For AJAX requests, return the redirect URL as JSON
							response.setStatus(HttpServletResponse.SC_OK);
							response.setContentType("application/json");
							response.setCharacterEncoding("UTF-8");

							if (savedRequest != null) {
								// OAuth flow - return the saved OAuth authorization URL
								String redirectUrl = savedRequest.getRedirectUrl();
								response.getWriter().write("{\"redirectUrl\":\"" + redirectUrl + "\"}");
							} else {
								// No saved request - normal login, return empty response
								response.getWriter().write("{}");
							}
							response.getWriter().flush();
						} else {
							// For normal form submissions, use standard redirect behavior
							SavedRequestAwareAuthenticationSuccessHandler successHandler = new SavedRequestAwareAuthenticationSuccessHandler();
							successHandler.setDefaultTargetUrl("/");
							successHandler.onAuthenticationSuccess(request, response, authentication);
						}
					});
				})
				.logout(logout -> {
					logout.logoutUrl("/logout");
					logout.logoutSuccessUrl("/login");
					logout.invalidateHttpSession(true);
					logout.clearAuthentication(true);
					logout.deleteCookies("JSESSIONID");

					logout.logoutSuccessHandler((request, response, authentication) -> {
						String authHeader = request.getHeader("Authorization");
						if (authHeader == null) {
							response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
							response.setContentType("application/json");
							response.setCharacterEncoding("UTF-8");
							response.getWriter().write("{\"success\":\"" + false + "\"}");
							response.getWriter().flush();
						}
						// If Bearer token is present, revoke the token
						if (authHeader != null && authHeader.startsWith("Bearer ")) {
							String token = authHeader.substring("Bearer ".length());
							OAuth2Authorization authorization = authorizationService.findByToken(token, null);
							System.out.println("Revoking token for logout: " + token);
							if (authorization != null) {
								authorizationService.remove(authorization);
							}
						}
						String userId = authentication != null ? authentication.getName() : null;
						String sessionId = request.getSession(false) != null ? request.getSession(false).getId() : null;
						if (userId != null && sessionId != null) {
							redisSessionTrackerService.deregisterSession(userId, sessionId);
						}
						if (authHeader != null) {

							System.out.println("Logout Succeeded.");
							response.setStatus(HttpServletResponse.SC_OK);
							response.setContentType("application/json");
							response.setCharacterEncoding("UTF-8");
							response.getWriter().write("{\"success\":\"" + true + "\"}");
							response.getWriter().flush();
						}

					});
				})
				.build();
	}
}