import { useState, useEffect, useCallback, useRef } from 'react';
import { slides as defaultSlides } from '../../../data/slides';
import styles from './HeroGallery.module.scss';

const AUTOPLAY_INTERVAL = 5000;

function HeroGallery({ slides = defaultSlides }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    timerRef.current = setInterval(goToNext, AUTOPLAY_INTERVAL);

    return () => clearInterval(timerRef.current);
  }, [isPaused, goToNext, slides.length]);

  if (!slides.length) return null;

  const activeSlide = slides[activeIndex];

  return (
    <section
      className={styles.gallery}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <button
        className={styles.arrowLeft}
        onClick={goToPrev}
        aria-label="Предыдущий слайд"
      >
        ‹
      </button>

      <div className={styles.imageWrapper}>
        <img
          key={activeSlide.id}
          src={activeSlide.image}
          alt={activeSlide.title}
          className={styles.image}
        />
      </div>

      <button
        className={styles.arrowRight}
        onClick={goToNext}
        aria-label="Следующий слайд"
      >
        ›
      </button>

      <div className={styles.info}>
        <h2 className={styles.title}>{activeSlide.title}</h2>
        <p className={styles.description}>{activeSlide.description}</p>
      </div>
    </section>
  );
}

export default HeroGallery;