import { useState, useEffect } from 'react';
import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx';
import CategorySection from '../components/CategorySection/CategorySection.jsx';
import Button from '../components/Buttons/Button.jsx';
import ProjectForm from '../components/ProjectForm/ProjectForm.jsx';
import { fetchProjectById, deleteProject, createLike, deleteLike, createComment, deleteComment } from '../api.js';
import styles from './ProjectPage.module.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ProjectPage({ project: initialProject, projectId, onBack, editMode = false, user = null, onAuthorClick = () => {}, onUserPageClick = () => {}, categories = [], technologies = [] }) {
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState('');

  // Режим редактирования — сама форма теперь общая (ProjectForm),
  // здесь остаётся только флаг, что мы сейчас её показываем
  const [isEditing, setIsEditing] = useState(editMode);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        await deleteLike(project.id);
        setLikeCount(prev => prev - 1);
      } else {
        await createLike(project.id);
        setLikeCount(prev => prev + 1);
      }
      setLiked(prev => !prev);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const newComment = await createComment(project.id, commentText);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const id = projectId || initialProject?.id || initialProject?._id;
    if (id && (!initialProject || (!initialProject.practical_benefit && !initialProject.practicalBenefit))) {
      let mounted = true;
      const timeoutId = setTimeout(() => {
        if (!mounted) return;
        setLoading(true);
        setError('');
      }, 0);
      fetchProjectById(id)
        .then((data) => {
          if (mounted) setProject(data);
        })
        .catch((err) => {
          console.error(err);
          if (mounted) setError('Не удалось загрузить подробную информацию о проекте.');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
      return () => {
        mounted = false;
        clearTimeout(timeoutId);
      };
    } else {
      const timeoutId = setTimeout(() => {
        setProject(initialProject);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [projectId, initialProject]);

  // Заполняем состояния просмотра (лайки, комментарии) при получении данных проекта.
  // Поля самой формы редактирования заполняет ProjectForm — ему нужен только project.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (project) {
        setLikeCount(project.like_count || 0);
        setComments(project.comments || []);
        setLiked(false);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [project]);

  if (loading) {
    return (
      <section className={styles.empty}>
        <h1>Загрузка проекта...</h1>
      </section>
    );
  }

  if (error || !project) {
    return (
      <section className={styles.empty}>
        <h1>{error || 'Проект не найден'}</h1>
        <Button type="button" variant="outline" onClick={onBack}>
          Вернуться
        </Button>
      </section>
    );
  }
  // --- РЕНДЕР: РЕЖИМ РЕДАКТИРОВАНИЯ ---
  // Используем тот же компонент ProjectForm, что и при создании проекта в UserPage —
  // это гарантирует одинаковый набор полей и одинаковое поведение в обоих местах.
  if (isEditing) {
    return (
      <ProjectForm
        project={project}
        categories={categories}
        technologies={technologies}
        onSuccess={async () => {
          setIsEditing(false);
          setLoading(true);
          try {
            const freshProject = await fetchProjectById(project.id || project._id);
            setProject(freshProject);
          } catch (err) {
            console.error('Не удалось обновить данные проекта:', err);
          } finally {
            setLoading(false);
          }
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  // --- РЕНДЕР: ОБЫЧНЫЙ ПРОСМОТР ---
  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    if (cleanUrl.startsWith('media/uploads/')) {
      return `${API_URL}/${cleanUrl}`;
    }
    return `${API_URL}/media/uploads/${cleanUrl}`;
  };

  const slides = [];
  const mainImage = project.image_url || project.image || project.file_path || project.file;
  if (mainImage) {
    slides.push({
      image: getMediaUrl(mainImage),
      type: 'image',
      title: '',
      description: ''
    });
  }

  if (project.medias && Array.isArray(project.medias)) {
    project.medias.forEach((media) => {
      const mediaUrl = typeof media === 'string'
        ? media
        : (media.filename || media.url || media.image_url || media.file_path || media.file);
      if (mediaUrl) {
        slides.push({
          image: getMediaUrl(mediaUrl),
          type: media.view === 'video' ? 'video' : 'image',
          title: '',
          description: ''
        });
      }
    });
  }

  if (slides.length === 0) {
    slides.push({
      image: 'https://placehold.co/1200x600?text=Нет+изображения',
      type: 'image',
      title: '',
      description: ''
    });
  }

  const practicalBenefit = project.practical_benefit || project.practicalBenefit;
  const implementationDetails = project.implementation_details || project.implementationDetails;
  const results = project.results;

  return (
    <section className={styles.page}>


      <HeroGallery slides={slides} />
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.subtitle}>
            {project.subtitle ? (
              (() => {
                const parts = project.subtitle.split('·').map((s) => s.trim());
                const first = parts[0];
                const rest = parts.slice(1).join(' · ');
                const authorMatch = /Автор\s*(.+)/i.exec(rest);
                const authorName = authorMatch ? authorMatch[1].trim() : null;

                return (
                  <>
                    <span>{first}</span>
                    {authorName && (
                      <span>
                        {' · '}
                        <button type="button" className={styles.author}>
                          {authorName}
                        </button>
                      </span>
                    )}
                  </>
                );
              })()
            ) : (
              <>
                {project.category?.name && <span>{project.category.name}</span>}
                {project.university?.name && (
                  <span>{project.category?.name ? ' · ' : ''}{project.university.name}</span>
                )}
                {project.owner?.name && (
                  <span>
                    {' · Автор: '}
                    <button
                      type="button"
                      className={styles.author}
                      onClick={() => {
                        if (user && project.owner && user.id === project.owner.id) {
                          onUserPageClick();
                        } else {
                          onAuthorClick(project.owner.id);
                        }
                      }}
                    >
                      {project.owner.name}
                    </button>
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user && project.owner && user.id === project.owner.id && (
            <>
              <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
              <Button type="button" variant="outline" onClick={async () => {
                if (!confirm('Удалить проект?')) return;
                await deleteProject(project.id);
                onBack();
              }}>
                Удалить
              </Button>
            </>
          )}
        </div>
      </div>
      <div className={styles.metaRow}></div>

      {/* Помещаем CategorySection внутрь textContent для эффекта единого контейнера */}
      {practicalBenefit && (
        <div className={styles.textContent}>
          <CategorySection title="Практическая польза" showAction={false} />
          <p>{practicalBenefit}</p>
        </div>
      )}

      {implementationDetails && (
        <div className={styles.textContent}>
          <CategorySection title="Специфика реализации" showAction={false} />
          <p>{implementationDetails}</p>
        </div>
      )}

      {results && (
        <div className={styles.textContent}>
          <CategorySection title="Результативность" showAction={false} />
          <p>{results}</p>
        </div>
      )}
      {project.project_technologies && project.project_technologies.length > 0 && (
        <div className={styles.textContent}>
          <CategorySection title="Технологии" showAction={false} />
          <div className={styles.techTags}>
            {project.project_technologies.map((pt) => (
              <span key={pt.technology.id} className={styles.techTag}>
                {pt.technology.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className={styles.likeRow}>
          <button
            className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
            onClick={handleLike}
            disabled={!user}
            title={!user ? 'Войдите чтобы поставить лайк' : ''}
          >
            ♥ {likeCount}
          </button>
        </div>

        <div className={styles.comments}>
          <h3>Комментарии</h3>
          {user ? (
            <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Напишите комментарий..."
                rows={3}
              />
              <Button type="submit" disabled={commentLoading}>
                {commentLoading ? 'Отправка...' : 'Отправить'}
              </Button>
            </form>
          ) : (
            <p className={styles.authNote}>Войдите чтобы оставить комментарий</p>
          )}

          <div className={styles.commentList}>
            {comments.map((comment) => (
              <div key={comment.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.user?.name}</span>
                  <span className={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {user && (comment.user?.id === user.id || project.owner?.id === user.id) && (
                    <button className={styles.deleteComment} onClick={() => handleDeleteComment(comment.id)}>✕</button>
                  )}
                </div>
                <p className={styles.commentText}>{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
    </section>
  );
}

export default ProjectPage;