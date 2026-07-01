import React, { useState, useRef, useEffect } from 'react';
import CustomIcon from '../MatrIcon/MatrIcon';
import styles from './SearchPanel.module.scss';

const SearchPanel = ({ categories = [], onSearch, onFilterSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        if (!searchQuery) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  const handlePanelClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleDropdownChange = (e) => {
    const val = e.target.value || null;
    setActiveFilter(val);
    if (onFilterSelect) onFilterSelect(val);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    setActiveFilter(null);
    setIsExpanded(false);
    if (onSearch) onSearch('');
    if (onFilterSelect) onFilterSelect(null);
  };

  return (
    <div 
      ref={panelRef}
      className={`${styles.searchPanel} ${isExpanded ? styles['searchPanel--expanded'] : styles['searchPanel--collapsed']}`}
      onClick={handlePanelClick}
    >
      <div className={styles.searchPanel__mainRow}>
        {isExpanded ? (
          <>
            {/* БЛОК 1: Строка поиска (Занимает остаток — 75% ширины) */}
            <div className={`${styles.searchPanel__glassItem} ${styles['searchPanel__glassItem--input']}`}>
              <input
                type="text"
                className={styles.searchPanel__input}
                placeholder="Что ищем?.."
                value={searchQuery}
                onChange={handleInputChange}
                autoFocus
              />
            </div>

            {/* БЛОК 2: Категории (Занимает 20% ширины) */}
            <div className={`${styles.searchPanel__glassItem} ${styles['searchPanel__glassItem--dropdown']}`}>
              <select
                className={styles.searchPanel__select}
                value={activeFilter || ''}
                onChange={handleDropdownChange}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Все разделы</option>
                {categories.map((category) => {
                  const catId = category.id || category._id;
                  return (
                    <option key={catId} value={catId}>
                      {category.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* БЛОК 3: Матрёшка / Закрытие (Квадрат, занимает 5% ширины) */}
            <div 
              className={`${styles.searchPanel__glassItem} ${styles['searchPanel__glassItem--icon']}`}
              onClick={handleClear}
            >
              {searchQuery ? (
                <span className={styles.searchPanel__closeBtn}>&times;</span>
              ) : (
                <CustomIcon className={styles.searchPanel__matrIcon} />
              )}
            </div>
          </>
        ) : (
          <>
            <span className={styles.searchPanel__placeholder}>ПОИСК</span>
            <div className={styles.searchPanel__iconWrapper}>
              <CustomIcon className={styles.searchPanel__matrIcon} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;