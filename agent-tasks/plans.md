# OpenSpec source of truth

Plan nay da duoc chuyen sang OpenSpec change:

- Change ID: `add-personal-task-git-branch-manager`
- Proposal: `openspec/changes/add-personal-task-git-branch-manager/proposal.md`
- Design: `openspec/changes/add-personal-task-git-branch-manager/design.md`
- Tasks: `openspec/changes/add-personal-task-git-branch-manager/tasks.md`
- Specs: `openspec/changes/add-personal-task-git-branch-manager/specs/*/spec.md`

Change API Lab moi dang cho review:

- Change ID: `add-api-lab-workflows`
- Proposal: `openspec/changes/add-api-lab-workflows/proposal.md`
- Design: `openspec/changes/add-api-lab-workflows/design.md`
- Tasks: `openspec/changes/add-api-lab-workflows/tasks.md`
- Specs: `openspec/changes/add-api-lab-workflows/specs/api-lab/spec.md`

Lenh kiem tra:

```bash
npx -y @fission-ai/openspec@latest status --change add-personal-task-git-branch-manager
npx -y @fission-ai/openspec@latest validate add-personal-task-git-branch-manager --strict
npx -y @fission-ai/openspec@latest status --change add-api-lab-workflows
npx -y @fission-ai/openspec@latest validate add-api-lab-workflows --strict
```

## Ghi chú plan API Lab

- Them menu `API Lab` moi, tach rieng voi `/tasks` va `/branches`, nhung co the link request/flow/run vao task.
- Ho tro luu environment local/dev/uat/prod/custom, variable variant, request, flow nhieu step, capture output tu API truoc de lam input cho API sau bang bien `{{variableName}}`.
- Goi request qua backend de tranh CORS, co timeout, gioi han response size, mask secret, va chi luu run metadata mac dinh; response body chi luu khi user chu dong.
- Ho tro import cURL trong MVP.
- Ho tro keo tha sap xep step va keo field tu response JSON sang request sau de tao mapping.
- Co assertion don gian cho status code, JSON path, header, body contains, va duration.
- Co the attach ket qua run vao timeline task nhu bang chung test API, nhung khong lam thay doi status task/branch.
- Trien khai theo phase va dung review sau tung phase; khong implement khi chua co dong y.

## Ghi chú rule hiện tại - Phase 12

- Luồng branch chính: task branch checkout từ `main`, merge vào `develop` nếu là feature, merge vào release branch theo tuần, rồi release branch merge vào `main`.
- Release branch là branch cha theo tuần, ví dụ `release/08072026`; nó checkout từ `main`, nhận các task branch con, rồi merge ngược vào `main`.
- Task chỉ xem là hoàn tất khi branch chứa task đã đi theo release branch vào `main`.
- Mỗi task chỉ có một branch active. Nếu task được gắn sang branch mới, link branch cũ sẽ bị tắt và trạng thái task đồng bộ theo branch mới.
- Trạng thái task rút gọn theo branch: chưa có branch là `Chưa làm`, branch đang code/develop là `Đang tiến hành`, branch ở release là `Đang ở release`, branch theo main/prod là `Lên prod`.
- Branch task link được phép thêm/gỡ khi branch còn ở `CODING` hoặc `MERGED_DEVELOP`. Từ `MERGED_RELEASE` trở đi thì task link bị khóa để không làm lệch lịch sử release/main.
- Có thể kéo nhầm release branch từ `main` về lại `MERGED_RELEASE`; thao tác này kéo các child branch và task liên quan về trạng thái release.
- Khi release parent còn ở `MERGED_RELEASE`, có thể gỡ child branch khỏi release bằng cách edit status hoặc kéo child ra cột trạng thái bình thường; app sẽ xóa release assignment/actual target và đưa task liên quan ra khỏi release nếu task không còn branch bắt buộc nào ở release/main.
- Có thể xóa branch khi branch chưa vào `main`. Khi xóa, app ghi timeline audit trước rồi xóa branch record, alias và task link liên quan.
- Không được xóa branch đã vào `main`.
- Không được xóa release branch cha nếu nó còn child task branch bên trong.
- Khi xóa release branch, app đóng release cycle cùng tên. Dropdown gắn/đổi release chỉ liệt kê release branch record còn tồn tại trong repository, và backend không tự tạo lại release branch cũ khi submit tên đã xóa.
- Khi release parent đang ở `main`, child branch không được thoát cha: không đổi release, không kéo/đổi status riêng, không xóa. Muốn sửa nhầm thì kéo release parent về `MERGED_RELEASE` trước, sau đó mới đổi release hoặc xóa child branch.
- UI `/branches` ưu tiên hiện đủ action/status để user thấy toàn bộ luồng, nhưng action/status/field nào không hợp lệ theo trạng thái hiện tại thì disable thay vì ẩn hoặc cho edit giả.

