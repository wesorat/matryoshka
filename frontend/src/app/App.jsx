import { useState, useEffect } from 'react'
import './App.scss'
import HomePage from '../pages/HomePage.jsx'
import Page2 from '../pages/Page2.jsx'

function App() {
  const [isShrunk, setIsShrunk] = useState(false)
  const [page, setPage] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      setIsShrunk(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <>
      <header className={isShrunk ? 'appHeader appHeader--shrunk' : 'appHeader'}>
        <div className="appHeader__inner">
          <img src="/logo.svg" alt="Матрешка" className="appHeader__logo" />
          <nav className="appHeader__nav">
            <button
              type="button"
              className={page === 'home' ? 'appHeader__link appHeader__link--active' : 'appHeader__link'}
              onClick={() => setPage('home')}
            >
              Главная
            </button>
            <button
              type="button"
              className={page === 'page2' ? 'appHeader__link appHeader__link--active' : 'appHeader__link'}
              onClick={() => setPage('page2')}
            >
              Страница 2
            </button>
          </nav>
        </div>
      </header>

      <main className="appContent">
        {page === 'home' ? <HomePage /> : <Page2 />}
      </main>
    </>
  )
}

export default App
