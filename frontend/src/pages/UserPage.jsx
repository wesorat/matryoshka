import React, { useState } from 'react';
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx';
import Button from '../components/Buttons/Button.jsx';
import PublishPage from '../components/PublishForm/PublishForm.jsx';
import ProjectForm from '../components/ProjectForm/ProjectForm.jsx';
import styles from './UserPage.module.scss';

function UserPage({ 
  user = {}, 
  projects = [], 
  loading = false, 
  categories = [],  
  onBack = () => {}, 
  onProjectClick = () => {}, 
  onLogout = () => {},
  onPublishSuccess = () => {} 
}) {
  const { name = 'Имя Пользователя', avatar } = user;
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Обработчик для создания нового проекта
  const handleCreateClick = () => {
    setSelectedProject(null);
    setIsPublishOpen(true);
  };
  
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
              onClick={handleCreateClick}
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
             <ProjectCards 
               projects={projects} 
               onProjectClick={onProjectClick} 
             />
          )}
        </main>
      </div>

      {isPublishOpen && (
        <ProjectForm
          categories={categories}
          project={selectedProject} // Передаем выбранный проект (null при создании, объект при редактировании)
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
  )
}

export default UserPage;