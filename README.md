# Личный кабинет клиента · Банкротство («Маяк»)

Премиум веб-приложение «Личный кабинет» для клиентов процедур банкротства.
React 18 + TypeScript + Tailwind CSS. Данные — мок в `localStorage`.

## Запуск

```bash
npm install
npm start        # dev-сервер на http://localhost:3000
```

Другие команды:

```bash
npm run build    # продакшн-сборка в /dist
npm run preview  # предпросмотр собранной версии
```

## Демо-доступ

| Логин    | Пароль    |
| -------- | --------- |
| `client` | `demo123` |

На странице входа есть кнопка автозаполнения демо-данных.

## Возможности

- 🔐 **Авторизация** — логин/пароль (заглушка), сессия в `localStorage`
- 📊 **Обзор (Dashboard)** — сводка: статус, финансы, ближайший платёж, уведомления
- ⚖️ **Статус дела** — этапы процедуры (степпер), реквизиты должника и суда
- 💰 **Финансы** — долг, остаток, прогресс-бар, график и история платежей, выписка в PDF, печать
- 📁 **Документы** — фильтрация по типам, поиск, скачивание в PDF, отметка о просмотре
- 🔔 **Уведомления** — маркер непрочитанных, «прочитать все», печать
- 👤 **Контакты** — карточка куратора, чат с автоответом, форма обратной связи с валидацией
- 📄 **Экспорт PDF** — настоящие PDF-файлы с кириллицей (встроенный шрифт Roboto),
  фирменной вёрсткой и логотипом: документ дела, выписка по платежам, справка по делу.
  Генерация на клиенте через `jsPDF`; шрифт подгружается лениво (не влияет на стартовый бандл)
- 🌙 **Тёмная тема**, адаптивный дизайн, сворачиваемая боковая панель
- ✨ Плавные анимации, loading- и empty-состояния

## Структура

```
src/
├── pages/          Dashboard, CasesStatus, Finances, Documents, Notifications, Contacts, Login
├── components/      Sidebar, Header, Layout, Cards/, Common/
├── context/        AuthContext, DataContext
├── hooks/          useAuth, useTheme
├── lib/            format (валюта/даты)
├── data/           mockData
└── types/          index.ts
```

## Цветовая схема

- Основной: тёмно-синий `#1a365d`
- Акцент: золотистый `#d4af37`
- Фон: `#f7f9fc` / тёмный `#0b1728`

> Демонстрационное приложение. Все данные вымышленные.

## Подключение реального кабинета

Приложение использует Supabase для авторизации, базы данных и защищённого
хранилища документов. Netlify отвечает за публикацию фронтенда и серверную
функцию, которая отправляет приглашения новым клиентам.

### Первичная настройка

1. Создайте проект в Supabase.
2. В SQL Editor выполните миграции по порядку:
   `supabase/migrations/20260718_initial_schema.sql`, затем
   `supabase/migrations/20260718_document_onboarding.sql` и
   `supabase/migrations/20260718_client_journey.sql`, затем
   `supabase/migrations/20260719_client_application_profile.sql`.
3. В Supabase → Authentication → URL Configuration добавьте URL сайта:
   `https://lk-bankrot.netlify.app`. Включите вход по email и настройте
   подтверждение email.
4. Создайте первого пользователя-сотрудника в Supabase → Authentication → Users.
   Затем выполните в SQL Editor, заменив email:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'your-email@example.com');
   ```

5. В Netlify → Project configuration → Environment variables добавьте:

   ```text
   VITE_SUPABASE_URL              https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY         <public anon key>
   SUPABASE_URL                   https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY              <public anon key>
   SUPABASE_SERVICE_ROLE_KEY      <server-only secret key>
   SITE_URL                       https://lk-bankrot.netlify.app
   ```

   Первые две переменные доступны браузеру. `SUPABASE_SERVICE_ROLE_KEY` —
   серверный секрет: его нельзя добавлять в GitHub, `.env` или Vite-переменные.

6. Запустите в Netlify **Clear cache and deploy site**.

После входа под пользователем с ролью `admin` или `manager` открывается
админ-раздел. В нём создайте клиента и дело: Supabase отправит клиенту
приглашение для установки пароля.

### Локальная разработка

```bash
cp .env.example .env.local
npm install
npm run dev
```

Для работы функции приглашения локально нужны серверные переменные Supabase.
В production они задаются только в Netlify.
