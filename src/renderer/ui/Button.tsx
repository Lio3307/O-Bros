import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'outline' | 'primary' | 'icon' | 'link' | 'remove'

const CLASS_BY_VARIANT: Record<ButtonVariant, string> = {
  outline: 'button-outline',
  primary: 'button-primary',
  icon: 'icon-button',
  link: 'link-button',
  remove: 'button-remove'
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'outline', className, type = 'button', ...rest }: ButtonProps) {
  const classNames = className === undefined ? CLASS_BY_VARIANT[variant] : `${CLASS_BY_VARIANT[variant]} ${className}`
  return <button type={type} className={classNames} {...rest} />
}
