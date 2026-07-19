import { Compass, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function CaseJourneyVisual() {
  return (
    <section className="case-journey-visual card overflow-hidden">
      <div className="border-b border-navy-100/70 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-gold-600">
          Маяк · ваш маршрут
        </p>
        <h3 className="mt-2 text-xl font-bold text-navy-800 dark:text-white">
          От тревоги к ясному плану
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-navy-500">
          Не нужно проходить этот путь в одиночку. Мы берём юридическую часть на
          себя, а вы всегда понимаете, что уже сделано и что будет дальше.
        </p>
      </div>

      <div className="hidden p-5 sm:block sm:p-7">
        <svg viewBox="0 0 900 260" className="block w-full" role="img" aria-label="Путь клиента: от тревоги к ясному плану и завершению дела">
          <defs>
            <linearGradient id="caseJourneyNight" x1="0" x2="1"><stop stopColor="#eaf0f6" /><stop offset="1" stopColor="#d8e3ee" /></linearGradient>
            <linearGradient id="caseJourneyLight" x1="0" x2="1"><stop stopColor="#e2b82b" /><stop offset="1" stopColor="#f6de7a" /></linearGradient>
            <linearGradient id="caseJourneyGreen" x1="0" x2="1"><stop stopColor="#2d7b46" /><stop offset="1" stopColor="#79bd8b" /></linearGradient>
          </defs>

          <path d="M155 132 C260 72 336 196 450 130 S650 75 750 130" fill="none" stroke="#d9e3ed" strokeWidth="8" strokeLinecap="round" />
          <path d="M305 130 C358 166 396 160 450 130" fill="none" stroke="url(#caseJourneyLight)" strokeWidth="8" strokeLinecap="round" />
          <path d="M450 130 C560 66 648 91 750 130" fill="none" stroke="url(#caseJourneyGreen)" strokeWidth="8" strokeLinecap="round" />

          <JourneyCard x={40} tone="past" eyebrow="БЫЛО" title="Тревога и вопросы" text="Долги, звонки, непонятные сроки" icon="~" />
          <JourneyCard x={350} tone="now" eyebrow="СЕЙЧАС" title="Дело под контролем" text="Юрист ведёт маршрут, вы видите главное" icon="✦" />
          <JourneyCard x={660} tone="next" eyebrow="ВПЕРЕДИ" title="Спокойный финал" text="Решение, документы и новая глава" icon="✓" />

          <g transform="translate(450 97)"><circle r="21" fill="#fffaf0" stroke="#e2b82b" strokeWidth="3" /><path d="M0-12 8 2 0 13-8 2Z" fill="#e2b82b" /><circle r="3" fill="#17293e" /></g>
          <text x="450" y="222" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="12" fontWeight="700" fill="#52647a">Маяк помогает не потерять направление</text>
        </svg>
      </div>

      <div className="space-y-3 p-5 sm:hidden">
        <MobilePoint icon={<Compass className="h-5 w-5" />} title="Было: тревога и вопросы" text="Долги и неизвестность остались позади — вы уже сделали важный первый шаг." tone="past" />
        <MobilePoint icon={<ShieldCheck className="h-5 w-5" />} title="Сейчас: дело под контролем" text="Юрист ведёт процесс, а нужная информация всегда в вашем кабинете." tone="now" />
        <MobilePoint icon={<Sparkles className="h-5 w-5" />} title="Впереди: спокойный финал" text="По мере движения сохраним документы и будем объяснять каждый важный шаг." tone="next" />
      </div>
    </section>
  );
}

function JourneyCard({ x, tone, eyebrow, title, text, icon }: { x: number; tone: "past" | "now" | "next"; eyebrow: string; title: string; text: string; icon: string }) {
  const fill = tone === "past" ? "url(#caseJourneyNight)" : tone === "now" ? "#fffaf0" : "#eff8f1";
  const stroke = tone === "past" ? "#cbd9e6" : tone === "now" ? "#e2b82b" : "#79bd8b";
  const color = tone === "past" ? "#64748b" : tone === "now" ? "#9a7611" : "#236a39";
  return <g transform={`translate(${x}, 35)`}><rect width="200" height="154" rx="18" fill={fill} stroke={stroke} strokeWidth="2" /><circle cx="100" cy="54" r="25" fill={tone === "past" ? "#708198" : tone === "now" ? "#e2b82b" : "#2d7b46"} /><text x="100" y="62" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="25" fontWeight="700" fill="#fff">{icon}</text><text x="100" y="101" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="800" fill={color}>{eyebrow}</text><text x="100" y="121" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="800" fill="#17293e">{title}</text><text x="100" y="140" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fill="#52647a">{text}</text></g>;
}

function MobilePoint({ icon, title, text, tone }: { icon: ReactNode; title: string; text: string; tone: "past" | "now" | "next" }) {
  const color = tone === "past" ? "bg-navy-100 text-navy-600" : tone === "now" ? "bg-gold-100 text-gold-700" : "bg-emerald-100 text-emerald-700";
  return <div className="flex gap-3 rounded-2xl border border-navy-100 bg-white p-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>{icon}</span><div><p className="font-bold text-navy-800">{title}</p><p className="mt-1 text-sm leading-5 text-navy-500">{text}</p></div></div>;
}
