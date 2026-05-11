# BrainBricks — Контекст и дневник проекта

## 📋 О проекте
**BrainBricks** — платформа для создания AI-роботов из LEGO. Телефон = мозг робота.
**Хакатон**: Aurora Global Hackathon (Devpost) — ProjectGRID
**Дедлайн Stage 2**: 11 мая 2026
**Экосистема**: Google Cloud / Gemini AI Ecosystem (Native Integration)

---

## 💰 Бизнес-модель (v2.0 — Bricks Economy)

Проект BrainBricks — это экономическая экосистема, где ИИ превращает игрушки в ценные активы.

### 1. Marketplace Economy (The "Robux" Model)
- **Валюта**: Bricks (₿). 100 ₿ = $1.00 USD.
- **Монетизация**: BrainBricks удерживает **20% транзакционную комиссию** с каждой продажи (MCP-инструменты, чертежи, личности).
- **Свобода цен**: Создатели сами выставляют цену в Bricks за свой контент.

### 2. AI Intelligence Tiers (Powered by Google AI Pro)
- **Standard (Free Tier)**:
    - **General Chat**: `Gemini 3.1 Flash Lite` (RPM 15). Быстрые ответы и зрение.
    - **Logic/Robotics**: `Gemini Robotics ER 1.5` (RPM 10). Для сложных расчетов и точного управления.
- **Premium (Powered by Google AI Pro Subscription)**:
    - **Live interaction**: `Gemini 3 Flash Live`. Мгновенная реакция «глаза в глаза».
    - **Expert Reasoning**: `Gemini Robotics ER 1.6`. Максимальная точность для сложных кинематических задач.
- **Custom Providers (BYOK)**: Возможность для пользователей подключать собственные API-ключи для полной свободы и кастомизации.

### 3. Hardware Philosophy
- **Phone (The Head)**: Глаза (камера), Уши (микрофон), Рот (динамик).
- **LEGO Spike (The Body)**: Руки, ноги, моторы и детали — это физическая оболочка.
- **Cloud (The Brain)**: Серверная обработка через Gemini API.
- **Vision**: От «умной колонки на колесиках» до полноценных гуманоидных роботов (стиль Unitree).

---

## 🏗️ Neural Forge — Спецификация генерации
Для внутренних инструментов созидания (Builder, MCP Tools, Prompts) используется стратегия **"Mega-Fast & Strong"**:
- **Модели**: Приоритет на `Gemini 3.1 Flash Lite` (для скорости) или `Gemini 3 Pro` (для сложных логических структур MCP).
- **Цель**: Практически мгновенная генерация валидных JSON-артефактов и прошивок.
- **Workflow**: Промпт пользователя -> Анализ требований -> Генерация структуры -> Валидация в Sandbox -> Публикация в Marketplace.

---

## 🛠️ Google Gemini Ecosystem — Rate Limits (Native Pro Tier)

| Model | RPM | TPM | RPD | Role |
|-------|-----|-----|-----|------|
| **Gemini 3.1 Flash Lite** | 15 | 250K | 500 | Основной чат / Базовое зрение |
| **Gemini Robotics ER 1.5** | 10 | 250K | 20 | Логика и кинематика (Free) |
| **Gemini 3 Flash Live** | Unlim | 65K | Unlim | Режим реального времени (Premium) |
| **Gemini Robotics ER 1.6** | 5 | 250K | 20 | Экспертное управление (Premium) |
| **Gemini 3 Flash** | 5 | 250K | 20 | Резервный "мозг" |
| **Imagen 4 Generate** | - | - | 25 | Генерация идей в Билдере |
| **Gemma 3 (27B)** | 30 | 15K | 14.4K | Локальный анализ (Edge) |
| **Gemini Embedding 2** | 100 | 30K | 1K | Долгая память (RAG) |

**Grounding & Tools:**
- **Search Grounding**: 1.5K RPD (Доступ к актуальным данным из Google Search)
- **Map Grounding**: 500 RPD (Геолокация и навигация)

---

## 📝 Дневник изменений

