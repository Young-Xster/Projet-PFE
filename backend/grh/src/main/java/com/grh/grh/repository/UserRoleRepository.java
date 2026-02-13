package com.grh.grh.repository;

import com.grh.grh.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    
    List<UserRole> findByUserId(UUID userId);
    
    List<UserRole> findByRoleId(UUID roleId);
    
    List<UserRole> findByCompanyId(UUID companyId);
    
    @Query("SELECT ur FROM UserRole ur WHERE ur.user.id = :userId AND ur.company.id = :companyId")
    List<UserRole> findByUserIdAndCompanyId(@Param("userId") UUID userId, @Param("companyId") UUID companyId);
    
    void deleteByUserIdAndRoleId(UUID userId, UUID roleId);
}
