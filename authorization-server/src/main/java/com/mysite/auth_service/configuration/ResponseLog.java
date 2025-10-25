package com.mysite.auth_service.configuration;


import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class ResponseLog {
    
    private LocalDateTime dateTime;
    private String message;
    private HttpStatus httpStatus;
    private Object body;
    
    public ResponseLog(Object body, String message, HttpStatus httpStatus) {
        this.message = message;
        this.body = body;
        this.httpStatus = httpStatus;
        this.dateTime = LocalDateTime.now();
    }

    public ResponseLog(Object body, HttpStatus httpStatus) {
        this.body = body;
        this.httpStatus = httpStatus;
        this.dateTime = LocalDateTime.now();
    }

    public ResponseLog(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
        this.dateTime = LocalDateTime.now();
    }

    public ResponseEntity<Object> getResponse(){
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("message", message);
        map.put("body", body);
        map.put("status", httpStatus.value());
        map.put("dateTime", dateTime.toString());

        return new ResponseEntity<Object>(map, httpStatus);
    }
}