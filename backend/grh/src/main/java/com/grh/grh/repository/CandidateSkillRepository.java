package com.grh.grh.repository;

import com.grh.grh.entity.CandidateSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateSkillRepository extends JpaRepository<CandidateSkill, UUID> {
    
    List<CandidateSkill> findByCandidateId(UUID candidateId);
    
    List<CandidateSkill> findBySkillName(String skillName);
    
    void deleteByCandidateId(UUID candidateId);
}