# Plan xây mini app quản lý công việc cá nhân theo Git branch

## 1. Mục tiêu

Xây một mini app VueJS để quản lý task cá nhân theo dự án, theo dõi task đang nằm trong branch Git nào, branch đang ở trạng thái nào, đã merge UAT/PROD chưa, và tự động/có kiểm soát cập nhật task thành `Done` khi branch chứa task đã merge lên production.

App cần giải quyết 4 vấn đề chính:

1. Ghi nhanh các yêu cầu lắc nhắc vào inbox để không thất lạc.
2. Chuyển yêu cầu thành task có mã rõ ràng, đưa vào plan làm việc.
3. Gắn task với một hoặc nhiều Git branch để biết việc đang nằm ở đâu.
4. Theo dõi lifecycle từ code -> test -> UAT -> production, có timeline lịch sử.

## 2. Nguyên tắc thiết kế

- Gọn như một internal tool, ưu tiên thao tác nhanh, ít trang rườm rà.
- Không biến app thành Jira thu nhỏ; chỉ giữ các trường thật sự giúp truy vết task/branch.
- Task và branch phải là 2 thực thể riêng, vì một branch có thể chứa nhiều task và một task đôi khi có nhiều branch fix.
- Mọi thay đổi quan trọng đều ghi vào timeline event: tạo task, link branch, đổi trạng thái, merge UAT, merge PROD.
- Bản MVP cho phép nhập tay branch/merge trước; sau đó mới thêm webhook GitHub/GitLab/Bitbucket để tự động hóa.

## 3. Tech stack đề xuất

### Frontend

- Vue 3 + Vite + TypeScript.
- Ant Design Vue cho UI component.
- Vue Router cho route.
- Pinia cho state cục bộ như user/session/filter.
- Axios hoặc TanStack Query cho API data fetching.
- Day.js cho format thời gian.

### Backend

Ưu tiên một backend API gọn:

- Node.js + NestJS nếu muốn kiến trúc rõ, dễ mở rộng.
- Hoặc Express/Fastify nếu muốn cực gọn cho cá nhân.
- Prisma ORM.
- PostgreSQL nếu muốn dùng lâu dài; SQLite nếu muốn MVP chạy local nhanh.
- JWT access token + refresh token cho login.

Khuyến nghị thực tế: bắt đầu với `Vue 3 + Ant Design Vue + NestJS + Prisma + PostgreSQL`. Nếu muốn ship rất nhanh trong máy cá nhân, dùng SQLite trước rồi đổi PostgreSQL sau.

## 4. Module chính

### 4.1. Login/Auth

Chức năng:

- Đăng nhập bằng email/password.
- Lưu access token ở memory/local storage tùy mức bảo mật mong muốn.
- Middleware backend bảo vệ API.
- Tạm thời chỉ cần 1 user cá nhân, nhưng schema vẫn để `user_id` để sau này mở rộng.

Route/UI:

- `/login`
- Logout ở góc phải layout chính.

### 4.2. Project

Mỗi task/branch thuộc một project.

Trường dữ liệu:

- `id`
- `name`
- `code`, ví dụ `CRM`, `OPS`, `WEB`
- `description`
- `default_repo_id`
- `created_at`
- `updated_at`

UI:

- Sidebar danh sách project.
- Filter toàn app theo project.
- Trang `/projects/:projectId`.

### 4.3. Inbox ghi nhanh yêu cầu

Đây là nơi nhập các yêu cầu nhỏ, chưa cần phân tích ngay.

Chức năng:

- Quick add note bằng một ô input lớn.
- Gán project nếu đã biết.
- Gán source: chat, meeting, bug report, self note, customer.
- Convert note thành task.
- Archive note nếu không làm nữa.

Trạng thái note:

- `NEW`
- `CONVERTED`
- `ARCHIVED`

UI:

- Panel "Inbox" ở dashboard.
- Shortcut nhập nhanh.
- Drawer convert note -> task.

### 4.4. Task

Task là đơn vị quản lý công việc chính.

