import HeroGallery from '../components/Hero/HeroGallery/HeroGallery.jsx'
import CategorySection from '../components/CategorySection/CategorySection.jsx'

function HomePage({ categories = [], loading = false, onCategoryClick }) {
  return (
    <>
      <HeroGallery />

      {loading ? (
        <section>
          <p>Загрузка категорий...</p>
        </section>
      ) : categories.length === 0 ? (
        <section>
          <p>Категории не найдены.</p>
        </section>
      ) : (
        categories.map((category) => (
          <section key={category.id}>
            <CategorySection
              title={category.name}
              actionText="Открыть"
              onAction={() => onCategoryClick(category.id)}
            />
          </section>
        ))
      )}
    </>
  )
}

export default HomePage
