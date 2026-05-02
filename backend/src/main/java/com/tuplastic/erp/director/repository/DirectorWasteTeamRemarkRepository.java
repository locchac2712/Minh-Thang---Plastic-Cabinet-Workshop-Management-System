package com.tuplastic.erp.director.repository;

import com.tuplastic.erp.director.entity.DirectorWasteTeamRemark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface DirectorWasteTeamRemarkRepository extends JpaRepository<DirectorWasteTeamRemark, UUID> {

    Optional<DirectorWasteTeamRemark> findByPeriodFromAndPeriodToAndTeamUser_Id(
            LocalDate periodFrom, LocalDate periodTo, UUID teamUserId);
}
