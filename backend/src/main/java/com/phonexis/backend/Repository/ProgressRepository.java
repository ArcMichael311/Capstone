package com.phonexis.backend.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.phonexis.backend.Entity.Progress;
import com.phonexis.backend.Entity.User;

@Repository
public interface ProgressRepository extends JpaRepository<Progress, Long> {
	Optional<Progress> findByUserAndModuleName(User user, String moduleName);

	List<Progress> findByUser(User user);

	List<Progress> findByUserAndModuleNameOrderByUpdatedAtDesc(User user, String moduleName);

	void deleteByUser(User user);
}
