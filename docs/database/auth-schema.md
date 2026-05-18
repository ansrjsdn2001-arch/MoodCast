# MoodCast Auth Schema Draft

작성일: 2026-05-18

## 테이블 목록

- `members`
- `member_oauth_accounts`
- `terms`
- `member_terms_agreements`
- `auth_codes`
- `refresh_tokens`

## 설계 메모

- `nickname`은 `NULL` 허용
- `password_hash`도 `NULL` 허용
- `phone`은 현재 UI 기준 `NOT NULL` 가능
- 소셜 로그인은 `email`이 아니라 `provider_user_id` 기준
- 약관은 `terms`와 `member_terms_agreements`로 분리
- 인증코드는 회원가입 전에도 필요하므로 `auth_codes.member_id`는 `NULL` 허용
- MySQL에서는 `Y/N`보다 `TINYINT(1)`의 `0/1`이 무난함
- `refresh_tokens`는 JWT 로그인 유지용이며, 세션 방식으로만 갈 경우 1차 구현에서 제외 가능

## 회원가입 처리 흐름

1. 이메일 인증번호 발송
   - `auth_codes` insert
2. 이메일 인증 완료
   - `auth_codes.verified_at` update
3. 휴대폰 인증번호 발송
   - `auth_codes` insert
4. 휴대폰 인증 완료
   - `auth_codes.verified_at` update
5. 약관 동의 후 가입 완료
   - `members` insert
   - `member_terms_agreements` insert
   - `auth_codes.used_at` update

## 1. members

