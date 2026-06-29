import React, { useState, useEffect } from 'react';
import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx';
import CategorySection from '../components/CategorySection/CategorySection.jsx';
import Button from '../components/Buttons/Button.jsx';
import { fetchProjectById, updateProject } from '../api.js';
import styles from './ProjectPage.module.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ProjectPage({ project: initialProject, projectId, onBack, editMode = false, user = null, onAuthorClick = () => {}, onUserPageClick = () => {} }) {
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
      setEditPracticalBenefit(project.practical_benefit || project.practicalBenefit || '');
      setEditImplementationDetails(project.implementation_details || project.implementationDetails || '');
      setEditResults(project.results || '');
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

  // Обработчик отправки формы редактирования
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const id = projectId || project?.id || project?._id;
      const updatedData = {
        title: editTitle,
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
      title: '',
      description: ''
    });
  }

  if (project.medias && Array.isArray(project.medias)) {
    project.medias.forEach((media, index) => {
      const mediaUrl = typeof media === 'string' ? media : (media.url || media.image_url || media.file_path || media.file);
      if (mediaUrl) {
        slides.push({
          image: getMediaUrl(mediaUrl),
          title: '',
          description: ''
        });
      }
    });
  }

  if (slides.length === 0) {
    slides.push({
      image: 'https://placehold.co/1200x600?text=Нет+изображения',
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
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              Редактировать
            </Button>
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
    </section>
  );
}

export default ProjectPage;