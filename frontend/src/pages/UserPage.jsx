import React, { useState } from 'react';
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx';
import Button from '../components/Buttons/Button.jsx';
import PublishPage from '../components/PublishForm/PublishForm.jsx';
import styles from './UserPage.module.scss';

// 3. Добавили onPublishSuccess в пропсы для будущей интеграции с API
function UserPage({ 
  user = {}, 
  projects = [], 
  loading = false, 
  onBack = () => {}, 
  onProjectClick = () => {}, 
  onLogout = () => {},
  onPublishSuccess = () => {} 
}) {
  const { name = 'Имя Пользователя', avatar } = user;

  // 4. Стейт для управления показом формы публикации
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <div className={styles.profile}>
            <img
              src={avatar || 'https://placehold.co/160x160?text=Avatar'}
              alt={name}
              className={styles.avatar}
            />
            <h3 className={styles.name}>{name}</h3>
          </div>

          <div className={styles.actions}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsPublishOpen(true)}
            >Создать проект</Button>
            <Button type="button" variant="outline">Статистика</Button>
            <Button type="button" variant="outline" onClick={onLogout}>Выйти</Button>
          </div>
        </aside>

        <main className={styles.content}>
          <div className={styles.headerRow}>
            <h2>Опубликованные работы</h2>
            <Button type="button" variant="outline" onClick={onBack}>Назад</Button>
          </div>

          {loading ? (
             <p>Загрузка проектов...</p>
          ) : (
             <ProjectCards projects={projects} onProjectClick={onProjectClick} />
          )}
        </main>
      </div>

      {isPublishOpen && (
        <PublishPage 
          onBack={() => setIsPublishOpen(false)} 
          onSuccess={(formData) => {
            onPublishSuccess(formData); 
            setIsPublishOpen(false); 
          }} 
        />
      )}
    </section>
  )
}

export default UserPage;