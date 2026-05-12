package com.adoptionplatform.backend.entity;

import java.io.Serializable;
import java.util.Objects;

/**
 * composite primary key for {@link AnimalImage}: {@code (animal_id, sort_order)}.
  */
public class AnimalImageId implements Serializable {

    /**
     * FK to {@link Animal#getId()} — same column as {@link AnimalImage#getAnimal()}'s join
     */
    private Long animal;

    private Integer sortOrder;

    public AnimalImageId() {
    }

    public AnimalImageId(Long animal, Integer sortOrder) {
        this.animal = animal;
        this.sortOrder = sortOrder;
    }

    public Long getAnimal() {
        return animal;
    }

    public void setAnimal(Long animal) {
        this.animal = animal;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        AnimalImageId that = (AnimalImageId) o;
        return Objects.equals(animal, that.animal) && Objects.equals(sortOrder, that.sortOrder);
    }

    @Override
    public int hashCode() {
        return Objects.hash(animal, sortOrder);
    }
}
