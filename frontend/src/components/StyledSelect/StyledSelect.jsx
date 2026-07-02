import { useState, useRef, useEffect } from 'react';
import styles from './StyledSelect.module.scss';

/**
 * Замена нативному <select>.
 *
 * Нативный select сам решает, насколько широко открыть список опций —
 * ориентируясь на самый длинный текст внутри, а не на ширину поля.
 * Из-за этого, например, список вузов (длинные названия) распахивался
 * куда шире самого поля, а список категорий (короткие названия) — нет.
 * Здесь ширина списка всегда равна ширине поля, длинный текст обрезается
 * многоточием, а полное название видно во всплывающей подсказке (title).
 */
function StyledSelect({ value, onChange, options, placeholder = 'Выберите...', getOptionValue = (o) => o.id, getOptionLabel = (o) => o.name }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selectedOption = options.find((o) => String(getOptionValue(o)) === String(value));
  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title={selectedOption ? selectedLabel : undefined}
      >
        <span className={styles.triggerLabel}>{selectedLabel}</span>
        <span className={styles.triggerArrow} aria-hidden="true" />
      </button>

      {isOpen && (
        <ul className={styles.dropdown} role="listbox">
          <li
            className={`${styles.option} ${!value ? styles.optionSelected : ''}`}
            onClick={() => handleSelect('')}
          >
            {placeholder}
          </li>
          {options.map((option) => {
            const optionValue = getOptionValue(option);
            const optionLabel = getOptionLabel(option);
            return (
              <li
                key={optionValue}
                className={`${styles.option} ${String(optionValue) === String(value) ? styles.optionSelected : ''}`}
                onClick={() => handleSelect(optionValue)}
                title={optionLabel}
              >
                {optionLabel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default StyledSelect;