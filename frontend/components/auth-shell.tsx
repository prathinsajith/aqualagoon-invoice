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
