import { useState, useEffect, useCallback } from 'react';
import Button from '../components/Buttons/Button.jsx';
import {
  fetchAdminUsers, fetchAdminProjects, fetchAdminComments,
  searchUsersByName, searchProjectsByTitle, searchCommentsByText,
  deleteUserAdmin,
} from '../api.js';
import { deleteProject, deleteComment } from '../api.js';
import styles from './AdminPage.module.scss';

const TABS = [
  { key: 'users', label: 'Пользователи' },
  { key: 'projects', label: 'Проекты' },
  { key: 'comments', label: 'Комментарии' },
];

function AdminPage({ onBack }) {
  const [tab, setTab] = useState('users');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (tab === 'users') data = await fetchAdminUsers();
      else if (tab === 'projects') data = await fetchAdminProjects();
      else data = await fetchAdminComments();
      setItems(data);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setSearch('');
    loadAll();
  }, [tab, loadAll]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) return loadAll();

    setLoading(true);
    setError('');
    try {
      let data;
      if (tab === 'users') data = await searchUsersByName(query);
      else if (tab === 'projects') data = await searchProjectsByTitle(query);
      else data = await searchCommentsByText(query);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Ошибка поиска');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const id = item.id || item._id;
    const label = tab === 'users' ? 'пользователя' : tab === 'projects' ? 'проект' : 'комментарий';
    if (!confirm(`Удалить ${label}? Действие необратимо.`)) return;

    try {
      if (tab === 'users') await deleteUserAdmin(id);
      else if (tab === 'projects') await deleteProject(id);
      else await deleteComment(id);
      setItems((prev) => prev.filter((i) => (i.id || i._id) !== id));
    } catch (err) {
      alert(err.message || 'Не удалось удалить');
    }
  };

  const placeholder = {
    users: 'Поиск по имени пользователя...',
    projects: 'Поиск по названию проекта...',
    comments: 'Поиск по тексту комментария...',
  }[tab];

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Админ-панель</h1>
        <Button type="button" variant="outline" onClick={onBack}>Назад</Button>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            type="button"
            variant="outline"
            active={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <form className={styles.searchRow} onSubmit={handleSearch}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className={styles.searchInput}
        />
        <Button type="submit">Найти</Button>
        {search && (
          <Button type="button" variant="outline" onClick={() => { setSearch(''); loadAll(); }}>
            Сбросить
          </Button>
        )}
      </form>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {loading ? (
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p>Ничего не найдено.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                {tab === 'users' && <><th>Имя</th><th>Email</th><th>Вуз</th></>}
                {tab === 'projects' && <><th>Название</th><th>Автор</th><th>Статус</th><th>Лайки</th></>}
                {tab === 'comments' && <><th>Текст</th><th>Автор</th><th>Проект ID</th><th>Дата</th></>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id || item._id}>
                  <td>{item.id || item._id}</td>
                  {tab === 'users' && (
                    <>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.university?.name || '—'}</td>
                    </>
                  )}
                  {tab === 'projects' && (
                    <>
                      <td>{item.title}</td>
                      <td>{item.owner?.name || '—'}</td>
                      <td>{item.status}</td>
                      <td>{item.like_count}</td>
                    </>
                  )}
                  {tab === 'comments' && (
                    <>
                      <td className={styles.commentCell}>{item.text}</td>
                      <td>{item.user?.name || '—'}</td>
                      <td>{item.project_id}</td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                    </>
                  )}
                  <td>
                    <Button type="button" variant="outline" onClick={() => handleDelete(item)}>
                      Удалить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdminPage;