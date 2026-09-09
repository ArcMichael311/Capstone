package com.phonexis.backend.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.phonexis.backend.Entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCaseAndUserIdNot(String email, Long userId);

	Optional<User> findByClassCodeIgnoreCase(String classCode);

	boolean existsByClassCodeIgnoreCase(String classCode);

	@Modifying
	@Transactional
	@Query("update User u set u.activeDeviceId = :deviceId where u.userId = :userId and (u.activeDeviceId is null or u.activeDeviceId = '' or u.activeDeviceId = :deviceId)")
	int claimActiveDevice(@Param("userId") Long userId, @Param("deviceId") String deviceId);
}