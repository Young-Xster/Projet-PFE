package com.grh.grh.repository;

import com.grh.grh.entity.JobListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobListingRepository extends JpaRepository<JobListing, UUID> {

    List<JobListing> findByCompanyIdAndStatus(UUID companyId, String status);

    List<JobListing> findByCompanyId(UUID companyId);

    // Public: all open listings across all companies
    List<JobListing> findByStatus(String status);

    // Public: open listings filtered by company
    List<JobListing> findByCompanyIdAndStatusOrderByCreatedAtDesc(UUID companyId, String status);

    // Public: open listings filtered by department
    List<JobListing> findByDepartmentIdAndStatus(UUID departmentId, String status);

    // Public: open listings filtered by company AND department
    List<JobListing> findByCompanyIdAndDepartmentIdAndStatus(UUID companyId, UUID departmentId, String status);

    // Auto-close expired listings
    @Modifying
    @Query("UPDATE JobListing j SET j.status = 'closed' WHERE j.deadline < :today AND j.status = 'open'")
    int closeExpiredListings(@Param("today") LocalDate today);
}