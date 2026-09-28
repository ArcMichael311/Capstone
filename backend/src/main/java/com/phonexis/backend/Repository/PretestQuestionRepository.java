package com.phonexis.backend.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.phonexis.backend.Entity.Pretest;
import com.phonexis.backend.Entity.PretestQuestion;

public interface PretestQuestionRepository extends JpaRepository<PretestQuestion, Long> {

	List<PretestQuestion> findByPretestOrderBySortOrderAsc(Pretest pretest);

	long countByPretest(Pretest pretest);
}
