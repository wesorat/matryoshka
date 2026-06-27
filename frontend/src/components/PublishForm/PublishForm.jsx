import React, { useState, useEffect, useRef } from 'react';
import styles from './PublishForm.module.scss';

export default function PublishPage({ categories = [], onBack = () => {}, onSuccess = () => {} }) {
   const [isOpen, setIsOpen] = useState(true);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   const [formData, setFormData] = useState({
   title: '',
   categoryId: '',
   description: '',
   practicalBenefit: '',
   implementationDetails: '',
   results: '',
   status: 'draft'
});

   // Стейт для медиафайла
   const [mediaFile, setMediaFile] = useState(null);

   const overlayRef = useRef(null);
   const dialogRef = useRef(null);

   const closeModal = () => {
      setIsOpen(false);
      document.body.style.overflow = "";
      onBack();
   };

   useEffect(() => {
      setIsOpen(true);
      setError('');
      setFormData({
      title: '',
      categoryId: '',
      description: '',
      practicalBenefit: '',
      implementationDetails: '',
      results: '',
      status: 'draft'
   });
      setMediaFile(null);
      document.body.style.overflow = "hidden";
      setTimeout(() => dialogRef.current?.focus(), 0);

      return () => {
         document.body.style.overflow = "";
      };
   }, []);

   useEffect(() => {
      const handleKeyDown = (e) => {
         if (!isOpen) return;
         if (e.key === "Escape") closeModal();
         if (e.key === "Tab") {
            const focusable = dialogRef.current?.querySelectorAll(
               "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
            );
            if (!focusable || focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
               e.preventDefault();
               last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
               e.preventDefault();
               first.focus();
            }
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [isOpen]);

   const handleChange = (e) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
   };

   const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
         setMediaFile(e.target.files[0]);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         await onSuccess({ ...formData, media: mediaFile });
         closeModal();
      } catch (err) {
         setError(err.message || 'Произошла ошибка при создании публикации');
      } finally {
         setLoading(false);
      }
   };

   return (
      <>
         <div
            id="modalOverlay"
            ref={overlayRef}
            onClick={(e) => e.target.id === "modalOverlay" && closeModal()}
            className={`${styles.overlay} ${!isOpen ? styles.hidden : ""}`}
         >
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex="-1" className={styles.dialog}>
               <button type="button" aria-label="Close modal" onClick={closeModal} className={styles.closeBtn}>
                  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 329.269 329">
                     <path d="M194.8 164.77 323.013 36.555c8.343-8.34 8.343-21.825 0-30.164-8.34-8.34-21.825-8.34-30.164 0L164.633 134.605 36.422 6.391c-8.344-8.34-21.824-8.34-30.164 0-8.344 8.34-8.344 21.824 0 30.164l128.21 128.215L6.259 292.984c-8.344 8.34-8.344 21.825 0 30.164a21.27 21.27 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25l128.21-128.214 128.216 128.214a21.27 21.27 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25 8.343-8.34 8.343-21.824 0-30.164zm0 0" />
                  </svg>
               </button>

               <div className={styles.header}>
                  <h3 id="modal-title">Новая публикация</h3>
                  <p>Заполните информацию о вашем проекте или исследовании.</p>
               </div>

               <div className={styles.formContainer}>
                  {error && <p style={{ color: '#ff4d4d', marginBottom: '15px', fontSize: '14px' }}>{error}</p>}

                  <form className={styles.form} onSubmit={handleSubmit}>
                     
                     <div className={styles.inputGroup}>
                        <label htmlFor="title">Заголовок</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Название публикации" required className={styles.input} />
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="categoryId">Категория видео</label>
                        <select
                           id="categoryId"
                           name="categoryId"
                           value={formData.categoryId}
                           onChange={handleChange}
                           required
                           className={styles.input}
                        >
                           <option value="" disabled>Выберите категорию</option>
                           {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                 {cat.name || cat.title || `Категория ${cat.id}`}
                              </option>
                           ))}
                        </select>
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="status">Статус публикации</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} required className={styles.input}>
                           <option value="draft">Черновик (Draft)</option>
                           <option value="published">Опубликовано (Published)</option>
                        </select>
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="description">Описание</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Кратко расскажите, о чем публикация" required className={styles.input} rows="3" />
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="practicalBenefit">Практическая польза</label>
                        <textarea id="practicalBenefit" name="practicalBenefit" value={formData.practicalBenefit} onChange={handleChange} placeholder="Какую реальную проблему решает этот материал?" required className={styles.input} rows="3" />
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="implementationDetails">Специфика реализации</label>
                        <textarea id="implementationDetails" name="implementationDetails" value={formData.implementationDetails} onChange={handleChange} placeholder="Особенности разработки, стек, ключевые моменты" required className={styles.input} rows="3" />
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="results">Результативность</label>
                        <textarea id="results" name="results" value={formData.results} onChange={handleChange} placeholder="Метрики, итоги тестов или достигнутый эффект" required className={styles.input} rows="3" />
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="media">Медиафайлы</label>
                        <input type="file" id="media" name="media" onChange={handleFileChange} className={styles.input} />
                     </div>

                     <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitBtn}
                     >
                        {loading ? 'Публикация...' : 'Создать публикацию'}
                     </button>
                  </form>
               </div>
            </div>
         </div>
      </>
   );
}