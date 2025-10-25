// package com.mysite.auth_service.repository;

// import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
// import org.springframework.data.mongodb.repository.MongoRepository;

// import com.mysite.auth_service.model.OAuth2Authorization;
// import java.util.List;

// public interface OAuth2AuthorizationRepository extends MongoRepository<OAuth2Authorization, String> {

//     OAuth2Authorization findByTokenAndTokenType(String token, OAuth2TokenType tokenType);

//     List<OAuth2Authorization> findByToken(String token);
// }