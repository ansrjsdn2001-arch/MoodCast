package com.moodcast.member.service;

import com.moodcast.member.dao.LoginAuditDao;
import com.moodcast.member.vo.LoginAuditLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LoginAuditService {
    private static final Logger log = LoggerFactory.getLogger(LoginAuditService.class);

    private final LoginAuditDao loginAuditDao;

    public LoginAuditService(LoginAuditDao loginAuditDao) {
        this.loginAuditDao = loginAuditDao;
    }

    // 감사 로그 저장 실패가 로그인/refresh 흐름을 깨지 않게 막음
    public void record(
            Long memberId,
            String email,
            String provider,
            String loginType,
            boolean success,
            String failReason,
            String ipAddress,
            String userAgent
    ) {
        try {
            LoginAuditLog loginAuditLog = new LoginAuditLog();
            loginAuditLog.setMemberId(memberId);
            loginAuditLog.setEmail(email);
            loginAuditLog.setProvider(provider);
            loginAuditLog.setLoginType(loginType);
            loginAuditLog.setSuccess(success ? 1 : 0);
            loginAuditLog.setFailReason(failReason);
            loginAuditLog.setIpAddress(ipAddress);
            loginAuditLog.setUserAgent(userAgent);

            loginAuditDao.insertLoginAuditLog(loginAuditLog);
        } catch (Exception e) {
            log.warn("로그인 감사 로그 저장 실패: {}", e.getMessage());
        }
    }
}
