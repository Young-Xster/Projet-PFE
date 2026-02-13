package com.grh.grh.repository;

import com.grh.grh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.userRoles ur LEFT JOIN FETCH ur.role WHERE u.username = :username")
    Optional<User> findByUsernameWithRoles(@Param("username") String username);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.employee WHERE u.id = :id")
    Optional<User> findByIdWithEmployee(@Param("id") UUID id);
    
    @Query("SELECT u FROM User u WHERE u.isActive = :isActive")
    java.util.List<User> findAllByIsActive(@Param("isActive") Boolean isActive);
}