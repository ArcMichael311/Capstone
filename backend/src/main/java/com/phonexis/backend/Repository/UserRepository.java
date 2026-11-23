package com.phonexis.backend.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.phonexis.backend.Entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	Optional<User> findBySessionToken(String sessionToken);

	@Query("select u from User u where u.role = com.phonexis.backend.Entity.User.Role.STUDENT "
		+ "and u.userId not in (select ce.student.userId from ClassEnrollment ce) "
		+ "order by u.firstName, u.lastName")
	List<User> findUnassignedStudents();


	boolean existsByEmailIgnoreCase(String email);

	long countByRole(User.Role role);

	boolean existsByEmailIgnoreCaseAndUserIdNot(String email, Long userId);

	Optional<User> findByClassCodeIgnoreCase(String classCode);

	boolean existsByClassCodeIgnoreCase(String classCode);
}