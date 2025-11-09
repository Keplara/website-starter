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
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import java.util.HashMap;
import java.util.Map;

import com.mysite.auth_service.configuration.user.CustomUserDetailsService;
import com.mysite.auth_service.configuration.user.UsernamePasswordAuthenticationProvider;
import com.mysite.auth_service.infastructure.RedisSessionTrackerService;
import com.mysite.auth_service.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class SecurityConfig {

	@Value("${local.authClientBaseUrl}")
	private String authClientBaseUrl;

	@Bean
	@Primary
	CustomUserDetailsService userDetailsService(UserRepository userRepository) {
		return new CustomUserDetailsService(userRepository);
	}

	@Bean
	PasswordEncoder customPasswordEncoder() {
		String idForEncode = "bcrypt";
		Map<String, PasswordEncoder> encoders = new HashMap<>();
		encoders.put(idForEncode, new BCryptPasswordEncoder());
		return new DelegatingPasswordEncoder("bcrypt", encoders);
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
		String StrippedAuthClientBaseUrl = authClientBaseUrl.replaceAll("/+$", "");
		return http
				.sessionManagement(
						sessionManagement -> sessionManagement.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
								.maximumSessions(5).maxSessionsPreventsLogin(true))
				.csrf(crsf -> crsf.disable())
				.authorizeHttpRequests((authorize) -> authorize
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers("auth/create-user/request").permitAll()
						.requestMatchers("auth/create-user/verify").permitAll()
						.requestMatchers("auth/create-user/confirm").permitAll()

						.requestMatchers("auth/password-reset/request").permitAll()
						.requestMatchers("auth/password-reset/verify").permitAll()
						.requestMatchers("auth//password-reset/confirm").permitAll()

						.requestMatchers("/send-test-email").permitAll()
						.requestMatchers("/test-mongo-record").permitAll()
						// .requestMatchers("/error").permitAll()
						.requestMatchers("/login").permitAll()
						.anyRequest().authenticated())
				.formLogin(formLogin -> {
					formLogin.loginProcessingUrl("/login");
					formLogin.loginPage(StrippedAuthClientBaseUrl + "/login");
					formLogin.usernameParameter("emailOrUsername");
					formLogin.passwordParameter("password");
					formLogin.failureHandler((request, response, authentication) -> {
						System.out.println("Login failed.");
						response.sendRedirect(StrippedAuthClientBaseUrl + "/login?error=true");
					});

					formLogin.successHandler((request, response, authentication) -> {
						String userId = authentication.getName();
						String sessionId = request.getSession().getId();
						redisSessionTrackerService.registerSession(userId, sessionId);
						System.out.println("Login succeeded.");
						response.setStatus(HttpServletResponse.SC_OK);
						response.getWriter().write("Login successful!");
						response.getWriter().flush();
					});
				})
				.logout(logout -> {
					logout.logoutUrl("/logout");
					logout.logoutSuccessUrl(StrippedAuthClientBaseUrl + "/login");
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