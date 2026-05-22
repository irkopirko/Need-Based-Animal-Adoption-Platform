package com.adoptionplatform.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * row in {@code animal_images}, primary key is {@code (animal_id, sort_order)} — no surrogate {@code id} column
 */
@Entity
@IdClass(AnimalImageId.class)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(
        name = "animal_images",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_animal_images_animal_sort",
                columnNames = {"animal_id", "sort_order"}
        )
)
public class AnimalImage {

    @Id
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Id
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "image_url", nullable = false, length = 2048)
    private String imageUrl;

    @JdbcTypeCode(SqlTypes.BLOB)
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    @JsonIgnore
    private byte[] imageData;

    @Column(name = "content_type", nullable = false, length = 64)
    private String contentType = "image/jpeg";

    public AnimalImage() {
    }

    @JsonIgnore
    public Animal getAnimal() {
        return animal;
    }

    public void setAnimal(Animal animal) {
        this.animal = animal;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    @JsonIgnore
    public byte[] getImageData() {
        return imageData;
    }

    public void setImageData(byte[] imageData) {
        this.imageData = imageData;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public boolean hasStoredBytes() {
        return imageData != null && imageData.length > 0;
    }
}
