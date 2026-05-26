import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useIsDesktop } from './hooks/useViewportWidth';
import { HomeFeedPage } from './pages/HomeFeed/HomeFeedPage';
import { MobileFeedPage } from './pages/MobileFeed/MobileFeedPage';
import { SavedPage } from './pages/Saved/SavedPage';
import { MoodChatPage } from './pages/MoodChat/MoodChatPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { ProfileEditPage } from './pages/Profile/ProfileEditPage';
import { EditPostPage } from './pages/PostEdit/EditPostPage';
import { PostDetailPage } from './pages/PostDetail/PostDetailPage';
import { FollowersPage } from './pages/Follow/FollowersPage';
import { FollowingPage } from './pages/Follow/FollowingPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SearchPage } from './pages/Search/SearchPage';
import { CreatePostPage } from './pages/CreatePost/CreatePostPage';
import { ProfileSetupPage } from './pages/ProfileSetup/ProfileSetupPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { AdminRoutes } from './pages/Admin/AdminPages';
import { SignupPage } from './pages/Auth/SignupPage';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from './stores/useAuthStore';

function ProfileRedirect() {
  const navigate = useNavigate();
  const { member, accessToken } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!accessToken && member == null) {
      // 로그인 정보가 없는 경우 바로 로그인 화면으로 이동
      navigate('/auth/login', { replace: true });
      return;
    }

    if (accessToken && !member) {
      // 토큰은 있으나 member 정보가 아직 로딩 중인 경우 대기
      return;
    }

    if (member?.memberId) {
      navigate(`/app/user/${member.memberId}`, { replace: true });
    } else {
      navigate('/auth/login', { replace: true });
    }

    setInitialized(true);
  }, [member, accessToken, navigate]);

  return null;
}

function AppRoutes() {
  const desktop = useIsDesktop();
  const { accessToken, member, setAuthData, clearAuthData } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  /*
    새로고침 후 sessionStorage에 남아있는 accessToken이
    서버 기준으로도 유효한지 확인한다.
    initialized 플래그를 사용해서 한 번만 실행되도록 함.
  */
  useEffect(() => {
    if (initialized) {
      return;
    }

    if (!accessToken) {
      setInitialized(true);
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/auth/me`, {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      })
      .then((res) => {
        const loginMember = res.data.member || res.data;
        setAuthData(accessToken, loginMember);
      })
      .catch((err) => {
        // 401(인증 만료)일 때만 로그아웃, 네트워크 오류 등은 기존 토큰 유지
        if (err.response?.status === 401) {
          console.log("토큰 만료 - 로그아웃 처리");
          clearAuthData();
        } else {
          console.log("서버 연결 오류 - 기존 토큰 유지", err.message);
        }
      })
      .finally(() => {
        setInitialized(true);
      });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/feed" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/setup" element={<ProfileSetupPage />} />
      <Route path="/app/login" element={<LoginPage />} />
      <Route path="/app/signup" element={<SignupPage />} />
      <Route path="/app/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/app/feed" element={desktop ? <HomeFeedPage /> : <MobileFeedPage />} />
      <Route path="/app/mobile-feed" element={<MobileFeedPage />} />
      <Route path="/app/saved" element={<SavedPage />} />
      <Route path="/app/mood-chat" element={<MoodChatPage />} />
      <Route path="/app/chat" element={<MoodChatPage />} />
      {/* 마이페이지와 유저페이지를 ProfilePage 하나로 통합함 */}
      <Route path="/app/profile" element={<ProfileRedirect />} />
      <Route path="/app/profile-mobile" element={<ProfileRedirect />} />
      <Route path="/app/profile/edit" element={<ProfileEditPage />} />
      <Route path="/app/post/edit/:postId" element={<EditPostPage />} />
      <Route path="/app/post/:postId" element={<PostDetailPage />} />
      <Route path="/app/followers" element={<FollowersPage />} />
      <Route path="/app/followers/:memberId" element={<FollowersPage />} />
      <Route path="/app/following" element={<FollowingPage />} />
      <Route path="/app/following/:memberId" element={<FollowingPage />} />
      <Route path="/app/user/:handle" element={<ProfilePage />} />
      <Route path="/app/settings" element={<SettingsPage />} />
      <Route path="/app/search" element={<SearchPage />} />
      <Route path="/app/write" element={<CreatePostPage />} />
      <Route path="/app/create" element={<CreatePostPage />} />
      <Route path="/app/mood" element={<Navigate to="/app/write" replace />} />
      <Route path="/app/community" element={<Navigate to="/app/feed" replace />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="*" element={<Navigate to="/app/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