```sql
CREATE TABLE members (
  member_id          BIGINT NOT NULL AUTO_INCREMENT,

  email              VARCHAR(255) NOT NULL,
  password_hash      VARCHAR(255) NULL,

  name               VARCHAR(50) NOT NULL,
  nickname           VARCHAR(50) NULL,
  phone              VARCHAR(30) NOT NULL,

  profile_image_url  VARCHAR(500) NULL,
  bio                VARCHAR(300) NULL,

  email_verified     TINYINT(1) NOT NULL DEFAULT 0,
  phone_verified     TINYINT(1) NOT NULL DEFAULT 0,

  role               VARCHAR(20) NOT NULL DEFAULT 'USER',
  status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

  last_login_at      DATETIME(6) NULL,
  created_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at         DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at         DATETIME(6) NULL,

  PRIMARY KEY (member_id),

  CONSTRAINT uq_members_email UNIQUE (email),
  CONSTRAINT uq_members_nickname UNIQUE (nickname),
  CONSTRAINT uq_members_phone UNIQUE (phone),

  CONSTRAINT ck_members_email_verified CHECK (email_verified IN (0, 1)),
  CONSTRAINT ck_members_phone_verified CHECK (phone_verified IN (0, 1)),
  CONSTRAINT ck_members_role CHECK (role IN ('USER', 'ADMIN')),
  CONSTRAINT ck_members_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## 2. member_oauth_accounts

소셜 로그인 연결 테이블.

```sql
CREATE TABLE member_oauth_accounts (
  oauth_account_id   BIGINT NOT NULL AUTO_INCREMENT,
  member_id          BIGINT NOT NULL,

  provider           VARCHAR(20) NOT NULL,
  provider_user_id   VARCHAR(255) NOT NULL,

  provider_email     VARCHAR(255) NULL,
  provider_nickname  VARCHAR(100) NULL,

  connected_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_login_at      DATETIME(6) NULL,

  PRIMARY KEY (oauth_account_id),

  CONSTRAINT fk_oauth_member
    FOREIGN KEY (member_id)
    REFERENCES members(member_id),

  CONSTRAINT uq_oauth_provider_user
    UNIQUE (provider, provider_user_id),

  CONSTRAINT uq_oauth_member_provider
    UNIQUE (member_id, provider),

  CONSTRAINT ck_oauth_provider
    CHECK (provider IN ('KAKAO', 'NAVER', 'GOOGLE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## 3. terms

약관 마스터 테이블.

```sql
CREATE TABLE terms (
  terms_id      BIGINT NOT NULL AUTO_INCREMENT,

  terms_type    VARCHAR(30) NOT NULL,
  version       VARCHAR(20) NOT NULL,
  title         VARCHAR(100) NOT NULL,
  content       MEDIUMTEXT NULL,

  is_required   TINYINT(1) NOT NULL DEFAULT 1,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,

  created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (terms_id),

  CONSTRAINT uq_terms_type_version UNIQUE (terms_type, version),

  CONSTRAINT ck_terms_type
    CHECK (terms_type IN ('SERVICE', 'PRIVACY', 'MARKETING')),

  CONSTRAINT ck_terms_required
    CHECK (is_required IN (0, 1)),

  CONSTRAINT ck_terms_active
    CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## 4. member_terms_agreements

회원별 약관 동의 기록.

```sql
CREATE TABLE member_terms_agreements (
  agreement_id   BIGINT NOT NULL AUTO_INCREMENT,
  member_id      BIGINT NOT NULL,
  terms_id       BIGINT NOT NULL,

  agreed          TINYINT(1) NOT NULL,
  agreed_at       DATETIME(6) NULL,
  withdrawn_at    DATETIME(6) NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (agreement_id),

  CONSTRAINT fk_member_terms_member
    FOREIGN KEY (member_id)
    REFERENCES members(member_id),

  CONSTRAINT fk_member_terms_terms
    FOREIGN KEY (terms_id)
    REFERENCES terms(terms_id),

  CONSTRAINT uq_member_terms
    UNIQUE (member_id, terms_id),

  CONSTRAINT ck_member_terms_agreed
    CHECK (agreed IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## 5. auth_codes

이메일 인증, 휴대폰 인증 공통 테이블.

```sql
CREATE TABLE auth_codes (
  auth_code_id   BIGINT NOT NULL AUTO_INCREMENT,

  member_id      BIGINT NULL,

  target_type    VARCHAR(20) NOT NULL,
  target_value   VARCHAR(255) NOT NULL,
  purpose        VARCHAR(30) NOT NULL,

  code_hash      VARCHAR(255) NOT NULL,

  expires_at     DATETIME(6) NOT NULL,
  verified_at    DATETIME(6) NULL,
  used_at        DATETIME(6) NULL,

  attempt_count  INT NOT NULL DEFAULT 0,

  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (auth_code_id),

  CONSTRAINT fk_auth_codes_member
    FOREIGN KEY (member_id)
    REFERENCES members(member_id),

  CONSTRAINT ck_auth_target_type
    CHECK (target_type IN ('EMAIL', 'PHONE')),

  CONSTRAINT ck_auth_purpose
    CHECK (purpose IN ('SIGNUP', 'LOGIN', 'FIND_EMAIL', 'RESET_PASSWORD', 'CHANGE_EMAIL', 'CHANGE_PHONE')),

  CONSTRAINT ck_auth_attempt_count
    CHECK (attempt_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_auth_codes_lookup
ON auth_codes (target_type, target_value, purpose, created_at);

CREATE INDEX idx_auth_codes_member
ON auth_codes (member_id);
```

## 6. refresh_tokens

JWT 로그인 유지용 테이블.

```sql
CREATE TABLE refresh_tokens (
  refresh_token_id  BIGINT NOT NULL AUTO_INCREMENT,
  member_id         BIGINT NOT NULL,

  token_hash        VARCHAR(255) NOT NULL,

  user_agent        VARCHAR(500) NULL,
  ip_address        VARCHAR(45) NULL,

  expires_at        DATETIME(6) NOT NULL,
  revoked_at        DATETIME(6) NULL,
  created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (refresh_token_id),

  CONSTRAINT fk_refresh_tokens_member
    FOREIGN KEY (member_id)
    REFERENCES members(member_id),

  CONSTRAINT uq_refresh_token_hash
    UNIQUE (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_refresh_tokens_member
ON refresh_tokens (member_id);

CREATE INDEX idx_refresh_tokens_valid
ON refresh_tokens (member_id, revoked_at, expires_at);
```
