import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import styles from './UserProfilePage.module.css';

export function UserProfilePage() {
  const desktop = useIsDesktop();
  const { handle } = useParams(); // URL 파라미터 :handle (여기서는 memberId)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { member: currentMember } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  useEffect(() => {
    setLoading(true);
    // 타인 프로필 조회를 위해 /auth/member/:id 형태의 API가 있다고 가정하거나 새로 만들어야 함
    // 현재는 /auth/me만 있으므로, 백엔드에 상세조회 API를 추가하는 것이 정석
    axios.get(`${BACKSERVER}/auth/member/${handle}`)
      .then(res => {
        if (res.data.success) {
          setUser(res.data.member);
        }
      })
      .catch(err => {
        console.error('사용자 정보 조회 실패:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [handle, BACKSERVER]);

  const isOwnProfile = currentMember && String(currentMember.memberId) === String(handle);

  if (loading) {
    const loader = <div style={{ padding: '20px', textAlign: 'center' }}>프로필을 불러오는 중...</div>;
    if (!desktop) return <MobileShell title="사용자 프로필" hideSearch>{loader}</MobileShell>;
    return <DesktopShell>{loader}</DesktopShell>;
  }

  if (!user) {
    const noUser = <div style={{ padding: '20px', textAlign: 'center' }}>사용자를 찾을 수 없습니다.</div>;
    if (!desktop) return <MobileShell title="사용자 프로필" hideSearch>{noUser}</MobileShell>;
    return <DesktopShell>{noUser}</DesktopShell>;
  }

  const content = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.avatar}>{user?.nickname?.charAt(0) || 'U'}</div>
        <div className={styles.heroInfo}>
          <div className={styles.nameRow}>
            <strong>{user?.nickname || '사용자'}</strong>
            {!isOwnProfile && (
              <div className={styles.actions}>
                <button type="button" className={styles.followBtn}>팔로잉 하기</button>
                <button type="button" className={styles.chatBtn}>채팅하기</button>
              </div>
            )}
          </div>
          <span>@{user?.memberId || handle}</span>
          <p>{user?.bio || '안녕하세요! MoodCast 사용자입니다.'}</p>
        </div>
      </div>
      <div className={styles.stats}>
        <article>
          <strong>18</strong>
          <span>게시물</span>
        </article>
        <article>
          <strong>254</strong>
          <span>팔로워</span>
        </article>
        <article>
          <strong>98</strong>
          <span>팔로잉</span>
        </article>
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="사용자 프로필" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
