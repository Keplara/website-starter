package com.mysite.auth_service.configuration.responseObjects;

import java.io.Serializable;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BasicResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private HttpStatus status;
    private String message;
        
    @Builder.Default
    private LocalDateTime date = LocalDateTime.now();


    /**
     * Maps the provided object to JSON and sets it as the message.
     *
     * @param object the object to map to JSON
     * @return the updated BasicResponse instance
     */
    public static BasicResponse fromObject(HttpStatus status, Object object) {
        ObjectMapper objectMapper = new ObjectMapper();
        String jsonMessage;

        try {
            jsonMessage = objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            jsonMessage = "Error serializing object to JSON: " + e.getMessage();
        }

        return BasicResponse.builder()
                .status(status)
                .message(jsonMessage)
                .date(LocalDateTime.now())
                .build();
    }
}