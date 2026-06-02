package com.phonexis.backend.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.phonexis.backend.Entity.LearningModule;
import com.phonexis.backend.Entity.ModuleGame;

@Repository
public interface ModuleGameRepository extends JpaRepository<ModuleGame, Long> {
	List<ModuleGame> findByModuleModuleKeyIgnoreCaseOrderByDisplayOrderAscTitleAsc(String moduleKey);

	Optional<ModuleGame> findByModuleAndGameKeyIgnoreCase(LearningModule module, String gameKey);

	Optional<ModuleGame> findByGameKeyIgnoreCase(String gameKey);

	boolean existsByModuleAndGameKeyIgnoreCase(LearningModule module, String gameKey);

	boolean existsByModuleAndGameKeyIgnoreCaseAndGameIdNot(LearningModule module, String gameKey, Long gameId);
}