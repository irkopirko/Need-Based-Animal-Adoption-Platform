package com.adoptionplatform.backend.config;

import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class DatabaseConnectionInfo {

    private final DataSource dataSource;

    public DatabaseConnectionInfo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public String getKind() {
        try (Connection connection = dataSource.getConnection()) {
            String url = connection.getMetaData().getURL().toLowerCase();
            if (url.contains("rlwy.net") || url.contains("railway")) {
                return "railway";
            }
            if (url.contains("localhost") || url.contains("127.0.0.1")) {
                return "local";
            }
            return "other";
        } catch (Exception ex) {
            return "unknown";
        }
    }
}
