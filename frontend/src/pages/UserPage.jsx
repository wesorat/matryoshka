import { useState, useEffect, useRef } from 'react';
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx';
import Button from '../components/Buttons/Button.jsx';
import ProjectForm from '../components/ProjectForm/ProjectForm.jsx';
import LogPage from './LogPage.jsx';
import { updateCurrentUser, uploadUserAvatar } from '../api.js';
import styles from './UserPage.module.scss';

// Вычисление базового пути до медиа-файлов, как в ProjectCards.jsx
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const mediaBaseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

function UserPage({
  user = {},
  projects = [],
  loading = false,
  categories = [],
  technologies = [],
  onBack = () => {},
  onProjectClick = () => {},
  onCreateProjectClick = null,
  createProjectHref = '/projects/new',
  createProjectOpen = false,
  onCreateProjectClose = null,
  onLogout = () => {},
  onPublishSuccess = () => {},
  onUserUpdate = () => {}
}) {
  const { name = 'Имя Пользователя', avatar, image_url } = user;
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [bio, setBio] = useState(user.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);

  // 1. Добавляем стейт для обхода кэша браузера
  const [avatarTicket, setAvatarTicket] = useState(0);

  // Ссылка на скрытый тег выбора файлов
  const fileInputRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setBio(user.bio || '');
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [user.bio]);

  const isPublishFormOpen = isPublishOpen || createProjectOpen;

  const closePublishForm = () => {
    setIsPublishOpen(false);
    setSelectedProject(null);
    if (onCreateProjectClose) {
      onCreateProjectClose();
    }
  };

  const handleCreateClick = (event) => {
    if (onCreateProjectClick) {
      onCreateProjectClick(event);
      return;
    }

    setSelectedProject(null);
    setIsPublishOpen(true);
  };

  const handleSaveBio = async () => {
    setIsEditingBio(false);
    if (bio === (user.bio || '')) return;

    try {
      const updatedUser = await updateCurrentUser({ bio: bio });
      if (onUserUpdate) {
        onUserUpdate({ ...user, ...updatedUser });
      }
    } catch (err) {
      console.error("Ошибка при сохранении биографии:", err);
      alert("Не удалось сохранить описание. Попробуйте позже.");
      setBio(user.bio || '');
    }
  };

  const handleBioKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveBio();
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите корректное изображение.');
      e.target.value = ''; // Сброс инпута
      return;
    }

    try {
      const updatedData = await uploadUserAvatar(file);

      if (onUserUpdate) {
        // Слияние старых данных пользователя и ответа от бэкенда
        onUserUpdate({ ...user, ...updatedData });
      }

      // 2. Обновляем тикет времени, чтобы заставить браузер сделать новый GET-запрос картинки
      setAvatarTicket(Date.now());

    } catch (err) {
      console.error("Ошибка при загрузке аватарки:", err);
      alert("Не удалось обновить аватарку. Попробуйте позже.");
    } finally {
      // 3. Обязательно очищаем инпут, чтобы событие onChange срабатывало при повторном выборе того же файла
      e.target.value = '';
    }
  };

  // 4. Дописываем ?t=таймстамп к URL картинки для обхода кэша
  const currentAvatarName = image_url || avatar;
  const avatarSrc = currentAvatarName
    ? `${mediaBaseUrl}/media/uploads/${currentAvatarName}?t=${avatarTicket}`
    : 'https://placehold.co/160x160?text=Avatar';

  return (
    <section className={styles.page}>
      <div className={styles.container}>

        <header className={styles.profileHeader}>
          {/* Интерактивный аватар */}
          <div
            className={styles.avatarWrapper}
            onClick={handleAvatarClick}
            style={{ cursor: 'pointer' }}
            title="Нажмите, чтобы изменить аватарку"
          >
            <img
              src={avatarSrc}
              alt={name}
              className={styles.avatar}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{name}</h1>

            <p className={styles.universityText}>
              {user.university?.name ? `Студент ${user.university.name}` : 'Студент'}
            </p>

            <div className={styles.bioBlock}>
              {isEditingBio ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  onKeyDown={handleBioKeyDown}
                  onBlur={handleSaveBio}
                  autoFocus
                  className={styles.bioInput}
                  maxLength={300}
                  rows={3}
                />
              ) : (
                <p
                  className={styles.bioText}
                  onClick={() => setIsEditingBio(true)}
                  title="Кликните для редактирования"
                >
                  {bio || 'Расскажите о себе по-подробнее'}
                </p>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" href={createProjectHref} onClick={handleCreateClick}>
              Создать проект
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(true)}>
              Редактировать профиль
            </Button>
            <Button type="button" variant="outline" onClick={onLogout}>Выйти</Button>
          </div>
        </header>

        <main className={styles.content}>
          <div className={styles.headerRow}>
            <h2>Опубликованные работы</h2>
            <Button type="button" variant="outline" onClick={onBack}>Назад</Button>
          </div>

          {loading ? (
             <p>Загрузка проектов...</p>
          ) : (
             <ProjectCards
               projects={projects}
               onProjectClick={onProjectClick}
             />
          )}
        </main>
      </div>

      {isEditProfileOpen && (
        <LogPage
          type="edit"
          user={user}
          onBack={() => setIsEditProfileOpen(false)}
          onSuccess={(freshUserData) => {
            onUserUpdate({ ...user, ...freshUserData });
            setIsEditProfileOpen(false);
          }}
        />
      )}

      {isPublishFormOpen && (
        <ProjectForm
          categories={categories}
          technologies={technologies}
          project={createProjectOpen ? null : selectedProject}
          onSuccess={(data) => {
            onPublishSuccess(data);
            closePublishForm();
          }}
          onCancel={closePublishForm}
        />
      )}
    </section>
  );
}

export default UserPage;
