package com.phonexis.backend.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.TeacherActivity;
import com.phonexis.backend.Entity.User;

public interface TeacherActivityRepository extends JpaRepository<TeacherActivity, Long> {
	List<TeacherActivity> findByTeacherOrderByCreatedAtDesc(User teacher);

	void deleteByTeacher(User teacher);
}
