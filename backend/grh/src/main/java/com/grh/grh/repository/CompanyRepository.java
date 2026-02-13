package com.grh.grh.repository;

import com.grh.grh.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.Optional;
import java.util.UUID;


@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    Optional<Company> findByCode(String code);

    Optional<Company> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    @Query("SELECT c FROM Company c WHERE c.isActive = :isActive")
    java.util.List<Company> findAllActive(@Param("isActive") Boolean isActive);
    
    @Query("SELECT c FROM Company c LEFT JOIN FETCH c.companySetting WHERE c.id = :id")
    Optional<Company> findByIdWithSettings(@Param("id") UUID id);

    
}
