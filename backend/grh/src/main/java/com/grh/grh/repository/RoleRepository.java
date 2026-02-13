package com.grh.grh.repository;

import com.grh.grh.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    
    Optional<Role> findByName(String name);

    boolean existsByName(String name);
    
    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.rolePermissions rp LEFT JOIN FETCH rp.permission WHERE r.id = :id")
    Optional<Role> findByIdWithPermissions(@Param("id") UUID id);
    
}
