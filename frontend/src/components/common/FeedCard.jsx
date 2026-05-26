import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShareIcon from '@mui/icons-material/Share';
import FlagIcon from '@mui/icons-material/Flag';
import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { CommentModal } from './CommentModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import styles from './FeedCard.module.css';

const EMOTIONS = {
  1: { 
    name: '행복', 
    emoji: '🥰',
    color: '#FFD700', 
    quote: '오늘의 이 행복한 순간을 박제해 볼까요?' 
  },
  2: { 
    name: '슬픔', 
    emoji: '🥺',
    color: '#4A90E2', 
    quote: '무슨 일이 있었나요? 마음속 이야기를 털어놓아도 좋아요.' 
  },
  3: { 
    name: '차분함', 
    emoji: '😌', 
    color: '#F4A460', 
    quote: '잔잔하고 평온한 지금 이 느낌을 그대로 적어보세요.' 
  },
  4: { 
    name: '화남', 
    emoji: '😤',
    color: '#E74C3C', 
    quote: '답답하고 화나는 마음, 여기에 다 쏟아내고 털어버려요!' 
  },
  5: { 
    name: '신남',
    emoji: '🤪', 
    color: '#FF69B4', 
    quote: '텐션 업! 얼마나 짜릿하고 신나는 일인가요?' 
  },
  6: { 
    name: '무감정', 
    emoji: '🫥', 
    color: '#95A5A6', 
    quote: '아무 생각 없는 날도 있죠. 멍하니 흘러간 하루를 기록해요.' 
  }
};
function MoodVisual({ emotionId }) {
  const emotion = EMOTIONS[emotionId] || EMOTIONS[3]; // 기본값: Calm
  return (
    <div className={styles.moodCard} style={{ borderColor: emotion.color, backgroundColor: emotion.color + '15' }}>
      <span className={styles.moodEmoji}>{emotion.emoji}</span>
      <span className={styles.moodLabel}>{emotion.name}</span>
    </div>
  );
}

