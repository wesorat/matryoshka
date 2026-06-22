import Logo from '../Logo'
import styles from './Footer.module.scss'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__inner}>
        <div className={styles.footer__logo}>
          <Logo color={styles.footer__logo} />
        </div>
        <div className={styles.footer__copyright}>
          © {currentYear} Все права защищены
        </div>
      </div>
    </footer>
  )
}

export default Footer
