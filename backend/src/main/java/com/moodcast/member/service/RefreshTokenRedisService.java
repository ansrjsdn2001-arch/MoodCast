package com.moodcast.member.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RefreshTokenRedisService {
    private final StringRedisTemplate redisTemplate;

    // key로 사용할 문자열 세팅
    private String key(Long memberId) {
        return "auth:refresh:" + memberId;
    }

    public RefreshTokenRedisService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // refresh 토큰 저장
    public void saveRefreshToken(Long memberId, String refreshToken, long expireSeconds) {
        // memberId로 고유한 redis Key 문자열 생성
        String key = key(memberId);
        // 토큰 저장 및 수명 (ttl) 설정
        // 설정된 시간이 지나면 redis 자체 기능으로 데이터 소멸
        redisTemplate.opsForValue().set(key, refreshToken, Duration.ofSeconds(expireSeconds));
    }

    // refresh 토큰 검증 (access token 재발급 요청 시)
    public boolean matches(Long memberId, String refreshToken) {
        String savedToken = redisTemplate.opsForValue().get(key(memberId));
        // npe 방어
        return refreshToken != null && refreshToken.equals(savedToken);
    }

    // refresh 토큰 삭제 (로그아웃)
    public void deleteRefreshToken(Long memberId) {
        redisTemplate.delete(key(memberId));
    }
}
