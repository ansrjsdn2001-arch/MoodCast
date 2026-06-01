package com.moodcast.member.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Set;

@Service
public class RefreshTokenRedisService {
    private final StringRedisTemplate redisTemplate;

    // key로 사용할 문자열 세팅
    private String key(Long memberId, String tokenId) {
        return "auth:refresh:" + memberId + ":" + tokenId;
    }

    public RefreshTokenRedisService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // Redis에는 refreshToken 원문이 아니라 SHA-256 해시만 저장함
    public void saveRefreshToken(Long memberId, String tokenId, String refreshToken, long expireSeconds) {
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            throw new IllegalArgumentException("refreshToken이 필요합니다.");
        }

        String key = key(memberId, tokenId);
        redisTemplate.opsForValue().set(key, hashToken(refreshToken), Duration.ofSeconds(expireSeconds));
    }

    // 쿠키의 refreshToken을 해시로 바꿔 Redis에 저장된 해시와 비교함
    public boolean matchesRefreshToken(Long memberId, String tokenId, String refreshToken) {
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return false;
        }

        String savedHash = redisTemplate.opsForValue().get(key(memberId, tokenId));
        if (savedHash == null || savedHash.trim().isEmpty()) {
            return false;
        }

        String requestHash = hashToken(refreshToken);

        return MessageDigest.isEqual(
                savedHash.getBytes(StandardCharsets.UTF_8),
                requestHash.getBytes(StandardCharsets.UTF_8)
        );
    }

    // 기존 호출부가 남아도 깨지지 않도록 같은 검증 메서드로 연결함
    public boolean matches(Long memberId, String tokenId, String refreshToken) {
        return matchesRefreshToken(memberId, tokenId, refreshToken);
    }

    // refresh 토큰 삭제 (로그아웃)
    public void deleteRefreshToken(Long memberId, String tokenId) {
        redisTemplate.delete(key(memberId, tokenId));
    }

    // 해당 회원의 모든 로그인 세션 refreshToken 삭제
    // 아직 사용안함 미리 준비
    public void deleteAllRefreshTokens(Long memberId) {
        Set<String> keys = redisTemplate.keys("auth:refresh:" + memberId + ":*");

        if (keys == null || keys.isEmpty()) {
            return;
        }

        redisTemplate.delete(keys);
    }

    private String hashToken(String refreshToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(refreshToken.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("refreshToken 해시 처리에 실패했습니다.", e);
        }
    }
}
