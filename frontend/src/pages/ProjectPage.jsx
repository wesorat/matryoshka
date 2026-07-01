import React, { useState, useEffect } from 'react';
import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx';
import CategorySection from '../components/CategorySection/CategorySection.jsx';
import Button from '../components/Buttons/Button.jsx';
import { fetchProjectById, updateProject, deleteProject, createLike, deleteLike, createComment, deleteComment, createMedia, deleteMedia } from '../api.js';
import styles from './ProjectPage.module.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ProjectPage({ project: initialProject, projectId, onBack, editMode = false, user = null, onAuthorClick = () => {}, onUserPageClick = () => {}, categories = [] }) {
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState('');

  // Состояния для режима редактирования
  const [isEditing, setIsEditing] = useState(editMode);
  const [editTitle, setEditTitle] = useState('');
  const [editPracticalBenefit, setEditPracticalBenefit] = useState('');
  const [editImplementationDetails, setEditImplementationDetails] = useState('');
  const [editResults, setEditResults] = useState('');
  const [editMedia, setEditMedia] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editStatus, setEditStatus] = useState('draft');
  const [editCategoryId, setEditCategoryId] = useState('');

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [editMediaList, setEditMediaList] = useState([]);
  const [newMediaFile, setNewMediaFile] = useState(null);
  const [newMediaType, setNewMediaType] = useState('image');
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState('');

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
      setLoading(true);
      setError('');
      fetchProjectById(id)
        .then((data) => {
          setProject(data);
        })
        .catch((err) => {
          console.error(err);
          setError('Не удалось загрузить подробную информацию о проекте.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setProject(initialProject);
    }
  }, [projectId, initialProject]);

  // Заполняем поля формы при получении данных проекта
  useEffect(() => {
    if (project) {
      setEditTitle(project.title || '');
      setEditStatus(project.status || 'draft');
      setEditCategoryId(project.category?.id || '');
      setEditPracticalBenefit(project.practical_benefit || project.practicalBenefit || '');
      setEditImplementationDetails(project.implementation_details || project.implementationDetails || '');
      setEditResults(project.results || '');
      setLikeCount(project.like_count || 0);
      setComments(project.comments || []);
      setEditMediaList(project.medias || []);
      // проверяем лайкнул ли текущий пользователь
      if (user && project.comments) {
        // лайки не приходят в ответе напрямую, оставим false по умолчанию
        setLiked(false);
      }
    }
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
  const handleAddMedia = async () => {
    const id = projectId || project?.id || project?._id;
    if (!newMediaFile || !id) return;
    setMediaBusy(true);
    setMediaError('');
    try {
      const media = await createMedia(id, newMediaFile, newMediaType);
      setEditMediaList((prev) => [...prev, media]);
      setNewMediaFile(null);
    } catch (err) {
      setMediaError(err.message || 'Не удалось загрузить файл');
    } finally {
      setMediaBusy(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    const id = projectId || project?.id || project?._id;
    setMediaError('');
    try {
      await deleteMedia(id, mediaId);
      setEditMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err) {
      setMediaError(err.message || 'Не удалось удалить файл');
    }
  };

  // Обработчик отправки формы редактирования
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const id = projectId || project?.id || project?._id;
      const updatedData = {
        title: editTitle,
        categoryId: editCategoryId,
        practicalBenefit: editPracticalBenefit,
        status: editStatus,
        implementationDetails: editImplementationDetails,
        results: editResults,
        media: editMedia, // Файл отправится, только если выбран новый
      };

      const updatedProject = await updateProject(id, updatedData);
      setProject(updatedProject);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить изменения.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- РЕНДЕР: РЕЖИМ РЕДАКТИРОВАНИЯ ---
  if (isEditing) {
    return (
      <section className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Редактирование проекта</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
            Отмена
          </Button>
        </div>

        <form onSubmit={handleSave} className={styles.editForm}>
          <div className={styles.formGroup}>
            <label>Название проекта</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Статус</label>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
            </select>
          </div>

            <div className={styles.formGroup}>
              <label>Категория</label>
              <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

          <div className={styles.formGroup}>
            <label>Главное изображение (выберите файл для замены)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditMedia(e.target.files[0])}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Практическая польза</label>
            <textarea
              value={editPracticalBenefit}
              onChange={(e) => setEditPracticalBenefit(e.target.value)}
              rows={5}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Специфика реализации</label>
            <textarea
              value={editImplementationDetails}
              onChange={(e) => setEditImplementationDetails(e.target.value)}
              rows={5}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Результативность</label>
            <textarea
              value={editResults}
              onChange={(e) => setEditResults(e.target.value)}
              rows={5}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дополнительные медиафайлы</label>

            {mediaError && <div className={styles.errorMessage}>{mediaError}</div>}

            {editMediaList.length > 0 && (
              <ul className={styles.mediaList}>
                {editMediaList.map((media) => (
                  <li key={media.id} className={styles.mediaItem}>
                    <span className={styles.mediaType}>
                      {media.view === 'video' ? 'Видео' : 'Изображение'}
                    </span>
                    <span className={styles.mediaName}>{media.filename}</span>
                    <Button type="button" variant="outline" onClick={() => handleDeleteMedia(media.id)}>
                      Удалить
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.mediaUploadRow}>
              <select value={newMediaType} onChange={(e) => setNewMediaType(e.target.value)}>
                <option value="image">Изображение</option>
                <option value="video">Видео</option>
              </select>
              <input
                type="file"
                accept={newMediaType === 'video' ? 'video/*' : 'image/*'}
                onChange={(e) => setNewMediaFile(e.target.files[0])}
              />
              <Button type="button" variant="outline" onClick={handleAddMedia} disabled={!newMediaFile || mediaBusy}>
                {mediaBusy ? 'Загрузка...' : 'Добавить файл'}
              </Button>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </form>
      </section>
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Дополнительная кнопка редактирования из режима просмотра */}
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

      <HeroGallery slides={slides} />
      <div className={styles.metaRow}></div>

      {practicalBenefit && (
        <>
          <CategorySection title="Практическая польза" showAction={false} />
          <div className={styles.textContent}>
            <p>{practicalBenefit}</p>
          </div>
        </>
      )}

      {implementationDetails && (
        <>
          <CategorySection title="Специфика реализации" showAction={false} />
          <div className={styles.textContent}>
            <p>{implementationDetails}</p>
          </div>
        </>
      )}

      {results && (
        <>
          <CategorySection title="Результативность" showAction={false} />
          <div className={styles.textContent}>
            <p>{results}</p>
          </div>
        </>
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