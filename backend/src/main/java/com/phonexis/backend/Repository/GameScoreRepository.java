package com.phonexis.backend.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.phonexis.backend.Entity.GameScore;
import com.phonexis.backend.Entity.User;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, Long> {
	Optional<GameScore> findByUserAndGameName(User user, String gameName);

	List<GameScore> findByUser(User user);

	void deleteByUser(User user);
}
