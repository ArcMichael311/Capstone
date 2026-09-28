package com.phonexis.backend.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.PretestAnswer;
import com.phonexis.backend.Entity.PretestQuestion;

public interface PretestAnswerRepository extends JpaRepository<PretestAnswer, Long> {

	void deleteByQuestion(PretestQuestion question);
}
