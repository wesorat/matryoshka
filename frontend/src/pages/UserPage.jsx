import React, { useState, useEffect } from 'react';
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx';
import Button from '../components/Buttons/Button.jsx';
import ProjectForm from '../components/ProjectForm/ProjectForm.jsx';
import LogPage from './LogPage.jsx'; // Импортируем LogPage для переиспользования формы
import { updateCurrentUser } from '../api.js'; 
import styles from './UserPage.module.scss';

function UserPage({ 
  user = {}, 
  projects = [], 
  loading = false, 
  categories = [],  
  onBack = () => {}, 
  onProjectClick = () => {}, 
  onLogout = () => {},
  onPublishSuccess = () => {},
  onUserUpdate = () => {} 
}) {
  const { name = 'Имя Пользователя', avatar } = user;
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false); // Состояние для открытия модалки редактирования
  const [selectedProject, setSelectedProject] = useState(null);

  const [bio, setBio] = useState(user.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);

  useEffect(() => {
    setBio(user.bio || '');
  }, [user.bio]);

  const handleCreateClick = () => {
    setSelectedProject(null);
    setIsPublishOpen(true);
  };

  const handleSaveBio = async () => {
    setIsEditingBio(false);
    
    if (bio === (user.bio || '')) return;

    try {
      const updatedUser = await updateCurrentUser({ bio: bio });
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
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

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        
        <header className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <img
              src={avatar || 'https://placehold.co/160x160?text=Avatar'}
              alt={name}
              className={styles.avatar}
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
                  className={styles.bioInput} // <-- ИСПРАВЛЕНО: применили правильный класс из SCSS
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
            <Button type="button" variant="outline" onClick={handleCreateClick}>
              Создать проект
            </Button>
            {/* ЗАМЕНЕНО: вместо Статистики теперь Редактировать профиль */}
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

      {/* Модальное окно редактирования профиля на базе формы регистрации */}
      {isEditProfileOpen && (
        <LogPage 
          type="edit" 
          user={user} 
          onBack={() => setIsEditProfileOpen(false)} 
          onSuccess={(freshUserData) => {
            onUserUpdate(freshUserData);
            setIsEditProfileOpen(false); 
          }} 
        />
      )}

      {isPublishOpen && (
        <ProjectForm
          categories={categories}
          project={selectedProject}
          onSuccess={(data) => {
            onPublishSuccess(data);
            setIsPublishOpen(false);
          }}
          onCancel={() => {
            setIsPublishOpen(false);
            setSelectedProject(null);
          }}
        />
      )}
    </section>
  );
}

export default UserPage;