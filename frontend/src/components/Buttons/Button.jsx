import styles from './Button.module.scss';

function Button({
  children,
  type = 'button',
  variant = 'default',
  active = false,
  className = '',
  ...props
}) {
  const variantClass = styles[`variant_${variant}`] || styles.variant_default;
  const activeClass = active ? styles.active : '';
  const classes = [styles.button, variantClass, activeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
