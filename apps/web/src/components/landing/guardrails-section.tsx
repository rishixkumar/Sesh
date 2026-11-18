import { EyeOffIcon, FlagIcon, MapPinOffIcon, ShieldCheckIcon } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { GUARDRAILS } from "@/lib/landing/content";

const ICONS = [ShieldCheckIcon, FlagIcon, MapPinOffIcon, EyeOffIcon];

export function GuardrailsSection() {
  return (
    <section
      aria-labelledby="guardrails-heading"
      className="mx-auto max-w-5xl px-6 py-28 sm:py-36"
    >
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.2em] text-emerald-300 uppercase sm:text-sm">
          Built with guardrails
        </p>
        <h2
          id="guardrails-heading"
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl"
        >
          Fun by design. Safe by default.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          The defaults are the safe ones. Nobody has to dig through settings to
          protect themselves.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {GUARDRAILS.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal
              key={item.title}
              delay={i * 0.08}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <Icon className="size-6 text-emerald-300" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{item.body}</p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
