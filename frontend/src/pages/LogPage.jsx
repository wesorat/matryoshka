import React, { useState, useEffect, useRef } from 'react';
import styles from './LogPage.module.scss';
import { login, register, fetchCurrentUser } from '../api';

export default function LogPage({ type = 'login', onBack = () => {}, onSuccess = () => {} }) {
   const [isOpen, setIsOpen] = useState(true);
   const [showPassword, setShowPassword] = useState(false);
   
   // Стейт формы
   const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   
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
      document.body.style.overflow = "hidden";
      setTimeout(() => dialogRef.current?.focus(), 0);

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
      setFormData({ ...formData, [e.target.name]: e.target.value });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         if (type === 'signup') {
            if (formData.password !== formData.confirmPassword) {
               throw new Error("Пароли не совпадают");
            }
            // Регистрация
            await register(formData.email, formData.password, formData.name);
            // Сразу логинимся после регистрации
            await login(formData.email, formData.password);
         } else {
            // Обычный логин
            await login(formData.email, formData.password);
         }

         // Запрашиваем данные юзера и передаем наверх
         const user = await fetchCurrentUser();
         onSuccess(user);
         
      } catch (err) {
         setError(err.message || 'Произошла ошибка');
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
            <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex="-1" className={styles.dialog}>
               <button type="button" onClick={closeModal} className={styles.closeBtn}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 329.269 329">
                     <path d="M194.8 164.77 323.013 36.555c8.343-8.34 8.343-21.825 0-30.164-8.34-8.34-21.825-8.34-30.164 0L164.633 134.605 36.422 6.391c-8.344-8.34-21.824-8.34-30.164 0-8.344 8.34-8.344 21.824 0 30.164l128.21 128.215L6.259 292.984c-8.344 8.34-8.344 21.825 0 30.164a21.27 21.27 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25l128.21-128.214 128.216 128.214a21.27 21.27 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25 8.343-8.34 8.343-21.824 0-30.164zm0 0" />
                  </svg>
               </button>

               <div className={styles.header}>
                  <h3 id="modal-title">{type === 'login' ? 'Sign In' : 'Sign Up'}</h3>
                  <p>{type === 'login' ? 'Login to your account to continue' : 'Create a new account to get started'}</p>
               </div>

               <div className={styles.formContainer}>
                  {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
                  
                  <form className={styles.form} onSubmit={handleSubmit}>
                     {type === 'signup' && (
                        <div className={styles.inputGroup}>
                           <label htmlFor="name">Full Name</label>
                           <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required className={styles.input} />
                        </div>
                     )}

                     <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required className={styles.input} />
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <button type="button" onClick={() => setShowPassword((prev) => !prev)} className={styles.togglePasswordBtn}>
                           <span className="sr-only">Toggle password visibility</span>
                           {showPassword ? "Hide" : "Show"} {/* Упростил для читаемости, верни свои SVG */}
                        </button>
                        <input type={showPassword ? "text" : "password"} id="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required className={styles.input} />
                     </div>

                     {type === 'signup' && (
                        <div className={styles.inputGroup}>
                           <label htmlFor="confirmPassword">Confirm Password</label>
                           <input type={showPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required className={styles.input} />
                        </div>
                     )}

                     <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Загрузка...' : (type === 'login' ? 'Sign in' : 'Create Account')}
                     </button>
                  </form>
               </div>
            </div>
         </div>
      </>
   );
}