import { useState } from 'react';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuthState';
import styles from './LoginPage.module.css';

const defaultForm = {
  email: '',
  password: '',
  remember: false,
};

export function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuthState();
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage('');
  };

  const handleLogin = (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoggedIn(true);
    navigate('/app/feed');
  };

  const handlePendingFeature = (label) => {
    setMessage(`${label}은 백엔드 연결 후 사용할 수 있습니다.`);
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <img src="/MoodCast-logo.svg" alt="" aria-hidden="true" />
            <strong>MoodCast</strong>
          </div>
          <h1>로그인</h1>
          <p>MoodCast에 오신 것을 환영합니다</p>
        </header>

        <form className={styles.form} onSubmit={handleLogin}>
          <label className={styles.field}>
            <span>
              이메일 <b>*</b>
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateForm('email', event.target.value)}
              placeholder="이메일 주소를 입력하세요"
            />
          </label>

          <label className={styles.field}>
            <span>
              비밀번호 <b>*</b>
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateForm('password', event.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </label>

          <div className={styles.options}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) => updateForm('remember', event.target.checked)}
              />
              <span>로그인 상태 유지</span>
            </label>
            <div className={styles.findLinks}>
              <button type="button" onClick={() => handlePendingFeature('아이디 찾기')}>
                아이디 찾기
              </button>
              <i />
              <button type="button" onClick={() => handlePendingFeature('비밀번호 찾기')}>
                비밀번호 찾기
              </button>
            </div>
          </div>

          {message ? <p className={styles.message}>{message}</p> : null}

          <button type="submit" className={styles.primary}>
            로그인
          </button>
        </form>

        <div className={styles.socialArea}>
          <div className={styles.divider}>
            <span />
            <em>또는 소셜 계정으로 로그인</em>
            <span />
          </div>

          <button type="button" className={`${styles.socialButton} ${styles.kakao}`} onClick={() => handlePendingFeature('카카오 로그인')}>
            <ChatBubbleRoundedIcon fontSize="small" />
            카카오로 로그인
          </button>
          <button type="button" className={`${styles.socialButton} ${styles.naver}`} onClick={() => handlePendingFeature('네이버 로그인')}>
            <b>N</b>
            네이버로 로그인
          </button>
          <button type="button" className={styles.socialButton} onClick={() => handlePendingFeature('Google 로그인')}>
            <span className={styles.googleMark}>G</span>
            Google로 로그인
          </button>
        </div>

        <p className={styles.signupText}>
          아직 회원이 아니신가요? <Link to="/auth/signup">회원가입</Link>
        </p>
      </section>
    </main>
  );
}
