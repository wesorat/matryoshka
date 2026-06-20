import { useState, useEffect, useCallback, useRef } from 'react';
import { slides as defaultSlides } from '../../../data/slides';
import Button from '../../Buttons/Button';
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

  const prevIndex = (activeIndex - 1 + slides.length) % slides.length;
  const nextIndex = (activeIndex + 1) % slides.length;
  const activeSlide = slides[activeIndex];
  const prevSlide = slides[prevIndex];
  const nextSlide = slides[nextIndex];

  return (
    <section
      className={styles.gallery}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.carouselWrapper}>
        <div className={styles.carousel}>
          <article className={`${styles.slide} ${styles.side}`}>
            <img
              src={prevSlide.image}
              // alt={prevSlide.title}
              className={styles.slideImage}
            />
          </article>

          <article className={`${styles.slide} ${styles.active}`}>
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className={styles.slideImage}
            />
            {activeSlide.advantages && (
              <div className={styles.badge}>{activeSlide.advantages}</div>
            )}
            <div className={styles.caption}>
              <h2 className={styles.captionTitle}>{activeSlide.title}</h2>
              <p className={styles.captionDescription}>{activeSlide.description}</p>
            </div>
          </article>

          <article className={`${styles.slide} ${styles.side}`}>
            <img
              src={nextSlide.image}
              // alt={nextSlide.title}
              className={styles.slideImage}
            />
          </article>
        </div>

        <div className={styles.controls}>
          <Button
            type="button"
            variant="nav"
            className={styles.navButton}
            onClick={goToPrev}
            aria-label="Предыдущий слайд"
          >
            ‹
          </Button>
          <Button
            type="button"
            variant="nav"
            className={styles.navButton}
            onClick={goToNext}
            aria-label="Следующий слайд"
          >
            ›
          </Button>
        </div>
      </div>
    </section>
  );
}

export default HeroGallery;