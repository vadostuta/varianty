type P = { size?: number; className?: string };

const stroke = (size: number, className: string | undefined, w: number, d: string, join = false) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin={join ? 'round' : undefined}
    aria-hidden="true"
    className={className}
  >
    <path d={d} />
  </svg>
);

export const CheckIcon = ({ size = 16, className }: P) =>
  stroke(size, className, 3.5, 'M5 12.5l4.5 4.5L19 7.5', true);
export const XIcon = ({ size = 16, className }: P) => stroke(size, className, 3, 'M6 6l12 12M18 6L6 18');
export const PauseIcon = ({ size = 18, className }: P) => stroke(size, className, 3, 'M9 5v14M15 5v14');
export const ArrowIcon = ({ size = 18, className }: P) =>
  stroke(size, className, 3, 'M5 12h14M13 6l6 6-6 6', true);
export const BackIcon = ({ size = 18, className }: P) =>
  stroke(size, className, 3, 'M19 12H5M11 6l-6 6 6 6', true);
export const WarnIcon = ({ size = 16, className }: P) =>
  stroke(size, className, 2.5, 'M12 3l10 18H2zM12 10v4M12 17.5v.5', true);
export const OfflineIcon = ({ size = 18, className }: P) =>
  stroke(
    size,
    className,
    2.5,
    'M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01M3 3l18 18',
  );
export const LockIcon = ({ size = 16, className }: P) =>
  stroke(size, className, 2.5, 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11', true);
export const PlusIcon = ({ size = 18, className }: P) => stroke(size, className, 3, 'M12 5v14M5 12h14');
export const PlayIcon = ({ size = 22, className }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M7 4.5l13 7.5-13 7.5z" />
  </svg>
);
export const CrownIcon = ({ size = 22, className, label }: P & { label?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="var(--color-sun)"
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={className}
  >
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
  </svg>
);
export const PencilIcon = ({ size = 18, className }: P) =>
  stroke(size, className, 2.5, 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', true);
