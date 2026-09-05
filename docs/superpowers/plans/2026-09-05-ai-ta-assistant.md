# AI助教小助理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only, installable PWA that helps Tina Lin manage CDPS and BNA weekly TA work, SOPs, questions awaiting confirmation, and end-of-semester reports.

**Architecture:** A Vite + React + TypeScript app lives in `app/`, keeping the user's existing Word/HTML work at repository root untouched. A typed domain layer owns seed data, semester-date calculations, task expansion, validation, and browser-local persistence; React components read and mutate that layer through one app store. The app uses localStorage plus explicit JSON export/import, with no network API, account, Moodle, Email, or student-data models.

**Tech Stack:** React 19, TypeScript, Vite, React Router, vite-plugin-pwa, Vitest, React Testing Library, browser localStorage, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-09-05-ai-ta-assistant-design.md`

## Global Constraints

- Personal use only; primary editing experience is desktop, with responsive phone viewing.
- Store no student names, IDs, Email addresses, grades, submissions, video links, or other student personal data.
- Do not integrate with or operate Moodle, Gmail, LINE, spreadsheets, or external services.
- No direct Email sending, background push notification, cloud sync, completion percentage, ranking, or productivity scoring.
- Calculate the 1151 semester from 2026-09-07 in Asia/Taipei for 16 weeks; show the current week only when the App is opened.
- Preserve original course content when a special date cancels class; record the adjustment separately.
- Include CDPS W4 (2026-09-28) and W8 (2026-10-26) as Monday holiday overrides with a follow-up confirmation task.
- All user changes must survive refresh and reopening in the same browser; warn before replacing data during JSON import.
- All free-text editors must display: `請勿輸入學生個資、成績或作業內容。`

---

## File Structure

```text
app/
  package.json                         # scripts and dependencies
  vite.config.ts                       # Vite, Vitest and PWA configuration
  public/manifest.webmanifest          # install metadata
  public/icons/icon-192.png            # PWA icon
  public/icons/icon-512.png            # PWA icon
  src/main.tsx                         # React bootstrap
  src/App.tsx                          # router and persisted-store provider
  src/styles/tokens.css                # visual tokens shared by all screens
  src/styles/app.css                   # responsive application styles
  src/domain/types.ts                  # domain model and runtime-safe constants
  src/domain/semester.ts               # week, Taipei dates, special-date logic
  src/domain/tasks.ts                  # sorting and recurring-task expansion
  src/data/seed.ts                     # initial courses, roadmap, tasks and SOP entries
  src/lib/storage.ts                   # versioned localStorage + backup validation
  src/lib/store.tsx                    # React context and update actions
  src/components/AppShell.tsx          # desktop sidebar and mobile navigation
  src/components/TaskCard.tsx          # shared task card and status controls
  src/components/TaskEditor.tsx        # create/edit form and privacy reminder
  src/components/WeekRoadmap.tsx       # 16-week strip and four-lane view
  src/components/SopEditor.tsx         # SOP category/list/edit UI
  src/pages/DashboardPage.tsx          # current week, urgency and questions
  src/pages/CoursePage.tsx             # CDPS/BNA course roadmap
  src/pages/TasksPage.tsx              # all tasks and end-of-semester filter
  src/pages/SopPage.tsx                # SOP knowledge base
  src/pages/BackupPage.tsx             # export/import JSON UI
  src/test/setup.ts                    # DOM test setup
  src/domain/semester.test.ts          # date and holiday tests
  src/domain/tasks.test.ts             # task sort and recurring expansion tests
  src/lib/storage.test.ts              # persistence and backup tests
  src/pages/DashboardPage.test.tsx     # visible priority-work behaviour
  src/pages/CoursePage.test.tsx        # holiday/original-topic behaviour
  src/pages/SopPage.test.tsx           # editable category behaviour
  src/pages/BackupPage.test.tsx        # invalid-import behaviour
