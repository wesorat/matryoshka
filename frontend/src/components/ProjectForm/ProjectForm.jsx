import { useState, useEffect, useRef } from 'react';
import Button from '../Buttons/Button.jsx';
import StyledSelect from '../StyledSelect/StyledSelect.jsx';
import {
  createProject,
  updateProject,
  createMedia,
  deleteMedia,
  fetchUniversities,
  addProjectTechnology,
  removeProjectTechnology,
} from '../../api.js';
import styles from './ProjectForm.module.scss';

function ProjectForm({ project = null, categories = [], technologies = [], onSuccess, onCancel, onBack }) {
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

  // Уже сохраненные на сервере медиафайлы (доступны только в режиме редактирования,
  // пока проект действительно существует)
  const [mediaList, setMediaList] = useState([]);
  // Медиафайлы, выбранные пользователем, но еще не отправленные на сервер
  // (используется в режиме создания — проекта еще нет, поэтому грузить некуда,
  // но пользователь может подготовить файлы заранее, и они уйдут сразу после
  // успешного создания проекта)
  const [pendingMedia, setPendingMedia] = useState([]);
  const [newMediaFile, setNewMediaFile] = useState(null);
  const [newMediaType, setNewMediaType] = useState('image');
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const [universityId, setUniversityId] = useState('');
  const [universities, setUniversities] = useState([]);

  // Технологии проекта: уже привязанные (id технологий) — множественный выбор
  const [selectedTechIds, setSelectedTechIds] = useState([]);
  // Технологии, которые были у проекта изначально (нужно для вычисления diff при сохранении)
  const [initialTechIds, setInitialTechIds] = useState([]);
  const [techError, setTechError] = useState('');
  const [techBusy, setTechBusy] = useState(false);

  const [techSearch, setTechSearch] = useState('');
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const techDropdownRef = useRef(null);

  const [universitySearch, setUniversitySearch] = useState('');
  const [isUniversityDropdownOpen, setIsUniversityDropdownOpen] = useState(false);
  const universityDropdownRef = useRef(null);

  // Синхронизация данных при открытии формы
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (project) {
        setTitle(project.title || '');
        setDescription(project.description || ''); // <-- ИСПРАВЛЕНО: теперь описание не потеряется при редактировании
        setCategoryId(project.category?.id || project.category_id || project.categoryId || '');
        setStatus(project.status || 'draft');
        setPracticalBenefit(project.practical_benefit || project.practicalBenefit || '');
        setImplementationDetails(project.implementation_details || project.implementationDetails || '');
        setResults(project.results || '');
        setMediaList(project.medias || []);
        setUniversityId(project.university?.id || project.university_id || project.universityId || '');
        setUniversitySearch(project.university?.name || '');
        // Уже привязанные к проекту технологии.
        // Бэкенд отдаёт их в поле project_technologies: [{ technology: { id, name }, project_id }]
        const existingTechIds = (project.project_technologies || [])
          .map((pt) => pt.technology?.id)
          .filter((id) => id !== undefined && id !== null)
          .map(String);
        setSelectedTechIds(existingTechIds);
        setInitialTechIds(existingTechIds);
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
        setSelectedTechIds([]);
        setInitialTechIds([]);
      }
      setPendingMedia([]);
      setNewMediaFile(null);
      setMediaError('');
      setTechError('');
      setError('');
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [project]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (techDropdownRef.current && !techDropdownRef.current.contains(e.target)) {
        setIsTechDropdownOpen(false);
      }
      if (universityDropdownRef.current && !universityDropdownRef.current.contains(e.target)) {
        setIsUniversityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUniversities()
      .then((items) => setUniversities(items))
      .catch((err) => console.error('Не удалось загрузить список вузов:', err));
  }, []);

  const projectId = project?.id || project?._id;

  // В режиме редактирования файл грузится на сервер сразу.
  // В режиме создания проекта еще не существует — файл откладывается
  // в очередь и будет отправлен сразу после успешного создания проекта.
  const handleAddMedia = async () => {
    if (!newMediaFile) return;

    if (projectId) {
      setMediaBusy(true);
      setMediaError('');
      try {
        const uploaded = await createMedia(projectId, newMediaFile, newMediaType);
        setMediaList((prev) => [...prev, uploaded]);
        setNewMediaFile(null);
      } catch (err) {
        setMediaError(err.message || 'Не удалось загрузить файл');
      } finally {
        setMediaBusy(false);
      }
      return;
    }

    setPendingMedia((prev) => [
      ...prev,
      {
        tempId: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: newMediaFile,
        type: newMediaType,
      },
    ]);
    setNewMediaFile(null);
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

  const handleRemovePendingMedia = (tempId) => {
    setPendingMedia((prev) => prev.filter((m) => m.tempId !== tempId));
  };

  // Переключение чекбокса технологии. В режиме создания просто копим id
  // в selectedTechIds — реальные запросы уйдут после создания проекта.
  const handleToggleTechnology = (techId) => {
    const id = String(techId);
    setSelectedTechIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // Применяет разницу между initialTechIds и selectedTechIds к уже существующему
  // проекту: недостающие технологии добавляются, лишние — удаляются.
  const syncProjectTechnologies = async (targetProjectId) => {
    const toAdd = selectedTechIds.filter((id) => !initialTechIds.includes(id));
    const toRemove = initialTechIds.filter((id) => !selectedTechIds.includes(id));

    if (toAdd.length === 0 && toRemove.length === 0) return;

    setTechBusy(true);
    setTechError('');
    try {
      for (const techId of toAdd) {
        await addProjectTechnology(targetProjectId, techId);
      }
      for (const techId of toRemove) {
        await removeProjectTechnology(targetProjectId, techId);
      }
      setInitialTechIds(selectedTechIds);
    } catch (err) {
      setTechError(err.message || 'Не удалось сохранить технологии проекта');
    } finally {
      setTechBusy(false);
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
        await syncProjectTechnologies(projectId);
      } else {
        savedProject = await createProject(projectData);

        // Проект только что создан — теперь можно догрузить отложенные медиафайлы
        const newProjectId = savedProject?.id || savedProject?._id;

        // ...и привязать выбранные технологии (запросы уходят по одному,
        // как и с отложенными медиафайлами выше)
        if (newProjectId && selectedTechIds.length > 0) {
          setTechBusy(true);
          setTechError('');
          const failedTechIds = [];
          for (const techId of selectedTechIds) {
            try {
              await addProjectTechnology(newProjectId, techId);
            } catch (err) {
              console.error('Не удалось привязать технологию:', err);
              failedTechIds.push(techId);
            }
          }
          setTechBusy(false);
          if (failedTechIds.length > 0) {
            setTechError('Не все технологии удалось сохранить. Их можно будет добавить позже через редактирование проекта.');
          }
        }

        if (newProjectId && pendingMedia.length > 0) {
          const uploadedMedia = [];
          const failedUploads = [];

          for (const pm of pendingMedia) {
            try {
              const uploaded = await createMedia(newProjectId, pm.file, pm.type);
              uploadedMedia.push(uploaded);
            } catch (err) {
              console.error('Не удалось загрузить медиафайл:', err);
              failedUploads.push(pm);
            }
          }

          if (uploadedMedia.length > 0) {
            savedProject = { ...savedProject, medias: [...(savedProject.medias || []), ...uploadedMedia] };
          }
          if (failedUploads.length > 0) {
            setMediaError('Не все дополнительные медиафайлы удалось загрузить. Их можно будет добавить позже через редактирование проекта.');
          }
        }
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
              <StyledSelect
                value={categoryId}
                onChange={setCategoryId}
                options={categories}
                placeholder="Выберите категорию"
                getOptionValue={(cat) => cat.id || cat._id}
                getOptionLabel={(cat) => cat.name}
              />
            </div>
          )}
          {universities.length > 0 && (
            <div className={styles.formGroup}>
              <label>Учебное заведение</label>
              <div className={styles.techComboboxWrapper} ref={universityDropdownRef}>
                <input
                  type="text"
                  value={universitySearch}
                  onChange={(e) => {
                    setUniversitySearch(e.target.value);
                    setIsUniversityDropdownOpen(true);
                    setUniversityId('');
                  }}
                  onFocus={() => setIsUniversityDropdownOpen(true)}
                  placeholder="Начните вводить название вуза..."
                  autoComplete="off"
                />

                {isUniversityDropdownOpen && (
                  <ul className={styles.techDropdownMenu}>
                    {universities
                      .filter((uni) => uni.name.toLowerCase().includes(universitySearch.toLowerCase()))
                      .slice(0, 50)
                      .map((uni) => (
                        <li
                          key={uni.id}
                          className={styles.techDropdownItem}
                          onClick={() => {
                            setUniversityId(uni.id);
                            setUniversitySearch(uni.name);
                            setIsUniversityDropdownOpen(false);
                          }}
                        >
                          {uni.name}
                        </li>
                      ))}
                    {universities.filter((uni) =>
                      uni.name.toLowerCase().includes(universitySearch.toLowerCase())
                    ).length === 0 && (
                      <li className={styles.techDropdownNoResults}>Ничего не найдено</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          {technologies.length > 0 && (
            <div className={styles.formGroup}>
              <label>Технологии</label>

              {techError && <div className={styles.errorMessage}>{techError}</div>}

              {selectedTechIds.length > 0 && (
                <div className={styles.techChipsRow}>
                  {selectedTechIds.map((techId) => {
                    const tech = technologies.find((t) => String(t.id || t._id) === techId);
                    if (!tech) return null;
                    return (
                      <span key={techId} className={styles.techChip}>
                        {tech.name}
                        <button
                          type="button"
                          className={styles.techChipRemove}
                          disabled={techBusy}
                          onClick={() => handleToggleTechnology(techId)}
                          aria-label={`Удалить ${tech.name}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className={styles.techComboboxWrapper} ref={techDropdownRef}>
                <input
                  type="text"
                  value={techSearch}
                  onChange={(e) => {
                    setTechSearch(e.target.value);
                    setIsTechDropdownOpen(true);
                  }}
                  onFocus={() => setIsTechDropdownOpen(true)}
                  placeholder="Начните вводить название технологии..."
                  disabled={techBusy}
                  autoComplete="off"
                />

                {isTechDropdownOpen && (
                  <ul className={styles.techDropdownMenu}>
                    {technologies
                      .filter((tech) => {
                        const techId = String(tech.id || tech._id);
                        const alreadySelected = selectedTechIds.includes(techId);
                        const matchesSearch = tech.name.toLowerCase().includes(techSearch.toLowerCase());
                        return !alreadySelected && matchesSearch;
                      })
                      .slice(0, 50)
                      .map((tech) => {
                        const techId = String(tech.id || tech._id);
                        return (
                          <li
                            key={techId}
                            className={styles.techDropdownItem}
                            onClick={() => {
                              handleToggleTechnology(techId);
                              setTechSearch('');
                            }}
                          >
                            {tech.name}
                          </li>
                        );
                      })}
                    {technologies.filter((tech) => {
                      const techId = String(tech.id || tech._id);
                      const alreadySelected = selectedTechIds.includes(techId);
                      const matchesSearch = tech.name.toLowerCase().includes(techSearch.toLowerCase());
                      return !alreadySelected && matchesSearch;
                    }).length === 0 && (
                      <li className={styles.techDropdownNoResults}>Ничего не найдено</li>
                    )}
                  </ul>
                )}
              </div>
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

          <div className={styles.formGroup}>
            <label>Дополнительные медиафайлы</label>

            {mediaError && <div className={styles.errorMessage}>{mediaError}</div>}

            {(mediaList.length > 0 || pendingMedia.length > 0) && (
              <ul className={styles.mediaList}>
                {mediaList.map((m) => (
                  <li key={m.id} className={styles.mediaItem}>
                    <span className={styles.mediaType}>
                      {m.view === 'video' ? 'Видео' : 'Изображение'}
                    </span>
                    <span className={styles.mediaName}>{m.filename}</span>
                    <Button type="button" variant="outline" onClick={() => handleDeleteMedia(m.id)}>
                      Удалить
                    </Button>
                  </li>
                ))}
                {pendingMedia.map((pm) => (
                  <li key={pm.tempId} className={styles.mediaItem}>
                    <span className={styles.mediaType}>
                      {pm.type === 'video' ? 'Видео' : 'Изображение'}
                    </span>
                    <span className={styles.mediaName}>
                      {pm.file.name} <em>(будет загружен после сохранения)</em>
                    </span>
                    <Button type="button" variant="outline" onClick={() => handleRemovePendingMedia(pm.tempId)}>
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

          <div className={styles.actionsRow}>
            <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>
              Отмена
            </Button>
            <Button type="submit" variant="solid" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Опубликовать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;