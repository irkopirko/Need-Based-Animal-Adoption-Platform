package com.adoptionplatform.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Legacy {@code users.is_active} column is unused (JPA maps {@code active}); drop it or back-fill to avoid insert failures.
 */
@Component
public class UsersSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(UsersSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public UsersSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Integer hasIsActive = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'users'
                      AND COLUMN_NAME = 'is_active'
                    """,
                    Integer.class
            );
            if (hasIsActive == null || hasIsActive == 0) {
                return;
            }
            Integer hasActive = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'users'
                      AND COLUMN_NAME = 'active'
                    """,
                    Integer.class
            );
            if (hasActive != null && hasActive > 0) {
                jdbcTemplate.execute(
                        "UPDATE users SET is_active = active WHERE is_active IS NULL OR is_active <> active"
                );
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN is_active");
                log.info("Dropped legacy users.is_active column (using users.active)");
            } else {
                jdbcTemplate.execute(
                        "ALTER TABLE users CHANGE COLUMN is_active active BIT(1) NOT NULL DEFAULT 1"
                );
                log.info("Renamed users.is_active to users.active");
            }
        } catch (Exception e) {
            log.warn("Users schema migration skipped: {}", e.getMessage());
        }
    }
}