export function FeedCard({ post, compact = false }) {
  const navigate = useNavigate();
  const { member } = useAuthStore();
  
  // member.nickname으로 비교 (post.author는 nickname 값)
  const currentUser = member?.nickname || '';
  const isOwner = post.author === currentUser;
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState(post.commentsList ?? []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const moreButtonRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (moreButtonRef.current && !moreButtonRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);
  const imageSrc = post.imageSrc ?? post.image ?? post.cover ?? post.thumbnail;

  const openCommentModal = () => {
    setSelectedPost(post);
    setIsCommentModalOpen(true);
  };

  const closeCommentModal = () => {
    setSelectedPost(null);
    setIsCommentModalOpen(false);
  };

  const toggleMenu = () => {
    if (!menuOpen && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuOpen(!menuOpen);
  };

  const postId = post.id ?? post.postId;

  const handleCardClick = () => {
    const postId = post.id ?? post.postId;
    navigate(`/app/post/${postId}`);
  };

  const handleEdit = () => {
    setMenuOpen(false);
    navigate(`/app/post/edit/${postId}`);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setDeleteModalOpen(true);
  };

  const handleShare = () => {
    setMenuOpen(false);
    // 공유 기능 구현
    if (navigator.share) {
      navigator.share({
        title: post.title || '게시물',
        text: post.text,
      });
    } else {
      console.log('공유 기능이 지원되지 않습니다');
    }
  };

  const handleSave = () => {
    setMenuOpen(false);
    console.log('Save post', postId);
  };

  const handleReport = () => {
    setMenuOpen(false);
    console.log('Report post', postId);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  const confirmDelete = () => {
    console.log('Delete post', postId);
    setDeleteModalOpen(false);
  };

  return (
    <>
      <article className={`${styles.card} ${compact ? styles.compact : ''}`} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        <div className={styles.head} onClick={(e) => e.stopPropagation()}>
          <div className={styles.avatar}>{post.avatar}</div>
          <div className={styles.meta}>
            <strong>{post.author}</strong>
            <div className={styles.metaRow}>
              <span>{post.time}</span>
              {post.emotionId && (
                <span className={styles.emotion}>
                  <span className={styles.emotionEmoji}>{EMOTIONS[post.emotionId]?.emoji || EMOTIONS[3].emoji}</span>
                  <span className={styles.emotionText}>{EMOTIONS[post.emotionId]?.name || EMOTIONS[3].name}</span>
                </span>
              )}
            </div>
          </div>
          {/* 메뉴 버튼 - 모든 사용자 표시 */}
          <div className={styles.moreWrapper}>
            <button 
              ref={moreButtonRef}
              type="button" 
              className={styles.more} 
              onClick={toggleMenu} 
              aria-label="더보기"
              onMouseDown={(e) => e.preventDefault()}
            >
              <MoreHorizIcon />
            </button>
            {/* SNS처럼 자연스럽게 떠오르는 메뉴 - Portal로 body에 렌더링하여 overflow 문제 해결 */}
            {menuOpen && ReactDOM.createPortal(
              <div 
                className={styles.moreMenu} 
                style={{ top: menuPos.top, right: menuPos.right }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 작성자만 수정/삭제 가능 */}
                {isOwner && (
                  <>
                    <button type="button" className={styles.menuItem} onClick={handleEdit}>
                      <EditIcon className={styles.menuIcon} />
                      수정
                    </button>
                    <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleDelete}>
                      <DeleteOutlineIcon className={styles.menuIcon} />
                      삭제
                    </button>
                  </>
                )}
                {/* 작성자 아닐 때만 저장/신고 가능 */}
                {!isOwner && (
                  <>
                    <button type="button" className={styles.menuItem} onClick={handleSave}>
                      <BookmarkBorderIcon className={styles.menuIcon} />
                      저장
                    </button>
                    <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleReport}>
                      <FlagIcon className={styles.menuIcon} />
                      신고
                    </button>
                  </>
                )}
                {/* 모든 사용자가 사용 가능 */}
                <button type="button" className={styles.menuItem} onClick={handleShare}>
                  <ShareIcon className={styles.menuIcon} />
                  공유
                </button>
              </div>,
              document.body
            )}
          </div>
        </div>

        {post.title && <p className={styles.title}>{post.title}</p>}
        <p className={styles.text}>{post.text}</p>
        {imageSrc && (
          <div className={styles.postImageWrap}>
            <img className={styles.postImage} src={imageSrc} alt={post.imageAlt ?? post.author} />
          </div>
        )}

        {post.attachments?.length ? (
          <div className={styles.attachmentArea}>
            <strong>첨부파일</strong>
            <ul className={styles.fileList}>
              {post.attachments.map((file) => (
                <li key={file.id} className={styles.attachmentItem}>
                  <span>{file.name}</span>
                  <span>{file.type}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={styles.actions}>
          <span className={styles.reaction}>
            <FavoriteIcon className={styles.heart} />
            {post.likes}
          </span>
          <button type="button" className={styles.reactionButton} onClick={openCommentModal}>
            <ChatBubbleOutlineIcon />
            {comments.length}
          </button>
          <span className={styles.reaction}>
            <AutoAwesomeOutlinedIcon />
            {post.vibes}
          </span>
          <button type="button" className={styles.bookmark} aria-label="저장">
            <BookmarkBorderIcon />
          </button>
        </div>

        {post.previewComment ? (
          <div className={styles.preview}>
            <strong>{post.previewComment.author}</strong>
            <span>{post.previewComment.time}</span>
            <p>{post.previewComment.text}</p>
          </div>
        ) : null}
      </article>

      <CommentModal
        open={isCommentModalOpen}
        post={selectedPost}
        comments={comments}
        onClose={closeCommentModal}
        onSubmit={(nextComment) => setComments((prev) => [...prev, nextComment])}
      />
      <DeleteConfirmModal
        open={deleteModalOpen}
        title="게시물을 삭제하시겠습니까?"
        description="삭제한 게시물은 복구할 수 없습니다. 계속 진행하시겠습니까?"
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </>
  );
}