### 30 апреля 2026 — Agentic Ecosystem & Economy (v0.6.0)
- **Экономика Bricks**: Внедрена система валюты ₿, управление балансом в Admin Panel.
- **3D Builder**: Constructor Mode с редактированием свойств деталей (X, Y, Z, Color).
- **Marketplace**: Динамическое ценообразование и 20% комиссия.

### 30 апреля 2026 — Neural Forge & AI Generation (v0.7.0)
- **Backend AI**: Универсальный движок генерации 3D-моделей и кода.
- **Vision-to-Build**: Генерация робота по фотографии.

### 2 мая 2026 — Web Bluetooth & Direct Control
- **Hardware**: Реализовано прямое управление LEGO Hub через Web Bluetooth.
- **Models**: Переход на стек Gemini (Flash Lite, Live, ER 1.6).

### 8 мая 2026 — Native Android APK Deployment
- **Capacitor**: Проект упакован в нативный APK.
- **BLE Native**: Доступ к Bluetooth через нативные плагины для стабильности.

### 9 мая 2026 — Google AI Pro Migration
- **Intelligence**: Стандартизация тиров (Standard/Premium) на базе Google AI Pro.
- **Stability**: Исправление багов в DashPage и билде Android (Java 17).

### 10 мая 2026 — Economy & Identity
- **Financials**: Реализованы модалки Withdraw/TopUp, интеграция с SOL.
- **Auth**: Динамическая идентификация пилотов, отказ от хардкода.

### 10 мая 2026 — Robot Forge S-Tier Overhaul
- **UI**: Реконструкция Билдера в профессиональный инструмент.
- **Logic**: Neural Command Center для инъекции «личности» робота.

### 11 мая 2026 — S-Tier Builder & AI Forge Evolution (v1.5.0) 🛠️
**Статус**: В разработке. Масштабное обновление инструментов созидания.

**Цели (Backlog):**
- **Neural Forge 2.0**:
    - Управление деталями в стиле **SketchUp** (прямое манипулирование в 3D).
    - Новые ассеты: блоки а-ля Minecraft и удлиняющиеся колеса/оси.
- **Marketplace Integration**:
    - Кнопка **"Add to Marketplace"** с ИИ-ассистентом для заполнения карточки.
- **AI Workspace (Anvil)**:
    - Специальная среда для генерации 3D по тексту, создания MCP-тулов и промптов.
- **MCP Registry**:
    - Проверка и деплой базовых инструментов: Погода, YouTube, Поиск.

### 11 мая 2026 — BrainBricks Stage 2: Mission Accomplished 🚀
**Статус**: Завершено. Платформа полностью готова к финальной подаче на Aurora Hackathon.

**Основные изменения:**
- **Neural Forge (3D Builder)**:
    - Реализовано прямое манипулирование деталями (Move/Scale) с абсолютными координатами.
    - Добавлен "Forge Neural Asset" — кнопка быстрой генерации деталей с ИИ-анимацией.
- **Neural Anvil**:
    - Запущен специализированный режим подготовки артефактов для маркетплейса.
    - **Listing Assistant**: ИИ анализирует 3D-сборку и генерирует маркетинговые данные (имя, описание, цену).
- **Profile Showcase**:
    - Полный редизайн страницы профиля. Добавлена премиальная сетка Showcase Grid с превью роботов.
    - Внедрены метрики успеха: "Successful Missions" и "Models Sold".
- **Economy & Final Polish**:
    - Проверка 20% комиссии на уровне сервера.
    - Создан финальный Pitch Deck (`pitch_deck.md`) со структурой S-Tier.

**Планы**: Подготовка видео-демо и финальное тестирование BLE-соединения на физическом хабе.




# BrainBricks Stage 2: Final Cleanup Plan

To ensure a professional and "S-Tier" submission for the Aurora Global Hackathon, we will perform the following cleanup operations in the `prototype_2` directory.

