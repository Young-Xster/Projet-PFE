package com.grh.grh.repository;

import com.grh.grh.entity.EmployeeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, UUID> {
    
    List<EmployeeDocument> findByEmployeeEmployeeId(UUID employeeId);
    
    List<EmployeeDocument> findByDocumentType(String documentType);
    
    List<EmployeeDocument> findByStatus(String status);
    
    List<EmployeeDocument> findByEmployeeEmployeeIdAndDocumentType(UUID employeeId, String documentType);
}