```

## Domain Interfaces

```ts
export type CourseId = 'CDPS' | 'BNA' | 'COMMON';
export type TaskStatus = 'todo' | 'inProgress' | 'needsConfirmation' | 'done';
export type Lane = 'beforeClass' | 'inClass' | 'afterClass' | 'needsConfirmation' | 'closing';

export type Schedule =
  | { kind: 'once'; dueAt?: string }
  | { kind: 'weekly'; weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; startWeek: number; endWeek: number; time?: string };

export interface Task {
  id: string; title: string; courseId: CourseId; status: TaskStatus;
  lane?: Lane; week?: number; schedule: Schedule; checklist: string[];
  links: Array<{ label: string; url: string }>; notes: string; completionNote: string;
  completedAt?: string; archived: boolean; sortOrder: number;
}

export interface SpecialDate {
  id: string; courseId: CourseId; date: string; kind: 'holiday' | 'makeup' | 'changed';
  label: string; notes: string;
}

export interface SopEntry {
  id: string; category: 'email' | 'moodle' | 'grouping' | 'assessment' | 'classroom' | 'tools';
  title: string; when: string; owner: string; steps: string[]; notes: string;
  links: Array<{ label: string; url: string }>; updatedAt: string;
}

export interface AppData {
  schemaVersion: 1; tasks: Task[]; specialDates: SpecialDate[]; sopEntries: SopEntry[];
}

export interface DashboardPageProps { now?: Date; }
export interface CoursePageProps { courseId?: CourseId; selectedWeek?: number; }
```

### Task 1: Create the local PWA shell and test harness

**Files:**
- Create: `app/package.json`, `app/vite.config.ts`, `app/index.html`, `app/public/manifest.webmanifest`
- Create: `app/src/main.tsx`, `app/src/App.tsx`, `app/src/styles/tokens.css`, `app/src/styles/app.css`, `app/src/test/setup.ts`
- Modify: `app/.gitignore`

**Interfaces:**
- Produces a running React app with routes `/`, `/courses/:courseId`, `/tasks`, `/sop`, and `/backup`.
- Produces scripts `dev`, `build`, `test`, and `test:watch` for all later tasks.

- [ ] **Step 1: Scaffold an isolated Vite React TypeScript application**

Run from the repository root:

```powershell
npm create vite@latest app -- --template react-ts
Set-Location app
npm install react-router-dom vite-plugin-pwa
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Configure the failing test command before writing product features**

Add this exact test script and Vitest environment:

```json
"test": "vitest run",
"test:watch": "vitest"
```

```ts
test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }
```

Run: `npm run test`

Expected: PASS with zero tests; the command must exit 0.

- [ ] **Step 3: Add PWA metadata and offline caching configuration**

Configure `VitePWA` with `registerType: 'autoUpdate'`, `manifest.name: 'AI 助教小助理'`, `manifest.short_name: 'AI助教'`, `display: 'standalone'`, `start_url: '/'`, and icons at `icons/icon-192.png` and `icons/icon-512.png`. Use locally created, non-identifying icons only.

- [ ] **Step 4: Create the app shell and route placeholders**

Implement `App.tsx` using a small route adapter that reads `courseId` from `useParams()` and renders `CoursePage`, whose testable component signature is `CoursePage(props: CoursePageProps)`. `DashboardPage` must have the testable signature `DashboardPage(props: DashboardPageProps)`. The route configuration is:

```tsx
<Routes>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/courses/:courseId" element={<CoursePage />} />
  <Route path="/tasks" element={<TasksPage />} />
  <Route path="/sop" element={<SopPage />} />
  <Route path="/backup" element={<BackupPage />} />
</Routes>
```

Wrap routes in `AppShell`. Establish the approved warm-paper, navy, teal, sage, and amber visual tokens; make the sidebar collapse into mobile navigation below 820px.

- [ ] **Step 5: Verify production build and installation assets**

Run: `npm run build`

Expected: PASS and output contains a generated web manifest and service worker assets.

- [ ] **Step 6: Commit the shell**

```powershell
git add app
git commit -m "feat: scaffold local AI TA assistant PWA"
```

### Task 2: Implement semester dates, course data, and initial roadmap

