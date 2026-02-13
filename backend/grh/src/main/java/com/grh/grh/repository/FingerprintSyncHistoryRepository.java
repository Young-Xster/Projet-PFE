package com.grh.grh.repository;

import com.grh.grh.entity.FingerprintSyncHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FingerprintSyncHistoryRepository extends JpaRepository<FingerprintSyncHistory, UUID> {
    
    List<FingerprintSyncHistory> findByDeviceId(UUID deviceId);
    
    List<FingerprintSyncHistory> findBySyncStatus(String syncStatus);
    
    @Query("SELECT fsh FROM FingerprintSyncHistory fsh WHERE fsh.device.id = :deviceId ORDER BY fsh.syncStartAt DESC")
    List<FingerprintSyncHistory> findByDeviceIdOrderByStartDesc(@Param("deviceId") UUID deviceId);
    
    @Query("SELECT fsh FROM FingerprintSyncHistory fsh WHERE fsh.syncStartAt BETWEEN :startDate AND :endDate")
    List<FingerprintSyncHistory> findBySyncStartAtBetween(
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );
}
