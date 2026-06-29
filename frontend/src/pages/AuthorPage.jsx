import { useState, useEffect } from 'react';
import ProjectCards from '../components/ProjectCards/ProjectCards.jsx';
import Button from '../components/Buttons/Button.jsx';
import { fetchProjectsByUser } from '../api.js';
import styles from './CatPage.module.scss';

function AuthorPage({ userId, onBack, onProjectClick }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchProjectsByUser(userId)
      .then((items) => {
        setProjects(items);
        if (items.length > 0) setAuthor(items[0].owner);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{author ? author.name : 'Автор'}</h1>
        <Button type="button" variant="outline" onClick={onBack}>Назад</Button>
      </div>
      {loading ? (
        <p>Загрузка...</p>
      ) : projects.length === 0 ? (
        <p>Проектов не найдено.</p>
      ) : (
        <ProjectCards projects={projects} onProjectClick={onProjectClick} />
      )}
    </section>
  );
}

export default AuthorPage;