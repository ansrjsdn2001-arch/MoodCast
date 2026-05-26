import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../stores/useAuthStore';
import { HashtagRow } from './HashtagRow';
import styles from './CommentModal.module.css';

export function CommentModal({ open, post, comments, onClose, onSubmit, onLike, onCommentUpdate }) {
  const navigate = useNavigate();
  const { member, accessToken } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [localComments, setLocalComments] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (open && post) {
      setLiked(Boolean(post.likedByMe));
      setLikesCount(post.likes ?? 0);
    }
  }, [open, post]);

  useEffect(() => {
    setLocalComments(comments ?? []);
  }, [comments]);

  useEffect(() => {
    if (!menuOpenId) return undefined;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

  useEffect(() => {
    if (!open) return undefined;

    const { body, documentElement } = document;
    const prevBody = body.style.overflow;
    const prevHtml = documentElement.style.overflow;
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    body.classList.add('comment-modal-open');

    return () => {
      body.style.overflow = prevBody;
      documentElement.style.overflow = prevHtml;
      body.classList.remove('comment-modal-open');
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setComment('');
  }, [open]);

  if (!open || !post) return null;

  const postProfileLink = post.profileLink ?? (post.memberId ? `/app/user/${post.memberId}` : null);
  const handleEditSave = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`${BACKSERVER}/posts/comments/${commentId}`, { content: editText.trim() }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLocalComments((prev) => prev.map((c) => (c.commentId === commentId ? { ...c, content: editText.trim() } : c)));
      setEditingId(null);
      if (onCommentUpdate) onCommentUpdate();
    } catch {
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`${BACKSERVER}/posts/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLocalComments((prev) => prev.filter((c) => c.commentId !== commentId));
      setMenuOpenId(null);
      if (onCommentUpdate) onCommentUpdate();
    } catch {
      alert('댓글 삭제에 실패했습니다.');
    }
  };  const handleAuthorNavigation = (event, link) => {
    event.stopPropagation();
    if (link) {
      navigate(link);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = comment.trim();
    if (!value) return;

    const nextComment = await onSubmit(value);
    if (nextComment) {
      setComment('');
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <div
              className={styles.avatar}
              onClick={(event) => handleAuthorNavigation(event, postProfileLink)}
              style={postProfileLink ? { cursor: 'pointer' } : {}}
            >
              {post.avatar}
            </div>
            <div>
              <strong
                onClick={(event) => handleAuthorNavigation(event, postProfileLink)}
                style={postProfileLink ? { cursor: 'pointer' } : {}}
              >
                {post.author}
              </strong>
              <p>{post.time}</p>
            </div>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.postSection}>
            <p className={styles.postText}>{post.text}</p>
            <HashtagRow tags={post.tags} variant="modal" />
            {post.imageSrc ? (
              <div
                className={styles.postImageArea}
                onClick={() => post.postId && navigate(`/app/post/${post.postId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') post.postId && navigate(`/app/post/${post.postId}`); }}
                style={{ cursor: 'pointer' }}
              >
                <img className={styles.detailPostImage} src={post.imageSrc} alt={post.imageAlt ?? post.author} />
              </div>
            ) : null}
            <div className={styles.actionRow} aria-label="게시글 반응 영역">
              <button
                type="button"
                className={styles.actionButton}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (onLike) {
                    const result = await onLike(e);
                    if (result !== undefined) {
                      setLiked(result.liked);
                      setLikesCount(result.likes);
                    }
                  }
                }}
              >
                {liked
                  ? <FavoriteIcon style={{ color: '#e74c3c' }} />
                  : <FavoriteBorderIcon style={{ color: '#e74c3c' }} />
                }
                <span>{likesCount}</span>
              </button>
              <button type="button" className={styles.actionButton}>
                <ChatBubbleOutlineIcon />
                <span>{comments.length}</span>
              </button>
              <button type="button" className={styles.actionButton}>
                <ShareOutlinedIcon />
                <span>공유</span>
              </button>
            </div>
          </section>

          <section className={styles.commentsSection}>
            <div className={styles.sectionTitle}>
              <strong>댓글</strong>
              <span>{comments.length}개</span>
            </div>
            <div className={styles.list}>
              {localComments.length ? (
                localComments.map((item) => {
                  const commentProfileLink = item.profileLink ?? (item.memberId ? `/app/user/${item.memberId}` : null);
                  const isMyComment = member && item.memberId && String(item.memberId) === String(member.memberId);
                  return (
                    <article key={item.commentId ?? item.id} className={styles.item}>
                      <div className={styles.itemHead}>
                        <div className={styles.meta}>
                          <div
                            className={styles.commentAvatar}
                            onClick={(event) => handleAuthorNavigation(event, commentProfileLink)}
                            style={commentProfileLink ? { cursor: 'pointer' } : {}}
                          >
                            {item.author?.[0] ?? '?'}
                          </div>
                          <div>
                            <strong
                              onClick={(event) => handleAuthorNavigation(event, commentProfileLink)}
                              style={commentProfileLink ? { cursor: 'pointer' } : {}}
                            >
                              {item.author}
                            </strong>
                            <p>{item.time ?? item.createdAt}</p>
                          </div>
                        </div>
                        {isMyComment && (
                          <div className={styles.commentMenuWrap} ref={menuOpenId === (item.commentId ?? item.id) ? menuRef : null}>
                            <button type="button" className={styles.commentMenuBtn} onClick={() => setMenuOpenId(menuOpenId === (item.commentId ?? item.id) ? null : (item.commentId ?? item.id))}>
                              <MoreHorizIcon fontSize="small" />
                            </button>
                            {menuOpenId === (item.commentId ?? item.id) && (
                              <div className={styles.commentMenu}>
                                <button type="button" onClick={() => { setEditingId(item.commentId ?? item.id); setEditText(item.content ?? item.text ?? ''); setMenuOpenId(null); }}>
                                  <EditIcon fontSize="small" /> 수정
                                </button>
                                <button type="button" className={styles.danger} onClick={() => handleDeleteComment(item.commentId ?? item.id)}>
                                  <DeleteOutlineIcon fontSize="small" /> 삭제
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {editingId === (item.commentId ?? item.id) ? (
                        <div className={styles.editArea}>
                          <textarea
                            className={styles.editInput}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            autoFocus
                          />
                          <div className={styles.editActions}>
                            <button type="button" className={styles.editCancel} onClick={() => setEditingId(null)}>취소</button>
                            <button type="button" className={styles.editSave} onClick={() => handleEditSave(item.commentId ?? item.id)}>저장</button>
                          </div>
                        </div>
                      ) : (
                        <p className={styles.commentText}>{item.content ?? item.text}</p>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className={styles.emptyState}>아직 댓글이 없습니다. 가장 먼저 댓글을 남겨보세요.</div>
              )}
            </div>
          </section>
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="댓글을 입력해 주세요." />
          <div className={styles.footer}>
            <span>{comment.length}/200</span>
            <button type="submit" className={styles.send}>
              <SendOutlinedIcon />
              등록
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
