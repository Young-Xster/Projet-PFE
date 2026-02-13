package com.grh.grh.repository;

import com.grh.grh.entity.DocumentAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentAccessLogRepository extends JpaRepository<DocumentAccessLog, UUID> {
    
    List<DocumentAccessLog> findByDocumentId(UUID documentId);
    
    List<DocumentAccessLog> findByAccessedById(UUID accessedById);
    
    List<DocumentAccessLog> findByAccessType(String accessType);
    
    @Query("SELECT dal FROM DocumentAccessLog dal WHERE dal.accessTime BETWEEN :startDate AND :endDate")
    List<DocumentAccessLog> findByAccessTimeBetween(
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );
}
