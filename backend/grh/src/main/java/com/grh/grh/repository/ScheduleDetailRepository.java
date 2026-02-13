package com.grh.grh.repository;

import com.grh.grh.entity.ScheduleDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleDetailRepository extends JpaRepository<ScheduleDetail, UUID> {
    
    List<ScheduleDetail> findByScheduleId(UUID scheduleId);
    
    List<ScheduleDetail> findByScheduleIdAndIsWorkingDay(UUID scheduleId, Boolean isWorkingDay);
}