## 1. Directory & File Optimization
*   **[DELETE]** `prototype_2/server/content/builds/` (Redundant as we moved to `server/data/builds.json`).
*   **[DELETE]** `prototype_2/content/builds/` (Redundant).
*   **[DELETE]** Any `.log` or `.tmp` files in `prototype_2/server/`.
*   **[CLEAN]** `prototype_2/client/dist/` (To ensure fresh production build).

## 2. Code Refactoring (Server)
*   **[MODIFY]** `prototype_2/server/src/index.ts`: Remove the duplicate `/api/builds` route (lines 289-316) to ensure consistent data loading from the database.
*   **[MODIFY]** `prototype_2/server/src/index.ts`: Remove any unused imports and debug console logs.

## 3. Frontend Polishing
*   **[CLEAN]** `prototype_2/client/src/assets/`: Ensure only used images/icons remain.
*   **[VERIFY]** `prototype_2/client/src/pages/`: Check for any "dead" components or unused state variables (Neural HUD cleanup).

## 4. Final Submission Checklist
- [ ] Fresh production build: `npx vite build`.
- [ ] Capacitor Sync: `npx cap sync`.
- [ ] Final APK generation for judges.
- [ ] Verify all links in `pitch_deck.md` and `README.md`.

---
---
**Status**: Ready for Execution. 
*To start the cleanup, simply say "Execute Cleanup".*

### 11 мая 2026 — AI Stability & True Live API Restoration ⚡
**Что было сделано (Handover Notes):**
- **Исправление багов с ИИ (404 Error)**:
    - `gemini-3-flash-live` не поддерживается в стандартном REST API (`generateContent`).
    - `gemini-robotics-er-1.5-preview` был депрекейтнут Google.
    - **Решение**: В `ai.ts` прописан `gemini-3.1-flash-lite` для всех текстовых задач (включая fallback-чат) и `gemini-robotics-er-1.6-preview` для tool-вызовов (работает стабильно, проверено).
- **True Native Live API**:
    - Обнаружено, что в проекте уже есть реализация WebSockets для Live-сессии (`live.ts` и `PhonePage.tsx`).
    - В `App.tsx` восстановлен роут `/phone`.
    - В `BuilderPage.tsx` добавлена кнопка **"⚡ True Live API"**, которая переводит пользователя в интерфейс `PhonePage` для работы с `gemini-3-flash-live` через BidiStream (с передачей аудио и видео-кадров напрямую в Google).

**Чеклист перед финальной отправкой (Для следующей модели):**
1. [ ] Убедиться, что `npm run dev` на ПК и запущенный APK на телефоне видят друг друга и синхронизируют стейт (если требуется).
2. [ ] Проверить "Final Cleanup Plan" (удалить старые папки с билдами).
3. [ ] Прогнать итоговый сценарий записи видео (Запуск -> True Live API -> Вызов MCP тулов роботом -> Управление моторами Spike).
4. [ ] Удостовериться, что в `pitch_deck.md` добавлены ссылки на демо-видео и актуальные технологии (Live API, ER 1.6).

### 11 мая 2026 — Critical Fix: broadcast() Bug (Claude Opus Session) 🔧
**Проблема**: Голосовой цикл BuilderPage останавливался на REASONING и никогда не показывал SPEAKING или ERROR.

**Корневая причина**: Функция `broadcast()` в `index.ts` **исключала отправителя** (`id !== exclude`). Все ответы сервера (`robot_chat_response`, `ai_response`, `thinking`) отправлялись ВСЕМ клиентам **КРОМЕ** того, кто задал вопрос. Клиент никогда не получал свой ответ.

**Исправления:**
- **[MODIFY] `server/src/index.ts`**: Добавлена функция `sendTo()` для прямой отправки сообщения конкретному клиенту. Все AI-ответы (`robot_chat`, `ai_command`, `generate_mcp`) теперь используют `sendTo()` вместо `broadcast()`.
- **[MODIFY] `client/src/pages/PhonePage.tsx`**: Исправлен React Error #300 — хук `useLegoHardware()` перенесён на верхний уровень компонента (был внутри условного блока `if (!launched)`).

**Статус**: Сервер перезапущен, APK пересобран и установлен на телефон.
