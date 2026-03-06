# MyDudu Complete Business Process Flows (4 Users x 2 Modes)

Generated from code scan of:
- `apps/web-operator` (Admin, Puskesmas, Posyandu)
- `apps/web-parent` (Parent)

## 1) Scope and Roles

### 1.1 Four user roles
1. `IT Admin` (`ADMIN`)
2. `Operator Puskesmas` (`PUSKESMAS`)
3. `Operator Posyandu` (`POSYANDU`)
4. `Parent` (`PARENT`)

### 1.2 Two modes
1. `Desktop`
2. `Mobile`

### 1.3 Mode behavior summary
1. `web-operator` is desktop-first (left sidebar + topbar layout). Modals are mobile-adaptive (bottom-sheet style), but full workflow is operationally desktop-oriented.
2. `web-parent` is mobile-first (`max-w-md`, bottom tab navigation), but still usable on desktop (phone-like centered layout).

## 2) Global Entry Flows

### G-01 Operator/Admin Login (Google)
- Initial state: open operator app, unauthenticated, `Login` page.
- Opens: login card with `Masuk dengan Google`.
- Steps:
1. Click `Masuk dengan Google`.
2. Choose Google account in popup.
3. Backend `/auth/sync` validates role.
- Inputs: Google account selection.
- Final state:
1. Success -> app shell opens (`Sidebar`, `Topbar`, role-based default page).
2. Failure -> error message shown, user stays logged out.

### G-02 Parent Login (NIK + birthdate credential)
- Initial state: open parent app, unauthenticated, parent `LoginPage`.
- Opens: input `NIK dan Tanggal Lahir`, submit button `Masuk`.
- Steps:
1. Type 24 digits (16-digit NIK + 8-digit DOB `DDMMYYYY`).
2. Click `Masuk`.
3. System calls `/auth/verify-nik`.
- Inputs: numeric credential (24 digits).
- Final state:
1. Success -> parent dashboard opens, first child auto-selected if exists.
2. Failure -> inline error shown.

## 3) Role: Operator Posyandu (Desktop + Mobile)

### Navigation buttons visible
1. `Beranda`
2. `Data Anak`
3. `Alat Dudu`
4. `Validasi Medis` (disabled, `Soon`)
5. `Pemeriksaan`

### Topbar buttons
1. `Notifikasi` (disabled)
2. `Pengaturan Profil` (settings icon)
3. `Keluar`

### OP-01 Open Dashboard (Beranda)
- Initial: logged in as Posyandu.
- Steps: click `Beranda`.
- Final: dashboard with cards, latest sessions table, agenda section.

### OP-02 Register Parent (`Daftar Wali`)
- Initial: dashboard header action area.
- Opens: `RegisterParentDialog` modal.
- Steps:
1. Click `Daftar Wali`.
2. Fill `Nama Lengkap`, `NIK`, `Tanggal Lahir`, `Desa/Kelurahan`.
3. Choose village from autocomplete dropdown.
4. Click `Daftarkan Wali anak`.
- Final:
1. Success -> modal closes, dashboard data refreshes.
2. Validation/API error -> inline error remains in modal.

### OP-03 Register Child (`Daftar Anak`)
- Initial: dashboard header action area.
- Opens: `RegisterChildDialog` modal.
- Steps:
1. Click `Daftar Anak`.
2. Fill `Nama Lengkap`, `Tanggal Lahir`, `Jenis Kelamin`, `Golongan Darah`.
3. Search/select `Orang Tua` from dropdown.
4. Click `Simpan`.
- Final: child created and dashboard refreshed, or error shown.

### OP-04 Manual Measurement Input (`Input`)
- Initial: dashboard -> `Pemeriksaan Terbaru` section.
- Opens: `ManualEntryDialog` modal.
- Steps:
1. Click `Input`.
2. Select `Nama Wali anak` (dropdown).
3. Select `Nama Anak` (dropdown filtered by parent).
4. Select `Alat Dudu`.
5. Enter optional vitals: `Berat`, `Tinggi`, `Suhu`, `Detak`, `Kebisingan`.
6. Click `Kirim Data`.
- Final: telemetry session created (`/devices/manual-telemetry`) and list refreshes.