**Files:**
- Create: `app/src/domain/types.ts`, `app/src/domain/semester.ts`, `app/src/data/seed.ts`
- Test: `app/src/domain/semester.test.ts`

**Interfaces:**
- Produces `getSemesterWeek(date: Date): number | null`, `getWeekDateRange(week: number): { start: string; end: string }`, and `getSpecialDate(courseId: CourseId, date: string): SpecialDate | undefined`.
- Produces `seedData: AppData` for storage initialization.

- [ ] **Step 1: Write failing date tests**

```ts
expect(getSemesterWeek(new Date('2026-09-07T09:00:00+08:00'))).toBe(1);
expect(getSemesterWeek(new Date('2026-12-21T09:00:00+08:00'))).toBe(16);
expect(getSemesterWeek(new Date('2026-12-28T09:00:00+08:00'))).toBeNull();
expect(getSpecialDate('CDPS', '2026-09-28')?.kind).toBe('holiday');
expect(getSpecialDate('CDPS', '2026-10-26')?.kind).toBe('holiday');
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- src/domain/semester.test.ts`

Expected: FAIL because the domain module does not exist.

- [ ] **Step 3: Implement exact semester and holiday rules**

Set the semester start to `2026-09-07T00:00:00+08:00`, compute Monday-based 7-day blocks, and return `null` outside W1–W16. Seed CDPS Monday and BNA Wednesday in B15, plus the two CDPS holiday records. Do not move W4 or W8 original topics.

