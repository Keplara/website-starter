package com.mysite.auth_service.configuration;

import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;

import com.mysite.auth_service.configuration.user.CustomUserDetailsService;
import com.mysite.auth_service.configuration.user.UsernamePasswordAuthenticationProvider;
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
			RedisSessionTrackerService redisSessionTrackerService) throws Exception {
		return http
				.sessionManagement(
						sessionManagement -> sessionManagement.sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
								.maximumSessions(5).maxSessionsPreventsLogin(true))
				.csrf(crsf -> crsf.disable())

				.authorizeHttpRequests((authorize) -> authorize
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/auth/create-user/request").permitAll()
						.requestMatchers(HttpMethod.GET, "/auth/create-user/verify").permitAll()
						.requestMatchers(HttpMethod.POST, "/auth/create-user/confirm").permitAll()
						.requestMatchers("/.well-known/**").permitAll()
						.requestMatchers("/css/**", "/js/**", "/assets/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/auth/password-reset/request").permitAll()
						.requestMatchers(HttpMethod.GET, "/auth/password-reset/verify").permitAll()
						.requestMatchers(HttpMethod.POST, "/auth/password-reset/confirm").permitAll()
						.requestMatchers(HttpMethod.POST, "/oauth2/authorize").permitAll()

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
						response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
						response.getWriter().write("Invalid credentials");
						response.getWriter().flush();
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
						String userId = authentication.getName();
						String sessionId = request.getSession().getId();
						redisSessionTrackerService.deregisterSession(userId, sessionId);
						System.out.println("Logout Succeeded.");
						response.setStatus(HttpServletResponse.SC_OK);
						response.getWriter().write("Logout successful");
						response.getWriter().flush();
					});
				})
				.build();
	}
}