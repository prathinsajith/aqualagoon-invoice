import { cn } from "@/lib/utils";

/**
 * SwimLoader — a stingray gliding through water as the loading mark.
 *
 * Top-down view of the Aqua Lagoon ray (just the "fish" — no boy, no wordmark)
 * swimming in place: its wings undulate in a smooth wave (animated path morph),
 * the long tail trails with a phase delay, and the whole body glides with a
 * gentle bob while bubbles drift up. Pure inline SVG + CSS (no JS, no assets).
 *
 * Optimized: only `d` / transform / opacity animations (GPU-friendly). Browsers
 * without CSS `d` animation simply show the ray's rest pose while it still
 * glides — graceful degradation.
 *
 * Pass `label` for a caption (defaults to "Loading"); `size` in px.
 */
export function SwimLoader({
  className,
  label = "Loading",
  size = 168,
}: {
  className?: string;
  label?: string | null;
  size?: number;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label="Loading"
        className="drop-shadow-[0_14px_28px_rgba(8,102,171,0.4)]"
      >
        <defs>
          <linearGradient id="sl-ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a96d2" />
            <stop offset="55%" stopColor="#235fa3" />
            <stop offset="100%" stopColor="#143f73" />
          </linearGradient>
          <linearGradient id="sl-spine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fcdf2" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9fcdf2" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient bubbles drifting up */}
        <g fill="#eafaff" opacity="0.6">
          <circle className="sl-bubble sl-b1" cx="72" cy="170" r="2.6" />
          <circle className="sl-bubble sl-b2" cx="128" cy="176" r="2" />
          <circle className="sl-bubble sl-b3" cx="100" cy="182" r="2.3" />
          <circle className="sl-bubble sl-b4" cx="150" cy="172" r="1.6" />
        </g>

        {/* The ray glides as a whole */}
        <g className="sl-glide">
          {/* tail — trails behind with a delayed sway */}
          <path
            className="sl-tail"
            d="M97 116 C 98 136 99 156 99 176 C 100 178 101 178 101 176 C 102 156 103 136 103 116 Z"
            fill="#16447c"
          />

          {/* wings — undulate in a smooth wave */}
          <path
            className="sl-wing-l"
            d="M96 72 C 60 70 38 84 22 100 C 50 112 78 112 96 110 Z"
            fill="url(#sl-ray)"
          />
          <path
            className="sl-wing-r"
            d="M104 72 C 140 70 162 84 178 100 C 150 112 122 112 104 110 Z"
            fill="url(#sl-ray)"
          />

          {/* body */}
          <path
            d="M100 50 C 108 58 108 98 103 118 C 101 125 99 125 97 118 C 92 98 92 58 100 50 Z"
            fill="url(#sl-ray)"
          />
          {/* center ridge highlight */}
          <ellipse cx="100" cy="86" rx="4.5" ry="30" fill="url(#sl-spine)" />
          {/* light speckles (kept near the body so they ride the motion) */}
          <g fill="#9fcdf2" opacity="0.55">
            <circle cx="93" cy="92" r="1.8" />
            <circle cx="107" cy="98" r="1.6" />
            <circle cx="100" cy="104" r="1.4" />
          </g>
          {/* eyes on top */}
          <circle cx="96" cy="76" r="1.7" fill="#0f2e4d" />
          <circle cx="104" cy="76" r="1.7" fill="#0f2e4d" />
        </g>

        <style>{`
          .sl-glide { transform-box: view-box; transform-origin: 100px 100px; animation: sl-glide 3s ease-in-out infinite; }
          @keyframes sl-glide {
            0%,100% { transform: translateY(3px) rotate(-1.5deg) }
            50%     { transform: translateY(-4px) rotate(1.5deg) }
          }

          .sl-wing-l { animation: sl-swim-l 2.4s ease-in-out infinite; }
          @keyframes sl-swim-l {
            0%,100% { d: path("M96 70 C 60 62 38 76 22 92 C 50 106 78 108 96 108 Z") }
            50%     { d: path("M96 74 C 60 78 38 92 22 110 C 50 116 78 114 96 112 Z") }
          }
          .sl-wing-r { animation: sl-swim-r 2.4s ease-in-out infinite; }
          @keyframes sl-swim-r {
            0%,100% { d: path("M104 70 C 140 62 162 76 178 92 C 150 106 122 108 104 108 Z") }
            50%     { d: path("M104 74 C 140 78 162 92 178 110 C 150 116 122 114 104 112 Z") }
          }

          .sl-tail { transform-box: view-box; transform-origin: 100px 118px; animation: sl-tail 2.4s ease-in-out infinite; animation-delay: -0.5s; }
          @keyframes sl-tail { 0%,100% { transform: rotate(6deg) } 50% { transform: rotate(-6deg) } }

          .sl-bubble { animation: sl-rise linear infinite; }
          .sl-b1 { animation-duration: 4.6s }
          .sl-b2 { animation-duration: 6s; animation-delay: 1s }
          .sl-b3 { animation-duration: 5.2s; animation-delay: 1.9s }
          .sl-b4 { animation-duration: 6.6s; animation-delay: .5s }
          @keyframes sl-rise { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: .6 } 90% { opacity: .35 } 100% { transform: translateY(-120px); opacity: 0 } }

          @media (prefers-reduced-motion: reduce) {
            .sl-glide,.sl-wing-l,.sl-wing-r,.sl-tail,.sl-bubble { animation: none !important; }
          }
        `}</style>
      </svg>

      {label && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-white/90">
          <span>{label}</span>
          <span className="inline-flex gap-0.5">
            <span className="sl-dot">.</span>
            <span className="sl-dot">.</span>
            <span className="sl-dot">.</span>
          </span>
          <style>{`
            .sl-dot { animation: sl-blinkdot 1.4s infinite both; }
            .sl-dot:nth-child(2) { animation-delay: .2s }
            .sl-dot:nth-child(3) { animation-delay: .4s }
            @keyframes sl-blinkdot { 0%,80%,100% { opacity: .2 } 40% { opacity: 1 } }
          `}</style>
        </div>
      )}
    </div>
  );
}
