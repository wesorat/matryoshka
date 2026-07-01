import React, { useState, useEffect } from 'react';
import Button from '../Buttons/Button.jsx';
import { createProject, updateProject, createMedia, deleteMedia, fetchUniversities } from '../../api.js';
import styles from './ProjectForm.module.scss';

function ProjectForm({ project = null, categories = [], onSuccess, onCancel, onBack }) {
  const isEditMode = !!project;

  // Защита от нестыковки пропсов: сработает и onCancel, и onBack из UserPage
  const closeForm = onCancel || onBack;

  // Локальные стейты для полей формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [media, setMedia] = useState(null);
  const [practicalBenefit, setPracticalBenefit] = useState('');
  const [implementationDetails, setImplementationDetails] = useState('');
  const [results, setResults] = useState('');
  const [status, setStatus] = useState('draft');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');


  const [mediaList, setMediaList] = useState([]);
  const [newMediaFile, setNewMediaFile] = useState(null);
  const [newMediaType, setNewMediaType] = useState('image');
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const [universityId, setUniversityId] = useState('');
  const [universities, setUniversities] = useState([]);

  // Синхронизация данных при открытии формы
  useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setDescription(project.description || ''); // <-- ИСПРАВЛЕНО: теперь описание не потеряется при редактировании
      setCategoryId(project.category_id || project.categoryId || '');
      setStatus(project.status || 'draft');
      setPracticalBenefit(project.practical_benefit || project.practicalBenefit || '');
      setImplementationDetails(project.implementation_details || project.implementationDetails || '');
      setResults(project.results || project.results || '');
      setMediaList(project.medias || []);
      setUniversityId(project.university?.id || project.university_id || project.universityId || '');
    } else {
      // Сброс полей при создании нового проекта
      setTitle('');
      setDescription('');
      setCategoryId('');
      setStatus('draft');
      setMedia(null);
      setPracticalBenefit('');
      setImplementationDetails('');
      setResults('');
      setMediaList([]);
      setUniversityId('');
    }
    setError('');
  }, [project]);

  useEffect(() => {
    fetchUniversities()
      .then((items) => setUniversities(items))
      .catch((err) => console.error('Не удалось загрузить список вузов:', err));
  }, []);

  const projectId = project?.id || project?._id;

  const handleAddMedia = async () => {
    if (!newMediaFile || !projectId) return;
    setMediaBusy(true);
    setMediaError('');
    try {
      const media = await createMedia(projectId, newMediaFile, newMediaType);
      setMediaList((prev) => [...prev, media]);
      setNewMediaFile(null);
    } catch (err) {
      setMediaError(err.message || 'Не удалось загрузить файл');
    } finally {
      setMediaBusy(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!projectId) return;
    setMediaError('');
    try {
      await deleteMedia(projectId, mediaId);
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err) {
      setMediaError(err.message || 'Не удалось удалить файл');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    // Формируем объект данных для отправки в api.js
    const projectData = {
      title,
      description,
      categoryId,
      status,
      universityId,
      practicalBenefit,
      implementationDetails,
      results,
      media,
    };

    try {
      let savedProject;
      if (isEditMode) {
        const projectId = project.id || project._id;
        savedProject = await updateProject(projectId, projectData);
      } else {
        savedProject = await createProject(projectData);
      }

      if (onSuccess) {
        // ВНИМАНИЕ: Передаем данные с сервера (savedProject), а не функцию создания!
        onSuccess(savedProject);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Не удалось сохранить проект. Попробуйте еще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2>{isEditMode ? 'Редактирование проекта' : 'Создание нового проекта'}</h2>
          <Button type="button" variant="ghost" onClick={closeForm}>✕</Button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleFormSubmit} className={styles.editForm}>
          <div className={styles.formGroup}>
            <label>Название проекта *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Введите название вашего проекта"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Краткое описание проекта *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Кратко расскажите, о чем ваш проект (будет отображаться в карточках)..."
            />
          </div>

          {categories.length > 0 && (
            <div className={styles.formGroup}>
              <label>Категория</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {universities.length > 0 && (
            <div className={styles.formGroup}>
              <label>Учебное заведение</label>
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
              >
                <option value="">Выберите учебное заведение</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>
              {isEditMode ? 'Главное изображение (выберите файл для замены)' : 'Главное изображение'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setMedia(e.target.files[0])}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Практическая польза</label>
            <textarea
              value={practicalBenefit}
              onChange={(e) => setPracticalBenefit(e.target.value)}
              rows={5}
              placeholder="Опишите, какую пользу приносит ваш проект..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Специфика реализации</label>
            <textarea
              value={implementationDetails}
              onChange={(e) => setImplementationDetails(e.target.value)}
              rows={5}
              placeholder="Как устроен проект изнутри, какие технологии использовались..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Результативность</label>
            <textarea
              value={results}
              onChange={(e) => setResults(e.target.value)}
              rows={5}
              placeholder="Чего удалось достичь, метрики, результаты..."
            />
          </div>

          {isEditMode && (
            <div className={styles.formGroup}>
              <label>Дополнительные медиафайлы</label>

              {mediaError && <div className={styles.errorMessage}>{mediaError}</div>}

              {mediaList.length > 0 && (
                <ul className={styles.mediaList}>
                  {mediaList.map((media) => (
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
          )}

          <div className={styles.actionsRow}>
            <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Опубликовать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;