### OP-05 Add Posyandu Schedule (`Tambah Agenda`)
- Initial: dashboard -> `Agenda Posyandu Mendatang`.
- Opens: `ScheduleDialog` modal.
- Steps:
1. Click `Tambah Agenda`.
2. Fill `Nama Kegiatan`, `Deskripsi`, `Nama Posyandu/Lokasi`, `Tanggal`, `Mulai`, `Selesai`.
3. Click `Simpan Agenda`.
- Final: schedule saved and agenda list refreshes.

### OP-06 Child Records Search/Filter
- Initial: click sidebar `Data Anak`.
- Steps:
1. Type search (child or parent name).
2. Select `Semua Desa` / specific village.
3. Select `Semua Status` / WHO status.
- Final: table filtered.

### OP-07 Connect Child to Last Device (`Connect`)
- Initial: `Data Anak` table row.
- Steps:
1. Click row button `Connect`.
2. System sends start command to last known device (`/operator/device/{uuid}/start`).
- Final:
1. Success message `START dikirim...`.
2. Failure/No device -> error message banner.

### OP-08 Open Child Growth Detail (`Eye` icon)
- Initial: `Data Anak` row action.
- Steps: click eye icon.
- Final: `ChildDetailDialog` opens with growth analysis cards.

### OP-09 Parent Table Filter
- Initial: same `Data Anak` page, `Data Orang Tua` table.
- Steps: search by parent name/NIK, filter village, change items-per-page.
- Final: filtered parent listing.

### OP-10 Device Monitoring List
- Initial: click sidebar `Alat Dudu`.
- Steps:
1. Search device name.
2. Filter status (`AVAILABLE`, `WAITING`, `INACTIVE`).
3. Click row `Connect` (enabled only when `AVAILABLE`).
- Final: device detail modal opens (close via `X`).

### OP-11 Enter Pemeriksaan Flow
- Initial: click sidebar `Pemeriksaan`.
- Gate behavior:
1. If queue empty/error -> popup `Pemeriksaan Tidak Tersedia` with close `X`.
2. If queue exists -> full-screen `ScreeningFlow` opens.
- Final: either stays on dashboard with gate message, or enters screening UI.

### OP-12 ScreeningFlow - Switch patient from queue
- Initial: inside screening sidebar queue list.
- Steps: click another queue patient button.
- Final: current lock released, new session claimed, VITALS state reset.

### OP-13 ScreeningFlow - Continue to quiz
- Initial: phase `VITALS`.
- Steps: click `Analisis Gejala Lanjutan`.
- Final: phase changes to `QUIZ`, clinical session starts.

### OP-14 ScreeningFlow - Answer clinical questions
- Initial: `ClinicalQuizPage`.
- Steps: repeatedly click `YES` or `No`.
- Final:
1. next question loaded, or
2. outcome reached -> phase `RESULT`.

### OP-15 ScreeningFlow - Finish/Cancel session (`Selesaikan Sesi`)
- Initial: sidebar bottom button.
- Steps: click `Selesaikan Sesi`.
- Final: calls cancel endpoint, resets state, reloads queue.

### OP-16 ScreeningFlow - Exit flow (`Keluar`)
- Initial: sidebar bottom button.
- Steps: click `Keluar`.
- Final: exits full-screen pemeriksaan back to operator dashboard shell.

### OP-17 Profile Modal
- Initial: topbar settings icon.
- Opens: `ProfileModal`.
- Steps:
1. Optionally upload photo (`Camera` -> file input -> cropper confirm/cancel).
2. Edit `Nama Lengkap`.
3. Click `Simpan Perubahan` or `Batal`.
- Final: profile updated or modal closed.

