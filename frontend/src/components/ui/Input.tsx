import type { ComponentPropsWithoutRef, ReactNode } from 'react'

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: string
  hint?: string
  error?: boolean
  icon?: ReactNode
  shape?: 'pill' | 'soft'
}

export function Input({
  label,
  hint,
  error = false,
  icon,
  shape = 'pill',
  id,
  className = '',
  ...rest
}: InputProps) {
  const fid = id ?? (label ? `vk-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)
  const inputCls = [
    'vk-input',
    icon ? 'vk-input--with-icon' : '',
    shape === 'soft' ? 'vk-input--soft' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={['vk-field', error ? 'vk-field--error' : '', className].filter(Boolean).join(' ')}>
      {label && <label className="vk-field__label" htmlFor={fid}>{label}</label>}
      <div className="vk-input-wrap">
        {icon && <span className="vk-input-wrap__icon">{icon}</span>}
        <input id={fid} className={inputCls} {...rest} />
      </div>
      {hint && <span className="vk-field__hint">{hint}</span>}
    </div>
  )
}