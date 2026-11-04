/** The Statlume mark from brand-kit/statlume/mark.svg, plus the lowercase wordmark. */
export function Mark({
  className = 'size-7',
  ink = '#15191C',
}: {
  className?: string;
  ink?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect x="6" y="29" width="7.5" height="13" rx="1.6" fill={ink} />
      <rect x="16.5" y="22" width="7.5" height="20" rx="1.6" fill={ink} />
      <rect x="27" y="14.5" width="7.5" height="27.5" rx="1.6" fill={ink} />
      <circle cx="39.5" cy="9" r="4.6" fill="#F26B1D" />
      <path
        d="M39.5 1.2 A7.8 7.8 0 0 1 47.3 9"
        fill="none"
        stroke="#F26B1D"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".5"
      />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mark />
      <span className="font-display text-xl font-extrabold tracking-[-0.04em]">statlume</span>
    </span>
  );
}