Trường dữ liệu:

- `id`
- `project_id`
- `code`, ví dụ `CRM-001`
- `title`
- `description`
- `status`
- `priority`
- `type`
- `source_note_id`
- `assignee_id`
- `target_date`
- `done_at`
- `created_at`
- `updated_at`

Status hiện tại:

- `PLANNED`: chưa gắn branch nào.
- `IN_PROGRESS`: đang code hoặc đã vào develop.
- `MERGED_RELEASE`: active branch đã vào release.
- `DONE`: release đã merge vào `main`/prod.

Priority:

- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

Type:

- `FEATURE`
- `BUG`
- `CHORE`
- `HOTFIX`
- `REFACTOR`
- `RESEARCH`

UI:

- Kanban board theo status.
- Table view có filter/sort.
- Task detail drawer thay vì mở page mới để thao tác nhanh.
- Search theo mã task, title, branch name.

### 4.5. Repository và Git branch

Repository giúp app biết branch thuộc repo nào.

Repository fields:

- `id`
- `project_id`
- `name`
- `provider`: `GITHUB`, `GITLAB`, `BITBUCKET`, `LOCAL`, `OTHER`
- `remote_url`
- `default_branch`, ví dụ `main`, `master`, `develop`
- `uat_branch`, ví dụ `uat`, `staging`
- `prod_branch`, ví dụ `main`, `production`

Branch fields:

- `id`
- `repo_id`
- `name`
- `short_name`
- `status`
- `base_branch`
- `merge_request_url`
- `created_from_task_id`
- `merged_uat_at`
- `merged_prod_at`
- `created_at`
- `updated_at`

Branch status hiện tại:

- `CODING`: đang code.
- `MERGED_DEVELOP`: vào develop.
- `MERGED_RELEASE`: vào release.
- `MERGED_MAIN`: vào main/prod.

Liên kết task-branch:

- Một branch có thể chứa nhiều task.
- Một task có thể nằm trong nhiều branch.
- Dùng bảng trung gian `task_branches`.

Fields `task_branches`:

- `task_id`
- `branch_id`
- `role`: `PRIMARY`, `FIX`, `FOLLOW_UP`, `CHERRY_PICK`
- `created_at`

Quy ước đặt branch:

- Khi tạo task, sinh mã như `CRM-001`.
- Gợi ý branch: `feature/CRM-001-ten-ngan-gon`.
- Nếu branch thực tế đang ngắn hoặc đã tồn tại, cho phép thêm alias và link thủ công.

### 4.6. Merge event và timeline

Timeline là phần quan trọng để biết chuyện gì đã xảy ra.

Timeline event fields:

- `id`
- `project_id`
- `task_id`
- `branch_id`
- `event_type`
- `title`
- `description`
- `metadata` dạng JSON
- `created_by`
- `created_at`

Event type đề xuất:

- `NOTE_CREATED`
- `TASK_CREATED`
- `TASK_STATUS_CHANGED`
- `BRANCH_CREATED`
- `BRANCH_LINKED`
- `BRANCH_STATUS_CHANGED`
- `MERGED_TO_UAT`
- `MERGED_TO_PROD`
- `COMMENT_ADDED`
- `BLOCKED`
- `UNBLOCKED`

Luồng cập nhật khi merge:

1. Feature/hotfix branch checkout từ `main`.
2. Khi branch vào develop, task vẫn là `IN_PROGRESS`.
3. Khi branch được gắn/merge vào release branch, task chuyển `MERGED_RELEASE`.
4. Khi release branch merge vào `main`, các branch con đi theo release vào `MERGED_MAIN`.
5. Task gắn với branch active chuyển `DONE` khi branch đó đã đi qua release và vào `main`.

## 5. Màn hình đề xuất

### 5.1. Main layout

- Sidebar: Project, Dashboard, Inbox, Tasks, Branches, Timeline, Settings.
- Header: project switcher, search global, user menu.
- Content: dùng Ant Design Vue layout/table/card/tabs/drawer.

### 5.2. Dashboard

Mục tiêu: mở app lên là biết hôm nay cần làm gì.

Blocks:

- Tasks đang `IN_PROGRESS`.
- Branch đang `CODING`, `MERGED_DEVELOP`, `MERGED_RELEASE`.
- Inbox notes chưa convert.
- Việc bị `BLOCKED`.
- Timeline gần đây.

### 5.3. Inbox

- Danh sách note mới.
- Quick add note.
- Convert to task.
- Bulk convert/archive.

