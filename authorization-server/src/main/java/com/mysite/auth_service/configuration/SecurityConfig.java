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
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import java.util.HashMap;
import java.util.Map;

import com.mysite.auth_service.configuration.user.CustomUserDetailsService;
import com.mysite.auth_service.configuration.user.UsernamePasswordAuthenticationProvider;
// import com.mysite.auth_service.repository.UserRepository;
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
	// control sessions in the cache


	@Bean
	SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http, AuthenticationManagerBuilder authManager,
			CustomUserDetailsService userDetailsService, PasswordEncoder sharedPasswordEncoder) throws Exception {
				// once access token has been given invalidate session on redis 
		return http
				.csrf(crsf-> crsf.disable())
				.authorizeHttpRequests((authorize) -> authorize
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.requestMatchers("/create-account").permitAll()
				.requestMatchers("/send-test-email").permitAll()
				.requestMatchers("/error").permitAll()
				.requestMatchers("/login").permitAll()
				.anyRequest().authenticated())
				.formLogin(formLogin -> {
					formLogin.loginProcessingUrl("/login");
					formLogin.loginPage("http://localhost:8082/login");
					formLogin.usernameParameter("emailOrUsername");
					formLogin.passwordParameter("password");
					formLogin.failureHandler((request, response, authentication) -> {
						System.out.println("Login failed.");
						response.sendRedirect("http://localhost:8082/login");
					});
					
					formLogin.successHandler((request, response, authentication) -> {
						System.out.println("Login succeeded.");
						response.setStatus(HttpServletResponse.SC_OK);
						response.getWriter().write("Login successful!");
						response.getWriter().flush();
					});
				})
				.sessionManagement(httpSecuritySessionManagementConfigurer -> httpSecuritySessionManagementConfigurer.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
				.logout(logout -> {
					logout.logoutUrl("/logout");
					logout.logoutSuccessUrl("http://localhost:8082/login");
					logout.invalidateHttpSession(true);
					logout.clearAuthentication(true);
					logout.deleteCookies("JSESSIONID");
					logout.logoutSuccessHandler((request, response, authentication) -> {
						System.out.println("Logout Succeeded.");
						response.setStatus(HttpServletResponse.SC_OK);
						response.getWriter().write("Logout successful");
						response.getWriter().flush();
					});
				})
				.build();
	}
}