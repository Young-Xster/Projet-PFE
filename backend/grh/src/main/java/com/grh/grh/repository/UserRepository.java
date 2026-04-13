package com.grh.grh.repository;

import com.grh.grh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByKeycloakId(String keycloakId);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.employee WHERE u.id = :id")
    Optional<User> findByIdWithEmployee(@Param("id") UUID id);
    
    @Query("SELECT u FROM User u WHERE u.isActive = :isActive")
    java.util.List<User> findAllByIsActive(@Param("isActive") Boolean isActive);

    List<User> findByCompanyIdAndIsActiveTrue(UUID companyId);

    List<User> findByIsSuperAdminTrueAndIsActiveTrue();
}