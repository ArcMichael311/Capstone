package com.phonexis.backend.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.User;
import com.phonexis.backend.Entity.UserActivity;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
	List<UserActivity> findTop100ByUserOrderByCreatedAtDesc(User user);
}