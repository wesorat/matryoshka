import React, { useState, useRef, useEffect } from 'react';
import CustomIcon from '../MatrIcon/MatrIcon';
import styles from './SearchPanel.module.scss';

const SearchPanel = ({ categories = [], onSearch, onFilterSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  
  const panelRef = useRef(null);
  const dropdownRef = useRef(null); // ИСПРАВЛЕНО: Реф для кнопки селекта

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Закрытие всей панели
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        if (!searchQuery) {
          setIsExpanded(false);
        }
      }
      // ИСПРАВЛЕНО: Закрытие списка, если кликнули в любое другое место (включая инпут поиска)
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
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

  const handleCustomSelect = (val) => {
    setActiveFilter(val);
    setIsDropdownOpen(false);
    if (onFilterSelect) onFilterSelect(val);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    setActiveFilter(null);
    setIsExpanded(false);
    setIsDropdownOpen(false);
    if (onSearch) onSearch('');
    if (onFilterSelect) onFilterSelect(null);
  };

  const selectedCategoryName = categories.find(
    (cat) => String(cat.id || cat._id) === String(activeFilter)
  )?.name || 'Все разделы';

  return (
    <div 
      ref={panelRef}
      className={`${styles.searchPanel} ${isExpanded ? styles['searchPanel--expanded'] : styles['searchPanel--collapsed']}`}
      onClick={handlePanelClick}
    >
      <div className={styles.searchPanel__mainRow}>
        {isExpanded ? (
          <>
            {/* БЛОК 1: Строка поиска */}
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

            {/* БЛОК 2: Категории (Кастомный дропдаун) */}
            <div 
              ref={dropdownRef} // ИСПРАВЛЕНО: Вешаем реф
              className={`${styles.searchPanel__glassItem} ${styles['searchPanel__glassItem--dropdown']}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              <div className={styles.searchPanel__selectedText}>
                {selectedCategoryName}
              </div>

              {isDropdownOpen && (
                <div className={styles.searchPanel__dropdownMenu}>
                  <div 
                    className={`${styles.searchPanel__dropdownItem} ${!activeFilter ? styles['searchPanel__dropdownItem--active'] : ''}`}
                    onClick={() => handleCustomSelect(null)}
                  >
                    Все разделы
                  </div>
                  {categories.map((category) => {
                    const catId = category.id || category._id;
                    const isActive = String(activeFilter) === String(catId);
                    return (
                      <div 
                        key={catId} 
                        className={`${styles.searchPanel__dropdownItem} ${isActive ? styles['searchPanel__dropdownItem--active'] : ''}`}
                        onClick={() => handleCustomSelect(catId)}
                      >
                        {category.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* БЛОК 3: Матрёшка / Закрытие */}
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