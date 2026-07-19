import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gavel,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { supabase } from "../lib/supabase";
import type { ClientCaseUpdate } from "../types";
import { formatDate } from "../lib/format";
import { getStageUpdate, STAGES, STATUS_TO_STAGE } from "../lib/stages";

export function Journey() {
  const { caseId, client, clientUpdate, loading, error } = useData();

  if (loading)
    return <p className="text-sm text-navy-400">Готовим ваш маршрут…</p>;
  if (!caseId || !client)
    return (
      <p className="text-sm text-rose-600">
        {error ?? "Для аккаунта пока не создано дело."}
      </p>
    );

  const current = STATUS_TO_STAGE[client.caseStatus] ?? 0;
  const greeting = greetingName(client.name);
  const [futureStage, setFutureStage] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [beamPulse, setBeamPulse] = useState(false);
  const showBeam = () => {
    setBeamPulse(false);
    window.setTimeout(() => setBeamPulse(true), 20);
    window.setTimeout(() => setBeamPulse(false), 850);
  };
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientY ?? null)}
        onTouchEnd={(event) => {
          const end = event.changedTouches[0]?.clientY;
          if (touchStart !== null && end && end - touchStart > 42) showBeam();
          setTouchStart(null);
        }}
        className="beacon-shell overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 p-5 text-white shadow-card sm:p-8"
      >
        <p className="flex items-center gap-2 text-sm text-gold-300">
          <Sparkles className="h-4 w-4" /> Коротко о вашем деле
        </p>
        <p className="mt-3 text-xs text-white/60">
          Сегодня, {formatDate(new Date().toISOString())}
        </p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
          Здравствуйте, {greeting}!
        </h2>
        <div className={beamPulse ? "animate-beacon-rise" : ""}>
          <ClientStatusCard update={clientUpdate} current={current} />
        </div>
        <div className="mt-7 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">Ваш путь по делу</p>
            <p className="mt-0.5 text-xs text-white/60">
              Вы на этапе «{STAGES[current].shortTitle}». Полоса — это ваш
              маршрут: пройденное остаётся позади, дальше — следующие шаги.
            </p>
          </div>
          <span className="hidden rounded-full border border-gold-300/30 bg-gold-400/10 px-3 py-1 text-xs font-semibold text-gold-200 sm:block">
            Этапы дела
          </span>
        </div>
        <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-2 scrollbar-none">
          <div className="flex min-w-max items-start">
          {STAGES.map((step, index) => {
            const Icon = step.icon;
            const isCurrent = index === current;
            const done = index < current;
            const position = done
              ? "Пройден"
              : isCurrent
                ? "Вы здесь"
                : "Впереди";
            return (
              <div key={step.key} className="flex items-center">
                <button type="button" disabled={index <= current} onClick={() => setFutureStage(index)} className={`relative z-10 w-24 text-center focus:outline-none focus:ring-2 focus:ring-gold-300 disabled:cursor-default sm:w-32 ${index > current ? "cursor-pointer" : ""}`}>
                  <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full border-4 border-navy-900 shadow-lg transition ${done ? "bg-emerald-400 text-navy-900" : isCurrent ? "beacon-current bg-gold-400 text-navy-900" : "bg-navy-700 text-white/70 hover:bg-navy-600"}`}><Icon className="h-5 w-5" /></span>
                  <span className="mt-2 block text-xs font-bold leading-4 text-white">{step.shortTitle}</span>
                  <span className={`mt-0.5 block text-[10px] font-medium ${isCurrent ? "text-gold-200" : done ? "text-emerald-200" : "text-white/45"}`}>{position}</span>
                </button>
                {index < STAGES.length - 1 && <span className={`mb-8 h-0.5 w-5 sm:w-10 ${index < current ? "bg-emerald-400" : "bg-white/15"}`} />}
              </div>
            );
          })}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-white/50">Будущие этапы можно нажать и посмотреть заранее. Это как заглянуть в маршрут, не перескакивая через остановки.</p>
      </section>

      {futureStage !== null && <StageModal stage={STAGES[futureStage]} onClose={() => setFutureStage(null)} />}

      {current === 0 && <ClientCheckin caseId={caseId} />}
      {current === 1 && <DocumentStage />}
      {current === 2 && <FilingStage />}
      {current === 3 && <ActiveStage status={client.caseStatus} />}
      {current === 4 && <CompletionStage />}
    </div>
  );
}

function StageModal({ stage, onClose }: { stage: (typeof STAGES)[number]; onClose: () => void }) {
  const Icon = stage.icon;
  return <div role="dialog" aria-modal="true" aria-label={`Этап: ${stage.title}`} onClick={onClose} className="fixed inset-0 z-[70] grid place-items-center bg-[#07101d]/80 p-4 backdrop-blur-sm"><div onClick={(event) => event.stopPropagation()} className="beacon-modal relative w-full max-w-md overflow-hidden rounded-3xl border border-gold-300/25 bg-navy-950 p-6 text-white shadow-2xl sm:p-8"><div className="beacon-modal__light" /><button type="button" onClick={onClose} aria-label="Закрыть" className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button><div className="relative z-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-400 text-navy-900 shadow-lg"><Icon className="h-6 w-6" /></span><p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-gold-200">Следующая остановка маршрута</p><h3 className="mt-2 text-2xl font-bold">{stage.title}</h3><p className="mt-2 text-sm font-semibold text-gold-200">{stage.duration}</p><p className="mt-5 text-base leading-7 text-white/80">{stage.reassuringText}</p><div className="mt-6 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-sm leading-6 text-white/70"><strong className="text-white">Что происходит на этом этапе:</strong><br />{stage.text}. Мы отметим переход сами, когда для этого будут все основания — нажимать ничего не нужно.</div><button type="button" onClick={onClose} className="btn-gold mt-7 w-full">Понятно, маяк светит дальше</button></div></div></div>;
}

function ClientStatusCard({
  update,
  current,
}: {
  update: ClientCaseUpdate | null;
  current: number;
}) {
  const defaultUpdate = getStageUpdate(STAGES[current].key);
  const status = update ?? defaultUpdate;
  const color =
    status.tone === "good"
      ? "border-emerald-300/30 bg-emerald-400/10"
      : status.tone === "attention"
        ? "border-rose-300/30 bg-rose-400/10"
        : "border-gold-300/35 bg-gold-400/10";
  const actionHref =
    status.actionHref ||
    (status.actionLabel === "Пройти анкету" ? "#diagnostic" : null);
  const contents = (
    <>
      <p className="text-sm font-bold">{status.headline}</p>
      <p className="mt-1 text-sm leading-5 text-white/75">{status.body}</p>
      {status.actionLabel && (
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-200">
          {status.actionLabel}
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </>
  );
  return (
    <div className={`mt-5 rounded-xl border p-4 ${color}`}>
      {actionHref ? (
        actionHref.startsWith("/") ? (
          <Link to={actionHref}>{contents}</Link>
        ) : (
          <a href={actionHref}>{contents}</a>
        )
      ) : (
        contents
      )}
    </div>
  );
}

function greetingName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 3 ? `${parts[1]} ${parts[2]}` : (parts[0] ?? "клиент");
}

type CheckinAnswers = {
  understood?: string;
  callEveryTwoWeeks?: string;
  preferredContact?: string;
  bestTime?: string;
  readyForDocuments?: string;
  question?: string;
};

function ClientCheckin({ caseId }: { caseId: string }) {
  const [answers, setAnswers] = useState<CheckinAnswers>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      const { data, error: loadError } = await supabase
        .from("client_checkins")
        .select("answers")
        .eq("case_id", caseId)
        .maybeSingle();
      if (loadError) setError(loadError.message);
      else if (data?.answers) setAnswers(data.answers as CheckinAnswers);
    })();
  }, [caseId]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: saveError } = await supabase
      .from("client_checkins")
      .upsert({ case_id: caseId, answers }, { onConflict: "case_id" });
    setBusy(false);
    if (saveError) setError(saveError.message);
    else
      setNotice("Ответы отправлены юристу. Их можно изменить в любой момент.");
  };
  const radio = (
    name: keyof CheckinAnswers,
    label: string,
    options: [string, string][],
  ) => (
    <fieldset>
      <legend className="text-sm font-medium text-navy-700 dark:text-white/75">
        {label}
      </legend>
      <div className="mt-2 flex flex-wrap gap-3">
        {options.map(([optionValue, text]) => (
          <label
            key={optionValue}
            className="rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600 dark:border-white/10 dark:text-white/70"
          >
            <input
              checked={answers[name] === optionValue}
              onChange={() =>
                setAnswers((old) => ({ ...old, [name]: optionValue }))
              }
              className="mr-1.5"
              type="radio"
              name={name}
            />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
  return (
    <form onSubmit={submit} className="card max-w-3xl p-5 sm:p-7">
      <div className="flex gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-700">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold text-navy-800 dark:text-white">
            Небольшая анкета для юриста
          </h3>
          <p className="mt-1 text-sm text-navy-500">
            Не обязательна. Заполните сейчас или позже — ответы помогут нам
            подобрать удобный формат работы.
          </p>
        </div>
      </div>
      {notice && (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {radio(
          "understood",
          "После консультации понятно, что будет происходить?",
          [
            ["yes", "Да, понятно"],
            ["partly", "Есть вопросы"],
            ["no", "Нужны пояснения"],
          ],
        )}
        {radio(
          "callEveryTwoWeeks",
          "Нужен короткий созвон с юристом раз в две недели?",
          [
            ["yes", "Да, нужен"],
            ["no", "Нет, достаточно чата"],
          ],
        )}
        {radio("preferredContact", "Как удобнее получать связь?", [
          ["chat", "В чате"],
          ["phone", "По телефону"],
          ["both", "Любым способом"],
        ])}
        {radio("readyForDocuments", "Готовы начать загрузку документов?", [
          ["yes", "Да, готов(а)"],
          ["need-help", "Нужна помощь"],
          ["later", "Позже"],
        ])}
        <label className="text-sm font-medium text-navy-700 dark:text-white/75">
          Когда обычно удобно звонить?
          <input
            value={answers.bestTime ?? ""}
            onChange={(event) =>
              setAnswers((old) => ({ ...old, bestTime: event.target.value }))
            }
            placeholder="Например, по будням после 18:00"
            className="input-field mt-1.5"
          />
        </label>
        <label className="text-sm font-medium text-navy-700 dark:text-white/75">
          Какой вопрос волнует больше всего?
          <textarea
            value={answers.question ?? ""}
            onChange={(event) =>
              setAnswers((old) => ({ ...old, question: event.target.value }))
            }
            rows={2}
            className="input-field mt-1.5 resize-none"
            placeholder="Можно оставить пустым"
          />
        </label>
      </div>
      <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button disabled={busy} className="btn-primary w-full sm:w-auto">
          {busy ? "Отправляем…" : "Сохранить ответы"}
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-xs text-navy-400">
          Анкета ни на что не влияет автоматически — её читает юрист.
        </p>
      </div>
    </form>
  );
}
function DocumentStage() {
  return (
    <section className="card max-w-3xl p-7">
      <FileText className="h-9 w-9 text-gold-500" />
      <h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">
        Собираем документы
      </h3>
      <p className="mt-2 text-sm leading-6 text-navy-500">
        Загрузите только документы из вашего персонального списка. Юрист
        проверит каждый файл и при необходимости объяснит, что исправить.
      </p>
      <Link to="/documents/collection" className="btn-primary mt-6">
        Открыть список документов <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
function FilingStage() {
  return (
    <section className="card max-w-3xl p-7">
      <Gavel className="h-9 w-9 text-gold-500" />
      <h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">
        Подготовка и подача заявления
      </h3>
      <p className="mt-2 text-sm leading-6 text-navy-500">
        Юрист готовит пакет, проверяет реквизиты и сообщит, когда понадобится
        согласование или оплата. Все ключевые события появятся в уведомлениях.
      </p>
      <Link to="/notifications" className="btn-primary mt-6">
        Открыть события дела <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
function ActiveStage({ status }: { status: string }) {
  const mfc = status === "mfc-procedure";
  return (
    <section className="card max-w-3xl p-7">
      <CalendarDays className="h-9 w-9 text-gold-500" />
      <h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">
        {mfc ? "Внесудебная процедура через МФЦ" : "Активная стадия процедуры"}
      </h3>
      <p className="mt-2 text-sm leading-6 text-navy-500">
        {mfc
          ? "Кабинет будет показывать дату публикации, обратный отсчёт и важные уведомления."
          : "Здесь отображаются судебные события, платежи, запросы юриста и сведения по процедуре."}
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/case" className="btn-primary">
          Статус дела
        </Link>
        <Link to="/finances" className="btn-ghost">
          Платежи
        </Link>
      </div>
    </section>
  );
}
function CompletionStage() {
  return (
    <section className="card max-w-3xl p-7">
      <CheckCircle2 className="h-9 w-9 text-emerald-500" />
      <h3 className="mt-4 text-xl font-bold text-navy-800 dark:text-white">
        Дело завершено
      </h3>
      <p className="mt-2 text-sm leading-6 text-navy-500">
        Здесь сохранены документы и решения по делу. Перед финансовыми
        действиями сверяйтесь с персональной памяткой от юриста.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/documents" className="btn-primary">
          Открыть архив
        </Link>
        <Link to="/contacts" className="btn-ghost">
          Задать вопрос
        </Link>
      </div>
    </section>
  );
}
