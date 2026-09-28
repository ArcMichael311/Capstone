package com.phonexis.backend.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.phonexis.backend.Entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	@Query("select u from User u where u.role = com.phonexis.backend.Entity.User.Role.STUDENT "
		+ "and u.userId not in (select ce.student.userId from ClassEnrollment ce) "
		+ "order by u.firstName, u.lastName")
	List<User> findUnassignedStudents();

	@Modifying
	@Query("update User u set u.activeDeviceId = :deviceId, u.lastActiveAt = CURRENT_TIMESTAMP where u.userId = :userId "
		+ "and (u.activeDeviceId is null or u.activeDeviceId = '' or u.activeDeviceId = :deviceId "
		+ "or u.lastActiveAt is null or u.lastActiveAt < :staleBefore)")
	int claimDeviceIfAvailable(@Param("userId") Long userId, @Param("deviceId") String deviceId, @Param("staleBefore") LocalDateTime staleBefore);

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCaseAndUserIdNot(String email, Long userId);

	Optional<User> findByClassCodeIgnoreCase(String classCode);

	boolean existsByClassCodeIgnoreCase(String classCode);
}