### OP-18 Logout
- Initial: topbar `Keluar`.
- Steps: click button.
- Final: Firebase sign-out and redirect to `/login`.

### OP-19 Disabled actions to note (visible but not operable)
1. Sidebar `Validasi Medis` is disabled (`Soon`).
2. Topbar notifications button is disabled.

## 4) Role: Operator Puskesmas (Desktop + Mobile)

### Navigation buttons visible
1. `Beranda`
2. `Data Anak`
3. `Alat Dudu`
4. `Validasi Medis` (disabled)
5. `User Management` (special for puskesmas)

### PK-01 Dashboard view
- Same as Posyandu dashboard minus Posyandu-only actions (`Daftar Wali`, `Daftar Anak`, `Input`, `Tambah Agenda`).
- Includes disease distribution map section.

### PK-02 Child data and parent data flows
- Same as OP-06/07/08/09 (search/filter/connect/detail).

### PK-03 Device monitoring flows
- Same as OP-10.

### PK-04 User Management (Puskesmas scope)
- Initial: click sidebar `User Management`.
- Steps:
1. Search users.
2. Filter role.
3. Click `Register Posyandu` (open modal).
4. Fill form fields (`Full Name`, `Email`, `NIK`, district/village pickers, optional profile picture).
5. Click `Register` (or `Save Changes` when editing).
6. Use row actions `Edit`, `Delete User`.
- Final: user record created/updated/deleted.

### PK-05 Disabled actions to note
1. `Pemeriksaan` menu is removed for puskesmas role.
2. `Validasi Medis` still disabled in sidebar.

## 5) Role: IT Admin (Desktop + Mobile)

### Navigation buttons visible
1. `System Overview`
2. `User Management`
3. `Device Registry`
4. `System Logs`

### AD-01 System Overview dashboard
- Initial: admin login lands here.
- Steps: no primary action buttons; passive monitoring cards/lists.
- Final: view telemetry, users/devices/sessions/incidents/log summaries.

### AD-02 User Management - create user
- Initial: `User Management` page.
- Steps:
1. Click `Register Puskesmas`.
2. Fill form (name, email, NIK, district/village, optional photo).
3. Click `Register`.
- Final: new user added and list refreshes.

### AD-03 User Management - edit/delete active users
- Initial: active users tab.
- Steps:
1. Click row `Edit` (pencil) -> update fields -> `Save Changes`.
2. Click row `Delete User` (trash) -> confirm dialog.
- Final: updated/deleted user.

### AD-04 User Management - pending approvals
- Initial: click tab `Pending Approvals`.
- Steps:
1. Click approve icon (`Check`) -> confirm.
2. Or click reject icon (`X`) -> confirm.
- Final: pending user becomes approved or suspended.

### AD-05 Device Registry - register new device
- Initial: `Device Registry` page.
- Steps:
1. Click `Register New Device`.
2. Input `Device Name`.
3. Assign existing `Posyandu` or use `+ Add "..." as new Posyandu`.
4. If new posyandu, select village.
5. Click `Register`.
- Final: device created and table refreshes.

### AD-06 Device Registry - edit device
- Initial: device row action `Edit Device`.
- Steps:
1. Click edit icon.
2. Change `Device Name`, location, and `Status` select.
3. Click `Save Changes`.
- Final: device updated.

### AD-07 Device Registry search/filter
- Initial: page toolbar.
- Steps: type in `Search devices...`.
- Final: table filtered.

### AD-08 System Logs paging
- Initial: `System Logs` page.
- Steps:
1. Click `Previous` or `Next`.
- Final: log table page changes.

### AD-09 Global admin profile/logout
- Same as OP-17 and OP-18.

## 6) Role: Parent (Desktop + Mobile)

### Main visible navigation
1. Header child selector (dropdown in `RefinedHeader`)
2. Header notification bell
3. Bottom tabs: `Riwayat`, `Home` (logo), `Lainnya`

