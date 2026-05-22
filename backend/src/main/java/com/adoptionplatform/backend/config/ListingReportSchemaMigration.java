package com.adoptionplatform.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ListingReportSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ListingReportSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public ListingReportSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureColumn("title", "VARCHAR(120) NULL");
            ensureColumn("description", "VARCHAR(1000) NULL");
            jdbcTemplate.execute(
                    """
                    UPDATE listing_reports
                    SET title = COALESCE(title, reason),
                        description = COALESCE(description, note)
                    WHERE title IS NULL OR description IS NULL
                    """
            );
        } catch (Exception e) {
            log.warn("Listing reports schema migration skipped: {}", e.getMessage());
        }
    }

    private void ensureColumn(String column, String definition) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'listing_reports'
                  AND COLUMN_NAME = ?
                """,
                Integer.class,
                column
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE listing_reports ADD COLUMN " + column + " " + definition);
            log.info("Added listing_reports.{}", column);
        }
    }
}