### 5.4. Task board

- Kanban theo status.
- Kéo thả đổi status nếu cần.
- Filter theo project, priority, type, branch status.
- Mở task detail bằng drawer.

### 5.5. Task table

- View dạng bảng để scan nhanh.
- Cột quan trọng: code, title, status, branch, priority, updated at, target date.
- Quick action: link branch, đổi status, mark blocked.

### 5.6. Branch board

- Board hoặc table nhóm theo branch status.
- Hiển thị branch name, repo, linked tasks, MR/PR URL, UAT/PROD status.
- Quick action: merge develop, gắn/merge release, merge main.

### 5.7. Timeline

- Timeline theo project.
- Filter theo task, branch, event type, ngày.
- Khi mở task/branch detail cũng có tab timeline riêng.

### 5.8. Settings

- Quản lý project.
- Quản lý repository.
- Cấu hình tên nhánh UAT/PROD.
- Token/webhook config để tích hợp Git sau MVP.

## 6. API backend đề xuất

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Projects:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`

Notes:

- `GET /api/notes?projectId=&status=`
- `POST /api/notes`
- `PATCH /api/notes/:id`
- `POST /api/notes/:id/convert-to-task`
- `POST /api/notes/:id/archive`

Tasks:

- `GET /api/tasks?projectId=&status=&q=&branchId=`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `POST /api/tasks/:id/status`
- `POST /api/tasks/:id/link-branch`
- `DELETE /api/tasks/:id/link-branch/:branchId`

Repositories:

- `GET /api/repositories?projectId=`
- `POST /api/repositories`
- `PATCH /api/repositories/:id`

Branches:

- `GET /api/branches?projectId=&repoId=&status=&q=`
- `POST /api/branches`
- `GET /api/branches/:id`
- `PATCH /api/branches/:id`
- `POST /api/branches/:id/status`
- `POST /api/branches/:id/mark-merged-uat`
- `POST /api/branches/:id/mark-merged-prod`

Timeline:

- `GET /api/timeline?projectId=&taskId=&branchId=&eventType=`
- `POST /api/timeline/comment`

Git webhook sau MVP:

- `POST /api/webhooks/gitlab`
- `POST /api/webhooks/github`

## 7. Database schema mức MVP

Các bảng chính:

- `users`
- `projects`
- `repositories`
- `notes`
- `tasks`
- `branches`
- `task_branches`
- `timeline_events`
- `refresh_tokens`

Index nên có:

- `tasks(project_id, status)`
- `tasks(code)`
- `branches(repo_id, name)`
- `branches(status)`
- `task_branches(task_id, branch_id)`
- `timeline_events(project_id, created_at)`
- Full text hoặc search đơn giản cho `tasks.title`, `branches.name`, `notes.content`.

## 8. Luồng sử dụng mẫu

### Luồng 1: Ghi nhận yêu cầu nhỏ

1. Mở Dashboard.
2. Nhập nhanh note: "Sửa lỗi validate form khách hàng".
3. Note nằm ở Inbox.
4. Khi plan, convert note thành task `CRM-001`.
5. Gán priority, type, target date.

### Luồng 2: Bắt đầu code

1. Mở task `CRM-001`.
2. Bấm "Create/link branch".
3. App gợi ý `fix/CRM-001-validate-form-khach-hang`.
4. User nhập branch thực tế nếu đã tạo trước.
5. Task chuyển sang `IN_PROGRESS`, branch chuyển `CODING`.
6. Timeline ghi event link branch.

### Luồng 3: Test và UAT

1. Branch code xong, user đổi branch sang `READY_TEST`.
2. Sau test, đổi sang `READY_UAT`.
3. Khi merge UAT, user bấm `Mark merged UAT`.
4. App cập nhật branch `MERGED_UAT`.
5. Các task trong branch chuyển sang `MERGED_UAT` nếu hợp lệ.

### Luồng 4: Merge production

1. Branch đã UAT ổn, user bấm `Mark ready PROD`.
2. Khi merge production, user bấm `Mark merged PROD`.
3. App tạo event `MERGED_TO_PROD`.
4. Các task trong branch chuyển `DONE` nếu không còn branch liên quan chưa lên prod.

## 9. Quy tắc trạng thái quan trọng

- Không tự chuyển task sang `DONE` chỉ vì branch đã merge UAT.
- Chỉ chuyển `DONE` khi branch liên quan đã merge production.
- Nếu task gắn nhiều branch, chỉ `DONE` khi tất cả branch bắt buộc đã merge production.
- Nếu branch chứa nhiều task, merge production cập nhật tất cả task liên quan.
- Nếu một branch bị đóng/hủy, không cập nhật task thành done; chỉ ghi timeline và yêu cầu user chọn trạng thái task tiếp theo.
- Cho phép override thủ công nhưng phải ghi timeline event.

## 10. Gợi ý UX để app gọn mà vẫn đủ

- Dùng drawer cho task detail và branch detail để không phải chuyển trang nhiều.
- Dùng global search thật mạnh: nhập branch name là ra task, nhập mã task là ra branch.
- Dashboard chỉ hiển thị việc cần hành động, không hiển thị mọi thứ.
- Branch board nên có quick action rõ vì đây là điểm đau chính.
- Timeline chỉ cần filter tốt, không cần trang trí nhiều.
- Nên có badge màu nhất quán:
  - Xám: inbox/draft.
  - Xanh dương: planned/in progress.
  - Vàng: testing/ready.
  - Tím: UAT.
  - Xanh lá: production done.
  - Đỏ: blocked/cancelled.
- Không nên tạo quá nhiều field như story point, sprint, epic trong MVP nếu chưa thật sự cần.

## 11. Milestone triển khai

### Phase 0: Chốt scope và bootstrap

- Khởi tạo monorepo hoặc 2 thư mục `frontend` và `backend`.
- Cài Vue 3, Vite, TypeScript, Ant Design Vue.
- Cài backend API, Prisma, database.
- Tạo migration các bảng MVP.
- Tạo seed user/project mẫu.

Kết quả: app chạy được login và layout chính.

### Phase 1: Auth, project, inbox, task cơ bản

- Login/logout.
- CRUD project.
- Quick add note.
- Convert note thành task.
- Task table + task drawer.
- Đổi task status thủ công.
- Ghi timeline cho task events.

Kết quả: quản lý được yêu cầu lắc nhắc và plan thành task.

### Phase 2: Branch tracking

- CRUD repository.
- Tạo/link branch với task.
- Branch table/board.
- Task detail hiển thị branch liên quan.
- Branch detail hiển thị task liên quan.
- Search theo task/branch.

Kết quả: biết task nằm ở branch nào, branch đang ở trạng thái nào.

### Phase 3: UAT/PROD workflow

- Quick actions `Merge develop`, `Gắn/Merge release`, `Merge main`.
- Rule tự cập nhật task status theo branch merge.
- Timeline merge events.
- Dashboard hiển thị nhóm task/branch đang tiến hành, đang ở release, lên prod và blocked nếu có.

Kết quả: merge prod xong thì task tự về `DONE` đúng quy tắc.

### Phase 4: Timeline và báo cáo gọn

- Timeline page có filter.
- Activity tab trong task/branch drawer.
- Báo cáo số task theo status/project.
- View "Tasks not linked to branch".
- View "Branches not merged to prod".

Kết quả: dễ rà soát thiếu sót trước khi merge/release.

### Phase 5: Git integration tự động

Làm sau khi MVP nhập tay đã chạy ổn.

- Webhook GitLab/GitHub nhận merge request/pull request event.
- Match branch theo `branch.name`.
- Tự tạo merge event khi branch merge vào UAT/PROD.
- Tự cập nhật branch status và task status.
- Tùy chọn sync list branch từ remote.

Kết quả: giảm thao tác thủ công, nhưng vẫn giữ khả năng override trong app.

## 12. Cấu trúc thư mục đề xuất

Nếu dùng monorepo:

```text
quan_ly_cong_viec/
  frontend/
    src/
      app/
      components/
      modules/
        auth/
        projects/
        notes/
        tasks/
        branches/
        timeline/
      router/
      stores/
      services/
      styles/
  backend/
    src/
      modules/
        auth/
        users/
        projects/
        notes/
        tasks/
        branches/
        timeline/
        repositories/
        webhooks/
      prisma/
  agent-tasks/
    plans.md
