package com.phonexis.backend.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.ClassSection;
import com.phonexis.backend.Entity.User;

public interface ClassSectionRepository extends JpaRepository<ClassSection, Long> {

	List<ClassSection> findByTeacherOrderByCreatedAtDesc(User teacher);
}
