import { useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from 'react'
import { createClickCooldown } from '../../shared/clickCooldown'

export type ButtonVariant = 'outline' | 'primary' | 'icon' | 'link' | 'remove' | 'plain'

const CLICK_COOLDOWN_MS = 350

const CLASS_BY_VARIANT: Record<ButtonVariant, string> = {
  outline: 'button-outline',
  primary: 'button-primary',
  icon: 'icon-button',
  link: 'link-button',
  remove: 'button-remove',
  plain: ''
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: ButtonVariant
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<unknown>
}

function joinClassNames(...names: (string | undefined)[]): string | undefined {
  const joined = names.filter((name) => name !== undefined && name !== '').join(' ')
  return joined === '' ? undefined : joined
}

export function Button({ variant = 'outline', className, type = 'button', onClick, disabled, ...rest }: ButtonProps) {
  const canClick = useRef(createClickCooldown(CLICK_COOLDOWN_MS)).current
  const isPendingRef = useRef(false)
  const [isPending, setIsPending] = useState(false)

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (onClick === undefined || isPendingRef.current || !canClick()) {
      return
    }
    const result = onClick(event)
    if (!(result instanceof Promise)) {
      return
    }
    isPendingRef.current = true
    setIsPending(true)
    const release = (): void => {
      isPendingRef.current = false
      setIsPending(false)
    }
    result.then(release, release)
  }

  return (
    <button
      type={type}
      className={joinClassNames(CLASS_BY_VARIANT[variant], className)}
      disabled={disabled === true || isPending}
      aria-busy={isPending || undefined}
      onClick={handleClick}
      {...rest}
    />
  )
}
