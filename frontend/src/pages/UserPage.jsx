import ProjectCards from '../components/ProjectCards/ProjectCards.jsx'
import Button from '../components/Buttons/Button.jsx'
import styles from './UserPage.module.scss'

function UserPage({ user = {}, projects = [], onBack = () => {}, onProjectClick = () => {} }) {
  const { name = 'Имя Пользователя', avatar } = user

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
            <Button type="button">Опубликовать</Button>
            <Button type="button" variant="outline">Создать проект</Button>
            <Button type="button" variant="outline">Статистика</Button>
          </div>
        </aside>

        <main className={styles.content}>
          <div className={styles.headerRow}>
            <h2>Опубликованные работы</h2>
            <Button type="button" variant="outline" onClick={onBack}>Назад</Button>
          </div>

          <ProjectCards projects={projects} onProjectClick={onProjectClick} />
        </main>
      </div>
    </section>
  )
}

export default UserPage
