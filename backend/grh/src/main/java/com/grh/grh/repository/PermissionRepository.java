package com.grh.grh.repository;

import com.grh.grh.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    Optional<Permission> findByCode(String code);

    Optional<Permission> findByModule(String module);

    boolean existsByCode(String code);
}
