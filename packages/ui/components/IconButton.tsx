import clsx from 'clsx'
import { ReactNode } from 'react'

export interface IconButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'large' | 'small'
  icon: ReactNode
  disabled?: boolean
  onClick: () => null
}

export const IconButton = ({
  variant,
  size = 'default',
  icon,
  disabled,
  onClick,
}: IconButtonProps) => (
  <button
    className={clsx(
      'focus:outline-2 focus:outline-background-button-disabled transition stroke-current',
      {
        // Sizes.
        'p-1.5 w-6 h-6 rounded-md': size === 'small',
        'p-2 w-8 h-8 rounded-md': size === 'default',
        'p-3 w-10 h-10 rounded-full': size === 'large',

        // Primary variant.
        'text-text-button-primary bg-background-button': variant === 'primary',
        'hover:bg-background-button-hover active:bg-background-button-pressed':
          !disabled && variant === 'primary',
        'bg-background-button-disabled': disabled && variant === 'primary',

        // Secondary variant.
        'text-icon-primary bg-button-secondary-default':
          variant === 'secondary',
        'hover:bg-button-secondary-hover active:bg-button-secondary-pressed':
          !disabled && variant === 'secondary',
        'bg-button-secondary-disabled': disabled && variant === 'secondary',

        // Ghost variant.
        'text-icon-primary bg-transparent': variant === 'ghost',
        'hover:bg-background-interactive-hover active:bg-background-interactive-pressed':
          !disabled && variant === 'ghost',
        'bg-transparent': disabled && variant === 'ghost',
      }
    )}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {icon}
  </button>
)
