package com.phonexis.backend.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.ClassEnrollment;
import com.phonexis.backend.Entity.ClassSection;
import com.phonexis.backend.Entity.User;

public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, Long> {

	List<ClassEnrollment> findByClassSectionOrderByAddedAtAsc(ClassSection classSection);

	Optional<ClassEnrollment> findByClassSectionAndStudent(ClassSection classSection, User student);

	boolean existsByClassSectionAndStudent(ClassSection classSection, User student);

	long countByClassSection(ClassSection classSection);

	List<ClassEnrollment> findByStudent(User student);

	void deleteByClassSection(ClassSection classSection);

	void deleteByStudent(User student);
}
