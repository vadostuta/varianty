import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'danger-solid' | 'next';
type Size = 'phone' | 'host';

const variants: Record<Variant, string> = {
  primary: 'bg-sun text-ink [--base:var(--color-sun-shade)] disabled:bg-edge disabled:text-fog',
  secondary: 'border-2 border-edge bg-velvet text-cream disabled:text-fog',
  danger: 'border-2 border-coral bg-transparent text-coral [--lift:0px] hover:bg-coral/10',
  'danger-solid': 'bg-coral text-ink [--lift:0px]',
  next: 'bg-sun text-ink font-display [--base:var(--color-sun-shade)] [--lift:6px] disabled:bg-edge disabled:text-fog',
};

const sizes: Record<Size, string> = {
  phone: 'h-14 rounded-phone px-7 text-lg',
  host: 'h-12 rounded-host px-[18px] text-base [--lift:0px]',
};

export function Button({
  variant = 'primary',
  size = 'phone',
  className = '',
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; style?: CSSProperties }) {
  const sizing = variant === 'next' ? 'h-[72px] rounded-[20px] px-10 text-2xl' : sizes[size];
  const lift = variant === 'primary' && size === 'host' ? '[--lift:4px]' : '';
  return (
    <button
      type="button"
      className={`press inline-flex items-center justify-center gap-2.5 font-extrabold whitespace-nowrap select-none ${sizing} ${variants[variant]} ${lift} ${className}`}
      style={style}
      {...rest}
    />
  );
}
