package com.adoptionplatform.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate {@code ddl-auto=update} may create {@code image_data} as a tiny blob; widen to LONGBLOB for JPEG storage.
 */
@Component
public class AnimalImageSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AnimalImageSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public AnimalImageSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Integer exists = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'animal_images'
                      AND COLUMN_NAME = 'image_data'
                    """,
                    Integer.class
            );
            if (exists == null || exists == 0) {
                return;
            }
            jdbcTemplate.execute(
                    "ALTER TABLE animal_images MODIFY COLUMN image_data LONGBLOB NULL"
            );
            log.info("Ensured animal_images.image_data is LONGBLOB");
        } catch (Exception e) {
            log.warn("Could not widen animal_images.image_data to LONGBLOB: {}", e.getMessage());
        }
    }
}
