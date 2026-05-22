package com.adoptionplatform.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * IntelliJ or shell sometimes sets SPRING_DATASOURCE_URL to localhost — that DB only has test users.
 * Unless app.allow-local-db=true, force the Railway URL from application.properties defaults.
 */
public class RailwayDatasourceEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String RAILWAY_JDBC =
            "jdbc:mysql://monorail.proxy.rlwy.net:29128/railway?useSSL=true&requireSSL=true&serverTimezone=Europe/Istanbul";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if ("true".equalsIgnoreCase(environment.getProperty("app.allow-local-db"))) {
            return;
        }

        String url = environment.getProperty("spring.datasource.url", "");
        if (!isLocalDatasource(url)) {
            return;
        }

        String password = environment.getProperty("spring.datasource.password", "BdnElCroOfUEQvHnRnBxDUIWVMWhVDLg");
        String username = environment.getProperty("spring.datasource.username", "root");

        Map<String, Object> override = new HashMap<>();
        override.put("spring.datasource.url", RAILWAY_JDBC);
        override.put("spring.datasource.username", username);
        override.put("spring.datasource.password", password);

        environment.getPropertySources().addFirst(new MapPropertySource("forceRailwayDatasource", override));
        System.err.println(
                "[Pavia] Localhost datasource override detected — using Railway MySQL instead. "
                        + "Set app.allow-local-db=true to use local adoption_platform.");
    }

    private static boolean isLocalDatasource(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        String lower = url.toLowerCase();
        return lower.contains("localhost") || lower.contains("127.0.0.1");
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
