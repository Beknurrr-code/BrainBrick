# 🤖 AI Agent Instructions — BrainBricks Project

## 📜 The "Source of Truth" Rule
The only authoritative file for project history, status, and architectural decisions is `CONTEXT.md`.

### 1. Read `CONTEXT.md` First
Before starting any task, read the entirety of `CONTEXT.md`. It contains:
- **Timeline**: A chronological log of every major change and decision.
- **Architecture**: The current state of the backend and frontend.
- **Rules**: Project-specific constraints (e.g., Tailwind v4 usage, ESM modules).

### 2. Append Your Progress
After completing a task or a major step, you **MUST** update `CONTEXT.md`. 
- Scroll to the very bottom of the file.
- Add a new heading with the current date (e.g., `### 10 мая 2026 — [Short Title]`).
- Describe exactly what you did:
    - **Plans**: Proposed changes.
    - **Fixes**: Bugs resolved.
    - **Ideas**: Future improvements or pivot thoughts.
    - **Status**: The current health of the feature.

### 3. No Redundant Documentation
Do not create `AGENT_CHAT.md`, `AGENTS.md`, or separate `PLAN.md` files. All logic must be contained within `CONTEXT.md`.

---
## ⚡ Quick Deployment (Magic Chain)
Для сборки и запуска APK на телефоне:
1. Убедись, что телефон подключен по USB и включен режим отладки.
2. В `client/android/gradle.properties` проверь путь к Java 17:
   `org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr` (или путь к твоему JDK 17).
3. Выполни команду:
```powershell
npm run build --prefix client; npx cap sync --cwd client; cd client/android; .\gradlew assembleDebug; cd ../..; & "C:\Users\Beknur\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r client\android\app\build\outputs\apk\debug\app-debug.apk; & "C:\Users\Beknur\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.brainbricks.app -c android.intent.category.LAUNCHER 1
```

## 🧠 AI & Hardware Link
- Все команды ИИ проходят через `handleExpertReasoning` в `ai.ts`.
- ИИ получает манифест из `memory.ts` (поле `manifest`).
- Если меняешь логику управления моторами — правь `processExpertReasoning` в `ai.ts`.

---
*Note: This file is a meta-instruction for the AI assistant. Do not delete unless instructed by the USER.*



$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; cd prototype_2/client; npx vite build; npx cap sync; cd android; .\gradlew assembleDebug; cd ../../..; & "C:\Users\Beknur\AppData\Local\Android\Sdk\platform-tools\adb.exe" uninstall com.brainbricks.app; & "C:\Users\Beknur\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r prototype_2\client\android\app\build\outputs\apk\debug\app-debug.apk; & "C:\Users\Beknur\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.brainbricks.app -c android.intent.category.LAUNCHER 1