package com.adoptionplatform.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class DataSourceStartupLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSourceStartupLogger.class);

    private final DataSource dataSource;

    public DataSourceStartupLogger(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            String url = connection.getMetaData().getURL();
            log.info("Connected database: {}", url);
            if (url.contains("localhost") || url.contains("127.0.0.1")) {
                log.warn(
                        "Backend is using LOCAL MySQL — Railway users will show 'Account not found'. "
                                + "Stop the app, remove SPRING_DATASOURCE_URL=localhost from IntelliJ Run config, "
                                + "or run: ./start-backend.sh");
            } else if (url.contains("rlwy.net") || url.contains("railway")) {
                log.info("Railway MySQL connection OK.");
            }
        }
    }
}
