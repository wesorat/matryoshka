import { useState, useRef, useEffect } from 'react';
import CustomIcon from '../MatrIcon/MatrIcon';
import styles from './SearchPanel.module.scss';

const SearchPanel = ({
  categories = [],
  universities = [],
  technologies = [],
  onSearch,
  onFilterSelect,
  onUniversityFilterSelect,
  onTechnologyFilterSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [activeUniversityFilter, setActiveUniversityFilter] = useState(null);
  const [isUniversityDropdownOpen, setIsUniversityDropdownOpen] = useState(false);

  const [activeTechFilters, setActiveTechFilters] = useState([]);
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);

  const panelRef = useRef(null);
  const dropdownRef = useRef(null);
  const universityDropdownRef = useRef(null);
  const techDropdownRef = useRef(null);// ИСПРАВЛЕНО: Реф для кнопки селекта

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
      if (universityDropdownRef.current && !universityDropdownRef.current.contains(event.target)) {
        setIsUniversityDropdownOpen(false);
      }
      if (techDropdownRef.current && !techDropdownRef.current.contains(event.target)) {
        setIsTechDropdownOpen(false);
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

  const handleUniversitySelect = (val) => {
    setActiveUniversityFilter(val);
    setIsUniversityDropdownOpen(false);
    if (onUniversityFilterSelect) onUniversityFilterSelect(val);
  };

  const handleTechToggle = (techId) => {
    const id = String(techId);
    setActiveTechFilters((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      if (onTechnologyFilterSelect) onTechnologyFilterSelect(next);
      return next;
    });
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    setActiveFilter(null);
    setActiveUniversityFilter(null);
    setActiveTechFilters([]);
    setIsExpanded(false);
    setIsDropdownOpen(false);
    setIsUniversityDropdownOpen(false);
    setIsTechDropdownOpen(false);
    if (onSearch) onSearch('');
    if (onFilterSelect) onFilterSelect(null);
    if (onUniversityFilterSelect) onUniversityFilterSelect(null);
    if (onTechnologyFilterSelect) onTechnologyFilterSelect([]);
  };

  const selectedCategoryName = categories.find(
    (cat) => String(cat.id || cat._id) === String(activeFilter)
  )?.name || 'Все разделы';

  const selectedUniversityName = universities.find(
    (uni) => String(uni.id || uni._id) === String(activeUniversityFilter)
  )?.name || 'Все вузы';

  const selectedTechLabel = activeTechFilters.length > 0
    ? `Технологии (${activeTechFilters.length})`
    : 'Все технологии';

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

            {/* БЛОК 2b: Университеты */}
            <div
              ref={universityDropdownRef}
              className={`${styles.searchPanel__glassItem} ${styles['searchPanel__glassItem--dropdown']}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsUniversityDropdownOpen(!isUniversityDropdownOpen);
              }}
            >
              <div className={styles.searchPanel__selectedText}>
                {selectedUniversityName}
              </div>

              {isUniversityDropdownOpen && (
                <div className={styles.searchPanel__dropdownMenu}>
                  <div
                    className={`${styles.searchPanel__dropdownItem} ${!activeUniversityFilter ? styles['searchPanel__dropdownItem--active'] : ''}`}
                    onClick={() => handleUniversitySelect(null)}
                  >
                    Все вузы
                  </div>
                  {universities.map((uni) => {
                    const uniId = uni.id || uni._id;
                    const isActive = String(activeUniversityFilter) === String(uniId);
                    return (
                      <div
                        key={uniId}
                        className={`${styles.searchPanel__dropdownItem} ${isActive ? styles['searchPanel__dropdownItem--active'] : ''}`}
                        onClick={() => handleUniversitySelect(uniId)}
                      >
                        {uni.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* БЛОК 2c: Технологии (мультивыбор) */}
            <div
              ref={techDropdownRef}
              className={`${styles.searchPanel__glassItem} ${styles['searchPanel__glassItem--dropdown']}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsTechDropdownOpen(!isTechDropdownOpen);
              }}
            >
              <div className={styles.searchPanel__selectedText}>
                {selectedTechLabel}
              </div>

              {isTechDropdownOpen && (
                <div className={styles.searchPanel__dropdownMenu} onClick={(e) => e.stopPropagation()}>
                  {technologies.map((tech) => {
                    const techId = tech.id || tech._id;
                    const isActive = activeTechFilters.includes(String(techId));
                    return (
                      <div
                        key={techId}
                        className={`${styles.searchPanel__dropdownItem} ${isActive ? styles['searchPanel__dropdownItem--active'] : ''}`}
                        onClick={() => handleTechToggle(techId)}
                      >
                        {isActive ? '✓ ' : ''}{tech.name}
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
