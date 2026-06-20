import { useState, useEffect } from 'react'
import Button from '../components/Buttons/Button.jsx'
import './App.scss'
import HomePage from '../pages/HomePage.jsx'
import Page2 from '../pages/Page2.jsx'

function App() {
  const [isShrunk, setIsShrunk] = useState(false)
  const [page, setPage] = useState('home')

  useEffect(() => {
    let ticking = false
    const threshold = 20
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const newState = window.scrollY > threshold
          setIsShrunk(newState)
          ticking = false
        })
        ticking = true
      }
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
            <Button
            type="button"
            variant="link"
            active={page === 'home'}
            className={page === 'home' ? 'appHeader__link appHeader__link--active' : 'appHeader__link'}
            onClick={() => setPage('home')}
          >
            Главная
          </Button>
          <Button
            type="button"
            variant="link"
            active={page === 'page2'}
            className={page === 'page2' ? 'appHeader__link appHeader__link--active' : 'appHeader__link'}
            onClick={() => setPage('page2')}
          >
            Страница 2
          </Button>
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