### PR-01 Select child from header dropdown
- Initial: logged-in parent home.
- Steps:
1. Tap/click header area to open dropdown.
2. Select child row.
- Final: selected child updated, health data/history reloaded.

### PR-02 Open notifications and mark read
- Initial: tap bell icon.
- Opens: `NotificationModal`.
- Steps:
1. Tap notification item.
- Final: notification marked as read; modal closes.

### PR-03 Home tab - read latest health summary
- Initial: tab `Home`.
- Steps: view `Status Kesehatan Anak`, vitals cards, next schedule.
- Final: informational state only.

### PR-04 Open education article
- Initial: `Edukasi Kesehatan` cards.
- Steps:
1. Tap card (`EduCard`) or `Baca Selengkapnya` button.
- Final: external article opens in new tab/window.

### PR-05 History tab
- Initial: tap bottom tab `Riwayat`.
- Steps: view trend charts and consultation history.
- Final: informational state only.

### PR-06 More tab -> Menu navigation
- Initial: tap bottom tab `Lainnya`.
- Menu buttons:
1. `Profil & Pengaturan`
2. `Kalkulator & Evaluasi`
3. `Informasi Hukum & Medis`
4. `Keluar`

### PR-07 More -> Calculator & Evaluation
- Initial: tap `Kalkulator & Evaluasi`.
- Steps:
1. Use plus/minus or type values for: `Usia`, `Tinggi`, `Berat`, `Suhu`, `Detak`, `Saturasi`.
2. Tap gender action button: `Laki-laki` or `Perempuan` (triggers evaluation).
3. Review status result and warning list.
- Final: calculated evaluation displayed locally.

### PR-08 More -> Legal/Medical info tabs
- Initial: tap `Informasi Hukum & Medis`.
- Steps:
1. Switch sub-tab: `Standar Medis`, `Privasi`, `Ketentuan`.
2. Read content/links.
- Final: informational state.

### PR-09 More -> Profile settings
- Initial: tap `Profil & Pengaturan`.
- Steps:
1. Switch sub-tab `Orang Tua` or `Anak`.
2. Parent tab: change photo (`Ubah Foto`), name, email.
3. Child tab: edit child name, birth date, gender, blood type.
4. Tap `Simpan Perubahan`.
- Final: local save handler executed (currently logs payload in frontend).

### PR-10 Parent logout
- Initial: More menu -> tap `Keluar`.
- Opens: confirmation modal.
- Steps:
1. Tap `Batal` to cancel, or `Keluar` to confirm.
- Final: on confirm, parent session resets to login page.

## 7) Mobile vs Desktop Differences per Role

### Operator roles (Admin/Puskesmas/Posyandu)
1. Desktop: full 2-column shell (sidebar + main content), intended primary workflow mode.
2. Mobile: same routes/components render, many dialogs become bottom sheets; complex tables remain horizontally scrollable and less practical.

### Parent role
1. Mobile: primary design target (sticky gradient header, bottom tab bar, single-column cards).
2. Desktop: same flow and controls, centered phone-like container (`max-w-md`) with identical process steps.

## 8) Disabled / Non-finalized Buttons and Controls (important)

1. Operator `Validasi Medis` sidebar item is disabled (`Soon`) in current navigation.
2. Operator topbar notifications bell is disabled.
3. Screening result `Cetak` button exists but is disabled.
4. Parent `Konsultasi dengan Tenaga Kesehatan` component exists but is not mounted in current page (commented out).
5. Parent profile `Simpan Perubahan` in More menu currently logs data locally (no persisted API write in this component).

## 9) Completeness Notes

This flow document includes all currently rendered and reachable role-based buttons from the scanned app code paths, plus explicitly visible disabled actions. Hidden/commented controls that are not rendered at runtime are excluded from primary flows and listed separately in section 8.
