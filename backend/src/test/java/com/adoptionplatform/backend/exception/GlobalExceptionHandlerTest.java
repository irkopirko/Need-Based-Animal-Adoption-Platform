package com.adoptionplatform.backend.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void mapsIllegalArgumentToBadRequest() {
        ResponseEntity<Map<String, String>> response =
                handler.handleIllegalArgument(new IllegalArgumentException("Invalid input"));
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().get("error").contains("Invalid"));
    }

    @Test
    void mapsForbiddenException() {
        ResponseEntity<Map<String, String>> response =
                handler.handleApiException(new ForbiddenException("Not allowed"));
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    void mapsNotFoundException() {
        ResponseEntity<Map<String, String>> response =
                handler.handleApiException(new ResourceNotFoundException("Missing"));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
