import Image from "next/image";

/**
 * Shared shell for the authentication pages (login / forgot / reset).
 * A centered card floats over a full "lagoon" aqua gradient with playful
 * bubbles — on-brand for a kids water park, consistent across all auth screens.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-gradient-to-br from-[var(--color-aqua-500)] via-[var(--color-aqua-600)] to-[var(--color-aqua-700)] p-4">
      {/* Decorative bubbles */}
      <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 size-96 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-24 top-20 size-16 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute bottom-24 left-24 size-10 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute left-1/3 top-1/4 size-6 rounded-full bg-white/10" />

      {/* Animated wave background along the bottom (pure CSS, no JS) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[42vh] min-h-64 overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 h-full w-[200%]"
          viewBox="0 0 2880 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Each band is two identical wave cycles laid side by side, then
              slid left by exactly one cycle (50%) on a loop, so it scrolls
              seamlessly. Layers move at different speeds/opacities for depth. */}
          <path
            className="auth-wave auth-wave-1"
            fill="#ffffff"
            fillOpacity="0.08"
            d="M0 160 C 240 90 480 90 720 160 S 1200 230 1440 160 1920 90 2160 160 2640 230 2880 160 V320 H0 Z"
          />
          <path
            className="auth-wave auth-wave-2"
            fill="#ffffff"
            fillOpacity="0.12"
            d="M0 200 C 240 140 480 140 720 200 S 1200 260 1440 200 1920 140 2160 200 2640 260 2880 200 V320 H0 Z"
          />
          <path
            className="auth-wave auth-wave-3"
            fill="#ffffff"
            fillOpacity="0.18"
            d="M0 240 C 240 200 480 200 720 240 S 1200 280 1440 240 1920 200 2160 240 2640 280 2880 240 V320 H0 Z"
          />
        </svg>
        <style>{`
          .auth-wave { animation-name: auth-wave-move; animation-timing-function: linear; animation-iteration-count: infinite; }
          .auth-wave-1 { animation-duration: 22s; }
          .auth-wave-2 { animation-duration: 16s; animation-direction: reverse; }
          .auth-wave-3 { animation-duration: 11s; }
          @keyframes auth-wave-move {
            from { transform: translateX(0); }
            to   { transform: translateX(-1440px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .auth-wave { animation: none !important; }
          }
        `}</style>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl bg-card p-8 shadow-2xl sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/5">
              <Image
                src="/aqua-lagoon-logo.jpg"
                alt="Aqua Lagoon"
                width={200}
                height={200}
                priority
                className="size-20 object-contain"
              />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="mt-7">{children}</div>
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-white/90 [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
