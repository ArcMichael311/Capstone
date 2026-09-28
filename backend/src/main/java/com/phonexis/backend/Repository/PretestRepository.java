package com.phonexis.backend.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.ClassSection;
import com.phonexis.backend.Entity.Pretest;

public interface PretestRepository extends JpaRepository<Pretest, Long> {

	List<Pretest> findByClassSectionOrderByCreatedAtDesc(ClassSection classSection);
}
