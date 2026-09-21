import Link from "next/link";

/**
 * Wordmark. The glyph is drawn geometry (a stylised disc cut by a download
 * arrow), not an emoji or a stock icon.
 */
function Brand() {
  return (
    <Link
      href="/"
      className="group/brand flex shrink-0 items-center gap-2 rounded-md"
      aria-label="spotdl home"
    >
      <svg
        viewBox="0 0 24 24"
        className="text-accent size-[22px]"
        fill="none"
        aria-hidden
      >
        <circle
          cx="12"
          cy="12"
          r="9.25"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.35"
        />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path
          d="M12 6.75v6.5m0 0 2.6-2.6M12 13.25l-2.6-2.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 16.4h10"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-ink text-[15px] font-semibold tracking-[-0.02em]">
        spotdl
      </span>
    </Link>
  );
}

export { Brand };