```

## 13. Acceptance criteria cho MVP

MVP được xem là đủ dùng khi:

- User login được.
- Tạo project được.
- Ghi nhanh note và convert thành task được.
- Tạo task thủ công được.
- Tạo/link branch với task được.
- Xem được task theo project/status.
- Xem được branch theo status.
- Mark branch merged UAT/PROD được.
- Task tự chuyển `DONE` khi branch liên quan merge PROD đúng rule.
- Timeline ghi lại các thay đổi quan trọng.
- Search được theo task code, task title, branch name.

## 14. Rủi ro và cách xử lý

- Branch đặt tên không theo task code: hỗ trợ link thủ công và alias.
- Một branch chứa nhiều task: dùng quan hệ nhiều-nhiều.
- Một task có nhiều branch: chỉ done khi các branch bắt buộc đã lên prod.
- Merge/cherry-pick phức tạp: thêm `role = CHERRY_PICK` trong `task_branches`.
- Webhook match sai branch: MVP nhập tay trước, webhook làm sau và có log event để kiểm tra.
- Quá nhiều status gây rối: UI nên gom nhóm status khi hiển thị, nhưng backend vẫn lưu chi tiết.

## 15. Khuyến nghị triển khai trước

Nên làm MVP theo thứ tự này:

1. Login + project + layout.
2. Inbox note -> task.
3. Task table/drawer.
4. Branch table/drawer + link task.
5. Mark merge UAT/PROD + auto update task.
6. Timeline.
7. Global search.
8. Git webhook.

Không nên làm webhook Git ngay từ đầu. Điểm đau hiện tại là thiếu nơi gom thông tin và liên kết task-branch; chỉ cần nhập tay nhanh, đúng rule, có timeline là đã giảm rối đáng kể.

## 16. Bổ sung sau review phase 12

- Task có thể tạo thủ công từ màn `/tasks` hoặc tạo từ note.
- Task được phép xóa khi chưa lên `main/prod`; khi xóa phải ghi timeline `TASK_DELETED`, xóa link task-branch qua cascade, nhưng giữ branch record để không mất lịch sử branch.
- Task đã `DONE` hoặc active branch đã vào `MERGED_MAIN` thì không cho xóa, vì lúc này task là một phần của lịch sử release/prod.
- Ở màn nhánh, task liên quan hiển thị tiêu đề trước để dễ đọc trong công việc hằng ngày; mã task chỉ là ref phụ giống id, còn nhóm task chủ yếu dùng cho view/filter/task code.
- Cột ưu tiên của task hiển thị dạng tag gọn:
  - Low: xanh lá, icon 1 gạch.
  - Medium: vàng, icon 2 gạch.
  - High: đỏ, icon 3 gạch.
- Hover vào tag ưu tiên phải thấy label Low/Medium/High để không phụ thuộc hoàn toàn vào màu sắc.
- Màn `/tasks` không còn nút hoặc field `Sẵn sàng main`; trạng thái task là tag/summary đọc từ branch active.
- Task đã `DONE` hoặc active branch đã vào `main/prod` chỉ được xem lại: field sửa, nút lưu và nút xóa phải disable; backend cũng chặn PATCH/DELETE để tránh sửa nhầm.
- Merge release vào `main` không cần ready-main riêng ở task; `main/prod` là source of truth để task chuyển `DONE`.
- Task chip nằm trong branch table, Kanban, release child và branch drawer dùng màu theo priority của task: Low xanh lá, Medium vàng, High đỏ.
- Task có thể `Hủy` mà không xóa: hệ thống giữ record, chuyển status `CANCELLED`, gỡ active branch link và ghi timeline. Task hủy không được gắn/kế thừa vào branch; muốn dùng lại phải `Phục hồi nháp` về `PLANNED`, sau đó add vào branch như task mới chưa làm.
- Nút `Kế thừa task từ branch nguồn` chỉ kế thừa task chưa done: bỏ qua task `DONE`, task `CANCELLED`, hoặc task đã có `done_at`, để branch mới không kéo theo việc đã hoàn tất hoặc đã hủy.
- Task có thêm trạng thái công việc riêng `workStatus`: `TODO`/Chưa làm, `DOING`/Đang làm, `TESTING`/Đang test, `DONE`/Đã xong. Field này không thay thế status theo branch; `/tasks` phải hiển thị cả active branch, status theo branch và workStatus.
- Màn `/branches` cho phép đổi `workStatus` ngay trên task linked trong table, Kanban, release child và drawer; đổi workStatus chỉ ghi timeline `TASK_WORK_STATUS_CHANGED`, không đổi lifecycle branch.
- Task drawer mở rộng khoảng 70% viewport để đọc chi tiết dễ hơn. Mô tả task vẫn edit bằng textarea, đồng thời có preview code block để đọc JSON/code-like text.
