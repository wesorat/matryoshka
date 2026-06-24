import React, { useState, useEffect, useRef } from 'react';
import styles from './LogPage.module.scss';

export default function LogPage({ type = 'login', onBack = () => {} }) {
   const [isOpen, setIsOpen] = useState(true);
   const [showPassword, setShowPassword] = useState(false);
   const overlayRef = useRef(null);
   const dialogRef = useRef(null);

   const closeModal = () => {
      setIsOpen(false);
      document.body.style.overflow = "";
      onBack();
   };

   useEffect(() => {
      setIsOpen(true);
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
      return () => {
         document.removeEventListener("keydown", handleKeyDown);
      };
   }, [isOpen]);

   return (
      <>
         <div
            id="modalOverlay"
            ref={overlayRef}
            onClick={(e) => e.target.id === "modalOverlay" && closeModal()}
            className={`${styles.overlay} ${!isOpen ? styles.hidden : ""}`}
         >
            <div
               ref={dialogRef}
               role="dialog"
               aria-modal="true"
               aria-labelledby="modal-title"
               tabIndex="-1"
               className={styles.dialog}
            >
               <button type="button" aria-label="Close modal"
                  onClick={closeModal}
                  className={styles.closeBtn}>
                  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 329.269 329">
                     <path d="M194.8 164.77 323.013 36.555c8.343-8.34 8.343-21.825 0-30.164-8.34-8.34-21.825-8.34-30.164 0L164.633 134.605 36.422 6.391c-8.344-8.34-21.824-8.34-30.164 0-8.344 8.34-8.344 21.824 0 30.164l128.21 128.215L6.259 292.984c-8.344 8.34-8.344 21.825 0 30.164a21.27 21.27 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25l128.21-128.214 128.216 128.214a21.27 21.27 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25 8.343-8.34 8.343-21.824 0-30.164zm0 0" />
                  </svg>
               </button>

               <div className={styles.header}>
                  <h3 id="modal-title">
                     {type === 'login' ? 'Sign In' : 'Sign Up'}
                  </h3>
                  <p>
                     {type === 'login'
                        ? 'Login to your account to continue'
                        : 'Create a new account to get started'}
                  </p>
               </div>

               <div className={styles.formContainer}>
                  <form className={styles.form}>
                     {type === 'signup' && (
                        <div className={styles.inputGroup}>
                           <label htmlFor="username">Full Name</label>
                           <input type="text" id="username" name="username" placeholder="John Doe" required
                              className={styles.input} />
                        </div>
                     )}

                     <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="john@example.com" required
                           className={styles.input} />
                     </div>

                     <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <button
                           type="button"
                           aria-label={showPassword ? "Hide password" : "Show password"}
                           aria-pressed={showPassword}
                           aria-controls="password"
                           onClick={() => setShowPassword((prev) => !prev)}
                           className={styles.togglePasswordBtn}>
                           <span className="sr-only">Toggle password visibility</span>
                           {showPassword
                              ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                                 <path d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z" />
                              </svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true">
                                 <path d="m79.891 65.078 7.27-7.27C87.69 59.787 88 61.856 88 64c0 13.234-10.766 24-24 24-2.144 0-4.213-.31-6.192-.839l7.27-7.27a15.93 15.93 0 0 0 14.813-14.813m47.605-3.021c-.492-.885-7.47-13.112-21.11-23.474l-5.821 5.821c9.946 7.313 16.248 15.842 18.729 19.602C114.553 71.225 95.955 96 64 96c-4.792 0-9.248-.613-13.441-1.591l-6.573 6.573C50.029 102.835 56.671 104 64 104c41.873 0 62.633-36.504 63.496-38.057a4 4 0 0 0 0-3.886m-16.668-39.229-88 88C22.047 111.609 21.023 112 20 112s-2.047-.391-2.828-1.172a3.997 3.997 0 0 1 0-5.656l11.196-11.196C10.268 83.049 1.071 66.964.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24c10.827 0 20.205 2.47 28.222 6.122l12.95-12.95c1.563-1.563 4.094-1.563 5.656 0s1.563 4.094 0 5.656M34.333 88.011 44.46 77.884C41.663 73.96 40 69.175 40 64c0-13.234 10.766-24 24-24 5.175 0 9.96 1.663 13.884 4.459l8.189-8.189C79.603 33.679 72.251 32 64 32 32.045 32 13.447 56.775 8.707 63.994c3.01 4.562 11.662 16.11 25.626 24.017m15.934-15.935 21.809-21.809C69.697 48.862 66.958 48 64 48c-8.822 0-16 7.178-16 16 0 2.958.862 5.697 2.267 8.076" />
                              </svg>}
                        </button>

                        <input type={showPassword ? "text" : "password"} id="password" name="password" placeholder="••••••••" required
                           className={styles.input} />
                     </div>

                     {type === 'signup' && (
                        <div className={styles.inputGroup}>
                           <label htmlFor="confirmPassword">Confirm Password</label>
                           <input type={showPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" placeholder="••••••••" required
                              className={styles.input} />
                        </div>
                     )}

                     <button type="submit" className={styles.submitBtn}>
                        {type === 'login' ? 'Sign in' : 'Create Account'}
                     </button>
                  </form>

                  <div className={styles.footer}>
                     <p>
                        {type === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <a href="#">
                           {type === 'login' ? 'Sign Up' : 'Sign In'}
                        </a>
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </>
   );
}