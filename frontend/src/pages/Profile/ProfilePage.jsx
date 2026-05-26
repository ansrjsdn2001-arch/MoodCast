import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/useAuthStore';
import { FeedCard } from '../../components/common/FeedCard';
import { defaultAvatarSrc } from '../../shared/lib/defaultAvatar';
import { normalizePostDataArray } from '../../shared/lib/postHelpers';
import { Card, CardContent, Typography, Box } from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GradeIcon from '@mui/icons-material/Grade';
import SeedlingIcon from '@mui/icons-material/Spa';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { handle } = useParams(); // URL 파라미터 :handle (memberId)
  const sanitizedHandle = handle === 'undefined' || handle === 'null' ? null : handle;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [followInfo, setFollowInfo] = useState({ 
    following: false, 
    followerCount: 0, 
    followingCount: 0,
    postCount: 0,
    savedCount: 0,
    emotionEmpathyRate: 0,
    weeklyReactions: 0,
  });
  
  const { member: currentMember, accessToken: token, isLoggedIn } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  // 실제 조회할 ID 결정 (파라미터 없으면 내 ID)
  const targetId = sanitizedHandle || currentMember?.memberId;
  const waitingForAuth = !sanitizedHandle && token && !currentMember;

  // 팔로우 상태 및 카운트 조회 함수
  const fetchFollowStatus = useCallback(() => {
    if (!targetId) return;
    
    // 프로필 페이지에서 내 통계도 정확하게 보여주기 위해 토큰을 함께 보냄
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    axios.get(`${BACKSERVER}/auth/follow/status/${targetId}`, config)
      .then(res => {
        if (res.data.success) {
          setFollowInfo({
            following: res.data.following,
            followerCount: res.data.followerCount,
            followingCount: res.data.followingCount,
            postCount: res.data.postCount,
            savedCount: res.data.savedCount,
            emotionEmpathyRate: res.data.emotionEmpathyRate || 0,
            weeklyReactions: res.data.weeklyReactions || 0,
          });
        }
      })
      .catch(err => console.error('팔로우 상태 조회 실패:', err));
  }, [targetId, BACKSERVER, token]);

  useEffect(() => {
    if (!targetId) {
      if (waitingForAuth) {
        return;
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    // 1. 사용자 기본 정보 조회
    axios.get(`${BACKSERVER}/auth/member/${targetId}`)
      .then(res => {
        if (res.data.success) {
          setUser(res.data.member);
          // 2. 팔로우 정보 조회 (실제 데이터)
          fetchFollowStatus();
        }
      })
      .catch(err => {
        console.error('사용자 정보 조회 실패:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targetId, BACKSERVER, fetchFollowStatus, waitingForAuth]);

  useEffect(() => {
    if (!targetId) {
      if (waitingForAuth) {
        return;
      }
      setPosts([]);
      setPostsLoading(false);
      return;
    }

    setPostsLoading(true);
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    axios.get(`${BACKSERVER}/posts`, { params: { memberId: targetId }, ...config })
      .then(res => {
        if (res.data.success) {
          setPosts(normalizePostDataArray(res.data.results || []));
        } else {
          setPosts([]);
        }
      })
      .catch(err => {
        console.error('프로필 게시물 조회 실패:', err);
        setPosts([]);
      })
      .finally(() => {
        setPostsLoading(false);
      });
  }, [targetId, BACKSERVER, waitingForAuth]);

  // 자신의 프로필인지 확인 (user.memberId가 있으면 그것을 우선 사용, 없으면 currentMember 사용)
  const isOwnProfile = (user?.memberId && currentMember?.memberId && String(user.memberId) === String(currentMember.memberId)) ||
                       (currentMember && String(currentMember.memberId) === String(targetId));

  // 팔로우 처리 함수
  const handleFollowToggle = () => {
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/auth/login');
      return;
    }

    axios.post(`${BACKSERVER}/auth/follow/${targetId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (res.data.success) {
        // 성공 시 로컬 상태 업데이트
        fetchFollowStatus();
      }
    })
    .catch(err => {
      console.error('팔로우 처리 실패:', err);
      alert(err.response?.data?.message || '팔로우 처리 중 오류가 발생했습니다.');
    });
  };

  const handleStatClick = (label) => {
    if (label === '저장됨' && isOwnProfile) navigate('/app/saved');
    if (label === '팔로워') {
      const id = targetId || currentMember?.memberId;
      navigate(`/app/followers/${id}`);
    }
    if (label === '팔로잉') {
      const id = targetId || currentMember?.memberId;
      navigate(`/app/following/${id}`);
    }
  };

  // 활발함 상태 결정
  const getActivityStatus = () => {
    const reactions = followInfo.weeklyReactions;
    if (reactions >= 10) return { emoji: '🔥', text: '활발함' };
    if (reactions >= 5) return { emoji: '⭐', text: '활동중' };
    return { emoji: '😴', text: '조용함' };
  };

  // 인기도 상태 결정
  const getPopularityStatus = () => {
    const postCount = followInfo.postCount;
    if (postCount === 0) return { emoji: '🆕', text: '신규' };
    
    // posts 배열에서 총 좋아요 계산
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const avgLikes = totalLikes / postCount;
    
    if (avgLikes >= 3) return { emoji: '👑', text: '인기' };
    if (avgLikes >= 1) return { emoji: '⭐', text: '인기있음' };
    return { emoji: '📝', text: '신규' };
  };

  if (loading) {
    const loader = <div style={{ padding: '20px', textAlign: 'center' }}>프로필을 불러오는 중...</div>;
    if (!desktop) return <MobileShell title="프로필" hideSearch>{loader}</MobileShell>;
    return <DesktopShell>{loader}</DesktopShell>;
  }

  if (!user) {
    const noUser = <div style={{ padding: '20px', textAlign: 'center' }}>사용자를 찾을 수 없습니다.</div>;
    if (!desktop) return <MobileShell title="프로필" hideSearch>{noUser}</MobileShell>;
    return <DesktopShell>{noUser}</DesktopShell>;
  }

  const displayName = user?.nickname || user?.name || 'MoodCast 사용자';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayText = user?.bio || (isOwnProfile ? '감성을 기록하고 커뮤니티 참여를 즐기는 MoodCast 프로필입니다.' : '안녕하세요! MoodCast 사용자입니다.');
  const profileImageUrl = user?.profileImageUrl || null;
  const profileAvatarSrc = profileImageUrl || defaultAvatarSrc;
  const handleChatClick = () => {
    const searchParams = new URLSearchParams({
      partnerId: String(targetId),
      partnerName: displayName,
    });

    navigate(`/app/chat?${searchParams.toString()}`);
  };

  const content = (
    <section className={styles.wrap}>
      {/* 히어로 섹션 - 풍성하게 수정함 */}
      <article className={styles.hero}>
        <div className={styles.avatar}>
          <img src={profileAvatarSrc} alt={displayName} />
        </div>
        <div className={styles.heroContent}>
          <strong>{displayName}</strong>
          <p>{displayText}</p>
          <span className={styles.handle}>
            @{user?.email ? user.email.split('@')[0] : (user?.memberId || targetId)}
          </span>
        </div>
        
        {isOwnProfile ? (
          <button 
            type="button" 
            className={styles.editBtnRich}
            onClick={() => navigate('/app/profile/edit')}
          >
            프로필 편집
          </button>
        ) : isLoggedIn ? (
          <div className={styles.actionsRich}>
            <button 
              type="button" 
              className={followInfo.following ? styles.unfollowBtnRich : styles.followBtnRich}
              onClick={handleFollowToggle}
            >
              {followInfo.following ? '언팔로우' : '팔로우'}
            </button>
            <button type="button" className={styles.chatBtn} onClick={handleChatClick}>채팅하기</button>
          </div>
        ) : null}
      </article>

      {/* 통계 섹션 - MUI Grid로 개선 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: '게시물', value: followInfo.postCount },
          { label: '저장됨', value: followInfo.savedCount },
          { label: '팔로워', value: followInfo.followerCount },
          { label: '팔로잉', value: followInfo.followingCount },
        ].map((item) => {
          const isClickable = ['저장됨', '팔로워', '팔로잉'].includes(item.label);
          const canClick = isClickable && (item.label !== '저장됨' || isOwnProfile);
          return (
            <Card
              key={item.label}
              onClick={() => canClick && handleStatClick(item.label)}
              sx={{
                cursor: canClick ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100px',
                background: 'rgba(255, 255, 255, 0.28)',
                border: '1px solid rgba(17, 24, 39, 0.085)',
                borderRadius: '16px',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: canClick ? '#f8f9ff' : undefined,
                  transform: canClick ? 'translateY(-2px)' : 'none',
                  boxShadow: canClick ? '0 4px 12px rgba(17, 24, 39, 0.1)' : 'none',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', padding: '20px 12px !important', width: '100%' }}>
                <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1.6rem', lineHeight: 1 }}>
                  {item.label === '저장됨' && !isOwnProfile ? '0' : item.value}
                </Typography>
                <Typography sx={{ color: '#667085', display: 'block', marginTop: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
                  {item.label}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* 하이라이트 섹션 - 4개 개별 카드 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {/* 감정 공감률 */}
        <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px', background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(17,24,39,0.085)', borderRadius: '16px', boxShadow: 'none' }}>
          <CardContent sx={{ textAlign: 'center', padding: '20px 12px !important', width: '100%' }}>
            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1.6rem', lineHeight: 1 }}>
              {followInfo.emotionEmpathyRate}%
            </Typography>
            <Typography sx={{ color: '#667085', marginTop: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
              감정 공감률
            </Typography>
          </CardContent>
        </Card>

        {/* 주간 반응 */}
        <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px', background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(17,24,39,0.085)', borderRadius: '16px', boxShadow: 'none' }}>
          <CardContent sx={{ textAlign: 'center', padding: '20px 12px !important', width: '100%' }}>
            <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '1.6rem', lineHeight: 1 }}>
              {followInfo.weeklyReactions}
            </Typography>
            <Typography sx={{ color: '#667085', marginTop: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
              주간 반응
            </Typography>
          </CardContent>
        </Card>

        {/* 활동 상태 */}
        {(() => {
          const activity = getActivityStatus();
          const ActivityIcon = activity.text === '활발함' ? WhatshotIcon : activity.text === '활동중' ? DirectionsRunIcon : BedtimeIcon;
          const iconColor = activity.text === '활발함' ? '#ff6d00' : activity.text === '활동중' ? '#7c4dff' : '#90a4ae';
          return (
            <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px', background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(17,24,39,0.085)', borderRadius: '16px', boxShadow: 'none' }}>
              <CardContent sx={{ textAlign: 'center', padding: '20px 12px !important', width: '100%' }}>
                <ActivityIcon sx={{ fontSize: '2rem', color: iconColor }} />
                <Typography sx={{ color: '#667085', marginTop: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  {activity.text}
                </Typography>
              </CardContent>
            </Card>
          );
        })()}

        {/* 인기 상태 */}
        {(() => {
          const popularity = getPopularityStatus();
          const PopularityIcon = popularity.text === '인기' ? EmojiEventsIcon : popularity.text === '인기있음' ? GradeIcon : SeedlingIcon;
          const iconColor = popularity.text === '인기' ? '#e65100' : popularity.text === '인기있음' ? '#f9a825' : '#43a047';
          return (
            <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px', background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(17,24,39,0.085)', borderRadius: '16px', boxShadow: 'none' }}>
              <CardContent sx={{ textAlign: 'center', padding: '20px 12px !important', width: '100%' }}>
                <PopularityIcon sx={{ fontSize: '2rem', color: iconColor }} />
                <Typography sx={{ color: '#667085', marginTop: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  {popularity.text}
                </Typography>
              </CardContent>
            </Card>
          );
        })()}
      </Box>

      {/* 최근 게시물 섹션 추가함 */}
      <section className={styles.recent}>
        <div className={styles.sectionHeader}>
          <h2>최근 게시물</h2>
          {isOwnProfile && (
            <button type="button" onClick={() => navigate('/app/write')}>
              + 새 게시물
            </button>
          )}
        </div>
        <div className={styles.postList}>
          {postsLoading ? (
            <div className={styles.emptyState}>게시물을 불러오는 중입니다...</div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <FeedCard key={post.postId} post={post} compact />
            ))
          ) : (
            <div className={styles.emptyState}>작성한 게시물이 없습니다.</div>
          )}
        </div>
      </section>
    </section>
  );

  if (!desktop) return <MobileShell title="프로필" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
