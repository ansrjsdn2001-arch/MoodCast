package com.moodcast.admin.dao;

import com.moodcast.admin.vo.AdminMember;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/* ==========================================================================
 * 관리자 페이지 공통 DAO
 * --------------------------------------------------------------------------
 * DB와 직접 연결되는 MyBatis Mapper 인터페이스입니다.
 *
 * DAO 역할:
 * - service에서 필요한 DB 조회/수정 요청을 실제 SQL과 연결합니다.
 * - 회원 정보는 기존 member 패키지의 members 테이블 구조를 참고해서 사용할 예정입니다.
 *
 * 현재 단계:
 * - 다른 폴더의 mapper XML 파일을 수정하지 않기 위해 메서드는 아직 추가하지 않습니다.
 * - 나중에 관리자 회원 목록 조회, 관리자 승급/강등, 공지사항 관리 등이 필요해지면
 *   이 인터페이스에 메서드를 추가하고 mapper XML을 연결하면 됩니다.
 * ========================================================================== */
@Mapper // MyBatis가 이 인터페이스를 DB Mapper로 인식하게 합니다.
public interface AdminDao {

    /* members 테이블에 있는 전체 회원 수를 조회합니다. */
    Long selectTotalMemberCount();

    /* members 테이블에 있는 전체 회원 목록을 조회합니다. */
    List<AdminMember> selectMembers();
}