Seed CDPS topics exactly as confirmed: W1 Orientation / Team Building; W2 AI Introduction; W3–W5 Co-opetition + BI / vibe coding; W6–W8 Competitive Dynamics + DA; W9 TP Proposal / Midterm Peer Review; W10–W12 Platform Revolution + BPA; W13–W15 AI Agent / Deployment / TP; W16 TP Presentation / Final Peer Review.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- src/domain/semester.test.ts`

Expected: PASS with five date/holiday assertions.

- [ ] **Step 5: Commit the domain seed**

```powershell
git add app/src/domain app/src/data
git commit -m "feat: add semester roadmap and holiday data"
```

### Task 3: Add typed local persistence, backup validation, and task operations

**Files:**
- Create: `app/src/domain/tasks.ts`, `app/src/lib/storage.ts`, `app/src/lib/store.tsx`
- Test: `app/src/domain/tasks.test.ts`, `app/src/lib/storage.test.ts`

**Interfaces:**
- Produces `loadAppData(): AppData`, `saveAppData(data: AppData): void`, `exportBackup(data: AppData): string`, and `parseBackup(raw: string): AppData`.
- Produces `AppDataProvider` and `useAppData()` with `createTask`, `updateTask`, `completeTask`, `archiveTask`, `upsertSop`, `setSpecialDate`, and `replaceAllData`.

- [ ] **Step 1: Write failing storage and task tests**

```ts
expect(loadAppData()).toEqual(seedData);
expect(() => parseBackup('{"schemaVersion":99}')).toThrow('無法讀取備份檔');
expect(sortTasksForDashboard(tasks)[0].id).toBe('overdue-task');
expect(expandRecurringTask(weeklyTask, 1)).toMatchObject({ week: 1, dueAt: '2026-09-07T22:00:00+08:00' });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test -- src/lib/storage.test.ts src/domain/tasks.test.ts`

Expected: FAIL because storage and task modules do not exist.

- [ ] **Step 3: Implement versioned browser storage and safe import**

Use one key: `ai-ta-assistant:v1`. `loadAppData` must return a deep clone of `seedData` when the key is absent or corrupted. `parseBackup` must require `schemaVersion === 1` and arrays for `tasks`, `specialDates`, and `sopEntries`; otherwise throw `new Error('無法讀取備份檔，現有資料未變更。')`. Export a JSON object with only `schemaVersion`, `tasks`, `specialDates`, and `sopEntries`.

- [ ] **Step 4: Implement deterministic task ordering and recurring instances**

Sort in this order: overdue unfinished, due within 48 hours unfinished, `needsConfirmation`, other unfinished, completed. Expand a weekly schedule only for its inclusive `startWeek`–`endWeek`; never persist expanded instances as separate user tasks.

- [ ] **Step 5: Run tests to verify pass**

Run: `npm run test -- src/lib/storage.test.ts src/domain/tasks.test.ts`

Expected: PASS; confirm invalid import leaves the localStorage value unchanged.

- [ ] **Step 6: Commit persistence and store**

```powershell
git add app/src/domain/tasks.ts app/src/lib app/src/domain/*.test.ts
git commit -m "feat: add local task storage and backup validation"
```

### Task 4: Build the dashboard and editable task workflow

**Files:**
- Create: `app/src/components/AppShell.tsx`, `app/src/components/TaskCard.tsx`, `app/src/components/TaskEditor.tsx`, `app/src/pages/DashboardPage.tsx`
- Modify: `app/src/App.tsx`, `app/src/styles/app.css`
- Test: `app/src/pages/DashboardPage.test.tsx`

**Interfaces:**
- Consumes `useAppData`, `getSemesterWeek`, and `sortTasksForDashboard`.
- Produces a dashboard showing the current week, urgent tasks, course-separated weekly tasks, completed records, and confirmation items.

- [ ] **Step 1: Write failing dashboard behaviour tests**

```tsx
render(<DashboardPage now={new Date('2026-09-05T10:00:00+08:00')} />);
expect(screen.getByText('W1')).toBeInTheDocument();
expect(screen.getByText('確認課前表單回覆與分組交接')).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: '標記完成' }));
expect(screen.getByText(/完成紀錄/)).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/pages/DashboardPage.test.tsx`

Expected: FAIL because the dashboard is still a route placeholder.

- [ ] **Step 3: Implement dashboard cards and editor**

Seed the W1 CDPS notification as completed on 2026-09-05. Show `W1` and its date range on 2026-09-05. Provide an accessible `新增工作` control; `TaskEditor` must expose title, course, status, one-time or weekly schedule, lane, due date/time, checklist, links, notes, completion note, and the required privacy reminder. `TaskCard` must allow mark complete, reopen, edit, archive, and never calculate a percentage.

- [ ] **Step 4: Run dashboard test and full suite**

Run: `npm run test`

Expected: PASS; the completed record remains visible after completing a card.

- [ ] **Step 5: Commit dashboard workflow**

```powershell
git add app/src/components app/src/pages/DashboardPage.tsx app/src/pages/DashboardPage.test.tsx app/src/App.tsx app/src/styles
git commit -m "feat: add current-week dashboard and task editor"
```

### Task 5: Build course roadmaps, special-date adjustments, and closing work

**Files:**
- Create: `app/src/components/WeekRoadmap.tsx`, `app/src/pages/CoursePage.tsx`, `app/src/pages/TasksPage.tsx`
- Modify: `app/src/data/seed.ts`, `app/src/styles/app.css`
- Test: `app/src/pages/CoursePage.test.tsx`

**Interfaces:**
- Consumes course seed data, special dates, and task store actions.
- Produces 16-week course pages with original topic, four work lanes, and a separate end-of-semester closing filter.

- [ ] **Step 1: Write failing course-page tests**

```tsx
render(<CoursePage courseId="CDPS" selectedWeek={4} />);
expect(screen.getByText('Co-opetition')).toBeInTheDocument();
expect(screen.getByText('假日，無正常上課')).toBeInTheDocument();
expect(screen.getByText('確認補課日期與安排')).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/pages/CoursePage.test.tsx`

Expected: FAIL because `WeekRoadmap` does not exist.

- [ ] **Step 3: Implement course page and four lanes**

Render a 16-week selector, original topic, and lanes `課前`, `課堂當天`, `課後`, and `待確認`. For either CDPS holiday, show its original topic plus `假日，無正常上課`; create a visible `確認補課日期與安排` task if one is absent. A confirmed makeup date must render as an adjustment and never replace the original topic.

- [ ] **Step 4: Seed and render closing tasks**

Seed two `COMMON` tasks with `lane: 'closing'`, `status: 'needsConfirmation'`, and no invented deadline: `產學共構成果報告` and `EMI 課程期末報告書`. In `TasksPage`, add the filter label `學期結束後／結案` and render closing tasks there even after W16.

- [ ] **Step 5: Run the course tests**

Run: `npm run test -- src/pages/CoursePage.test.tsx`

Expected: PASS; W4 displays both its original topic and the holiday status.

- [ ] **Step 6: Commit roadmap and closing work**

```powershell
git add app/src/components/WeekRoadmap.tsx app/src/pages/CoursePage.tsx app/src/pages/TasksPage.tsx app/src/pages/CoursePage.test.tsx app/src/data/seed.ts app/src/styles/app.css
git commit -m "feat: add course roadmaps and closing reports"
```

### Task 6: Build SOP and backup screens, then verify the installed App

**Files:**
- Create: `app/src/components/SopEditor.tsx`, `app/src/pages/SopPage.tsx`, `app/src/pages/BackupPage.tsx`
- Modify: `app/src/styles/app.css`, `app/src/App.tsx`
- Test: `app/src/pages/BackupPage.test.tsx`, `app/src/pages/SopPage.test.tsx`

**Interfaces:**
- Consumes `SopEntry`, `useAppData().upsertSop`, `exportBackup`, `parseBackup`, and `replaceAllData`.
- Produces editable SOP categories and a user-confirmed JSON backup restore flow.

- [ ] **Step 1: Write failing SOP and backup tests**

```tsx
render(<SopPage />);
expect(screen.getByRole('tab', { name: '寄信與通知' })).toBeInTheDocument();
expect(screen.getByText('請勿輸入學生個資、成績或作業內容。')).toBeInTheDocument();

render(<BackupPage />);
await user.upload(screen.getByLabelText('匯入備份檔'), invalidJsonFile);
expect(screen.getByText('無法讀取備份檔，現有資料未變更。')).toBeInTheDocument();
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test -- src/pages/SopPage.test.tsx src/pages/BackupPage.test.tsx`

Expected: FAIL because the SOP and backup screens do not exist.

- [ ] **Step 3: Implement editable SOP categories**

Create tabs for `寄信與通知`, `Moodle`, `分組`, `作業與成績`, `教室與器材`, and `課程工具`. Each entry editor must include applicable timing, owner, ordered steps, notes, links, and last-updated date. Seed only non-personal-data examples, including Course Pre-Class Notice, Grouping, Moodle Assignment Area, Coggle, and NotebookLM.

- [ ] **Step 4: Implement export/import with explicit replacement confirmation**

Export a file named `ai-ta-assistant-backup-YYYY-MM-DD.json`. When a valid file is chosen, show its task/SOP counts and a dialog whose confirm button reads `取代目前資料`; only that button may call `replaceAllData`. An invalid file must show the exact validation error and must not alter storage.

- [ ] **Step 5: Run feature tests, production build, and manual PWA checks**

Run:

```powershell
npm run test
npm run build
npm run dev
```

Expected: all tests and build pass. In a Chromium browser, verify: install option appears; offline reload opens the cached shell; create/edit a task then refresh; export a backup; import it after the replacement confirmation; view dashboard and course page at a phone-width viewport.

- [ ] **Step 6: Commit the finished first version**

```powershell
git add app
git commit -m "feat: complete local AI TA assistant v1"
```

## Spec Coverage Review

- Local PWA, installability, responsive layout: Task 1 and Task 6.
- Current week, urgency sorting, no completion percentage: Task 3 and Task 4.
- CDPS/BNA Roadmaps, four lanes, special dates, original-content preservation: Task 2 and Task 5.
- Editable work, repeated schedules, questions awaiting confirmation: Task 3 and Task 4.
- SOP knowledge base: Task 6.
- Local persistence, export/import, corruption safety: Task 3 and Task 6.
- No PII or external integrations: Global Constraints and Task 4/6 editor copy.
- W16 closing work and two report types: Task 5.
