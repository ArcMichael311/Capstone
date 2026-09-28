package com.phonexis.backend.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.ClassSection;
import com.phonexis.backend.Entity.LearningMaterial;

public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, Long> {

	List<LearningMaterial> findByClassSectionOrderByCreatedAtDesc(ClassSection classSection);
}
