import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { AppTour } from "./AppTour";
import { useAuth } from "../hooks/useAuth";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Обзор дела",
    subtitle: "Ключевая информация по вашей процедуре",
  },
  "/overview": {
    title: "Обзор дела",
    subtitle: "Ключевая информация по вашей процедуре",
  },
  "/case": {
    title: "Статус дела",
    subtitle: "Этапы процедуры банкротства и реквизиты",
  },
  "/finances": {
    title: "Финансы",
    subtitle: "Задолженность, платежи и прогресс погашения",
  },
  "/documents": {
    title: "Документы",
    subtitle: "Материалы дела, договоры и уведомления",
  },
  "/notifications": {
    title: "Уведомления",
    subtitle: "Важные даты, документы и сообщения",
  },
  "/contacts": {
    title: "Контакты",
    subtitle: "Ваш куратор и обратная связь",
  },
  "/admin": {
    title: "Управление клиентами",
    subtitle: "Создание клиентов, дел и приглашений",
  },
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const meta = TITLES[location.pathname] ?? {
    title: "Личный кабинет",
    subtitle: "",
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-navy-950">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-64"
        }`}
      >
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenMobile={() => setMobileOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <div className="mx-auto mt-4 w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <p className="rounded-xl border border-gold-200 bg-gold-50 px-4 py-2 text-xs text-gold-700 dark:border-gold-400/20 dark:bg-gold-400/10 dark:text-gold-300">
            Демо-кабинет: данные и сформированные PDF являются учебными,
            юридической силы не имеют.
          </p>
        </div>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-6">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <footer className="mx-auto hidden w-full max-w-[1400px] px-4 py-6 text-center text-xs text-navy-300 dark:text-white/25 sm:px-6 lg:block lg:px-8">
          © 2026 Маяк · Личный кабинет клиента · Демо-версия
        </footer>
      </div>
      <MobileNav />
      {user?.profile.role === "client" && <AppTour clientId={user.id} />}
    </div>
  );
}
