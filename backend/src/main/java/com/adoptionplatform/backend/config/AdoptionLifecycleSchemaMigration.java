package com.adoptionplatform.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class AdoptionLifecycleSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdoptionLifecycleSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public AdoptionLifecycleSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureInquiryColumns();
            ensureGenderColumns();
            ensureTable(
                    "adoption_cases",
                    """
                    CREATE TABLE adoption_cases (
                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      animal_id BIGINT NOT NULL,
                      adopter_user_id BIGINT NOT NULL,
                      owner_user_id BIGINT NOT NULL,
                      inquiry_id BIGINT NULL,
                      adoption_request_id BIGINT NULL,
                      match_percentage_snapshot DOUBLE NULL,
                      status VARCHAR(32) NOT NULL,
                      proposed_at DATETIME NULL,
                      accepted_at DATETIME NULL,
                      reserved_at DATETIME NULL,
                      completed_at DATETIME NULL,
                      cancelled_at DATETIME NULL,
                      updated_at DATETIME NULL,
                      INDEX idx_adoption_cases_animal (animal_id),
                      INDEX idx_adoption_cases_adopter (adopter_user_id),
                      INDEX idx_adoption_cases_owner (owner_user_id)
                    )
                    """
            );
            ensureTable(
                    "match_snapshots",
                    """
                    CREATE TABLE match_snapshots (
                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      adopter_user_id BIGINT NOT NULL,
                      animal_id BIGINT NOT NULL,
                      adoption_request_id BIGINT NOT NULL,
                      match_percentage DOUBLE NOT NULL,
                      match_reasons_json VARCHAR(4000) NULL,
                      created_at DATETIME NULL,
                      updated_at DATETIME NULL,
                      UNIQUE KEY uk_match_snapshot_triple (adopter_user_id, animal_id, adoption_request_id),
                      INDEX idx_match_snapshots_animal (animal_id)
                    )
                    """
            );
            ensureTable(
                    "adoption_audit_events",
                    """
                    CREATE TABLE adoption_audit_events (
                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      entity_type VARCHAR(48) NOT NULL,
                      entity_id BIGINT NOT NULL,
                      actor_user_id BIGINT NULL,
                      action VARCHAR(64) NOT NULL,
                      details VARCHAR(2000) NULL,
                      created_at DATETIME NULL,
                      INDEX idx_audit_entity (entity_type, entity_id)
                    )
                    """
            );
        } catch (Exception e) {
            log.warn("Adoption lifecycle schema migration skipped: {}", e.getMessage());
        }
    }

    private void ensureInquiryColumns() {
        ensureColumn("listing_inquiries", "adoption_request_id", "BIGINT NULL");
        ensureColumn("listing_inquiries", "match_percentage_at_contact", "DOUBLE NULL");
    }

    private void ensureGenderColumns() {
        ensureColumn("animals", "gender", "VARCHAR(16) NULL");
        ensureColumn("adoption_requests", "preferred_genders", "VARCHAR(64) NULL");
    }

    private void ensureColumn(String table, String column, String definition) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """,
                Integer.class,
                table,
                column
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
            log.info("Added {}.{}", table, column);
        }
    }

    private void ensureTable(String table, String createSql) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                """,
                Integer.class,
                table
        );
        if (count == null || count == 0) {
            jdbcTemplate.execute(createSql);
            log.info("Created table {}", table);
        }
    }
}
