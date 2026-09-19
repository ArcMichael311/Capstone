package com.phonexis.backend.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.Pretest;
import com.phonexis.backend.Entity.PretestAttempt;
import com.phonexis.backend.Entity.User;

public interface PretestAttemptRepository extends JpaRepository<PretestAttempt, Long> {

	List<PretestAttempt> findByPretestOrderBySubmittedAtDesc(Pretest pretest);

	Optional<PretestAttempt> findFirstByPretestAndStudentOrderBySubmittedAtDesc(Pretest pretest, User student);

	List<PretestAttempt> findByPretestAndStudentOrderBySubmittedAtDesc(Pretest pretest, User student);
}
