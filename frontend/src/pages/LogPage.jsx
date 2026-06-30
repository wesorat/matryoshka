import React, { useState, useEffect, useRef } from 'react';
import styles from './LogPage.module.scss';
import { login, register, fetchCurrentUser, fetchUniversities } from '../api.js';

export default function LogPage({ type = 'login', onBack = () => {}, onSuccess = () => {} }) {
   const [isOpen, setIsOpen] = useState(true);
   const [showPassword, setShowPassword] = useState(false);

   // Состояния для кастомного ComboBox
   const [universities, setUniversities] = useState([]);
   const [universitySearch, setUniversitySearch] = useState('');
   const [isDropdownOpen, setIsDropdownOpen] = useState(false);

   // Стейт полей формы
   const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', universityId: '' });
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const [acceptedPolicy, setAcceptedPolicy] = useState(false);

   const overlayRef = useRef(null);
   const dialogRef = useRef(null);
   const dropdownRef = useRef(null);

   const closeModal = () => {
      setIsOpen(false);
      document.body.style.overflow = "";
      onBack();
   };

   // Эффект закрытия выпадающего списка при клике в любое другое место экрана
   useEffect(() => {
      const handleClickOutside = (e) => {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsDropdownOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   useEffect(() => {
      setIsOpen(true);
      setError('');
      setAcceptedPolicy(false);
      // Сброс состояний формы и поиска
      setFormData({ name: '', email: '', password: '', confirmPassword: '', universityId: '' });
      setUniversitySearch('');
      setIsDropdownOpen(false);
      document.body.style.overflow = "hidden";
      setTimeout(() => dialogRef.current?.focus(), 0);

      if (type === 'signup') {
         fetchUniversities()
            .then(data => setUniversities(data))
            .catch(err => {
               console.error("Не удалось загрузить список университетов", err);
               setError("Ошибка при загрузке списка учебных заведений");
            });
      }

      return () => {
         document.body.style.overflow = "";
      };
   }, [type]);

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

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      if (type === 'signup' && !acceptedPolicy) {
         setError('необходимо согласиться с политикой обработки персональных данных');
         return;
      }
      // Валидация выбора университета из выпадающего списка
      if (type === 'signup' && !formData.universityId) {
         setError('Пожалуйста, выберите учебное заведение из предложенного списка');
         return;
      }
      setLoading(true);

      try {
         if (type === 'signup') {
            if (formData.password !== formData.confirmPassword) {
               throw new Error("Пароли не совпадают");
            }
            // 1. Регистрируем с universityId
            await register(formData.email, formData.password, formData.name, formData.universityId);
            // 2. Сразу авторизуем после успешной регистрации
            await login(formData.email, formData.password);
         } else {
            await login(formData.email, formData.password);
         }

         const userData = await fetchCurrentUser();
         onSuccess(userData);
      } catch (err) {
         setError(err.message || 'Произошла ошибка при авторизации');
      } finally {
         setLoading(false);
      }
   };

   // Фильтрация списка вузов по мере ввода текста пользователем
   const filteredUniversities = universities.filter(uni => {
      const name = (uni.name || uni.title || '').toLowerCase();
      return name.includes(universitySearch.toLowerCase());
   });

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
                  <h3 id="modal-title">{type === 'login' ? 'Вход' : 'Регистрация'}</h3>
                  <p>{type === 'login' ? 'Войдите в свой профиль.' : 'Создайте новый аккаунт и делитесь своими работами!'}</p>
               </div>

               <div className={styles.formContainer}>
                  {error && <p style={{ color: '#ff4d4d', marginBottom: '15px', fontSize: '14px' }}>{error}</p>}

                  <form className={styles.form} onSubmit={handleSubmit}>
                     {type === 'signup' && (
                        <div className={styles.inputGroup}>
                           <label htmlFor="name">Как к Вам обращаться?</label>
                           <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Имя Фамилия" required className={styles.input} />
                        </div>
                     )}

                     {/* РЕАЛИЗАЦИЯ ВАРИАНТА 3: ComboBox с живым поиском */}
                     {type === 'signup' && (
                        <div className={styles.inputGroup}>
                           <label htmlFor="universitySearch">Учебное заведение</label>
                           <div className={styles.comboboxWrapper} ref={dropdownRef}>
                              <input
                                 type="text"
                                 id="universitySearch"
                                 name="universitySearch"
                                 value={universitySearch}
                                 onChange={(e) => {
                                    setUniversitySearch(e.target.value);
                                    setIsDropdownOpen(true);
                                    // Сбрасываем id, если пользователь стёр/изменил строку, чтобы заставить выбрать элемент из списка
                                    setFormData(prev => ({ ...prev, universityId: '' }));
                                 }}
                                 onFocus={() => setIsDropdownOpen(true)}
                                 placeholder="Начните вводить название (например, МГТУ)..."
                                 required
                                 className={styles.input}
                                 autoComplete="off"
                              />
                              
                              {isDropdownOpen && (
                                 <ul className={styles.dropdownMenu}>
                                    {filteredUniversities.length > 0 ? (
                                       filteredUniversities.map((uni) => {
                                          const uniName = uni.name || uni.title;
                                          const isSelected = formData.universityId === uni.id;
                                          return (
                                             <li
                                                key={uni.id}
                                                className={`${styles.dropdownItem} ${isSelected ? styles.selected : ''}`}
                                                onClick={() => {
                                                   setUniversitySearch(uniName);
                                                   setFormData(prev => ({ ...prev, universityId: uni.id }));
                                                   setIsDropdownOpen(false);
                                                }}
                                             >
                                                {uniName}
                                             </li>
                                          );
                                       })
                                    ) : (
                                       <li className={styles.dropdownNoResults}>Ничего не найдено</li>
                                    )}
                                 </ul>
                              )}
                           </div>
                        </div>
                     )}

                     <div className={styles.inputGroup}>
                        <label htmlFor="email">Почта</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="matryoshka@example.com" required className={styles.input} />
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="password">Пароль</label>
                        <button
                           type="button"
                           aria-label={showPassword ? "Спрятать" : "Показать"}
                           aria-pressed={showPassword}
                           aria-controls="password"
                           onClick={() => setShowPassword((prev) => !prev)}
                           className={styles.togglePasswordBtn}>
                           {showPassword ? "Скрыть" : "Показать"}
                        </button>
                        <input type={showPassword ? "text" : "password"} id="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required className={styles.input} />
                     </div>

                     {type === 'signup' && (
                        <div className={styles.inputGroup}>
                           <label htmlFor="confirmPassword">Повторите пароль</label>
                           <input
                              type={showPassword ? "text" : "password"}
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder="••••••••"
                              required
                              className={styles.input}
                           />
                        </div>
                     )}

                     {type === 'signup' && (
                        <div className={styles.checkboxGroup}>
                           <input
                              type="checkbox"
                              id="policy"
                              checked={acceptedPolicy}
                              onChange={(e) => setAcceptedPolicy(e.target.checked)}
                              required
                              className={styles.checkbox}
                           />
                           <label htmlFor="policy" className={styles.checkboxLabel}>
                              Соглашаюсь с{' '}
                              <a href="#" className={styles.policyLink} onClick={(e) => e.preventDefault()}>
                                 политикой обработки персональных данных
                              </a>
                           </label>
                        </div>
                     )}

                     <button
                        type="submit"
                        disabled={loading || (type === 'signup' && !acceptedPolicy)}
                        className={styles.submitBtn}
                     >
                        {loading ? 'Processing...' : (type === 'login' ? 'Войти' : 'Создать')}
                     </button>
                  </form>
               </div>
            </div>
         </div>
      </>
   );
}