# Huong Dan Test Phase 10 - Verification

Phase nay them test tu dong cho backend rules va browser smoke test cho flow MVP.

## Lenh test nhanh

Chay tu thu muc root:

```bash
npm run typecheck
npm run lint
npm run test:backend
npm run test:ui
npm run build
npx -y @fission-ai/openspec@latest validate add-personal-task-git-branch-manager --strict
```

## Backend test dang cover

```bash
npm run test:backend
```

Ky vong: 9 test pass.

Noi dung cover:

- API protected phai bi chan khi chua login.
- Sinh ma task theo project va nhom task: `OPS-001`, `OPS-BE-001`, `OPS-BE-002`.
- Tao branch tren app co checkout source, intended target, checkout command.
- Tao branch `B` tu branch `A` va ke thua task link.
- Merge feature vao release chi dua task vao `MERGED_RELEASE`, khong done.
- Merge release vao `main` khong can ready-main rieng va done task khi branch flow hop le.
- Task co nhieu lineage chi done khi tat ca lineage bat buoc da vao `main`.
- Branch `B` merge vao `main` co the done task duoc carry tu `A`.
- Ghi nhan actual merged-into khong lam mat intended target.
- Branch da dong khong duoc auto done task.

## Browser UI test

```bash
npm run test:ui
```

Ky vong: 1 Playwright test pass.

Flow browser dang cover:

- Setup tai khoan dau tien.
- Logout, login lai va restore session.
- Tao project `OPS`, tao nhom task `BE`, tao repository GitLab noi bo.
- Mo tab Workflow va luu status `DONE` label `Hoan tat`.
- Tao note inbox, luu tru note, filter note, chuyen note thanh task.
- Mo All Tasks va thay task theo trang thai.
- Tao branch `A`, merge release.
- Tao branch `B` tu `A`, merge main.
- Xac nhan task vao bucket `Hoan tat`.
- Mo timeline, them comment, kiem tra event merge main.
- Search branch bang global search va mo drawer chi tiet branch.

## Ghi chu

- `npm run build` co the hien canh bao Vite chunk lon do Ant Design Vue; day la warning, khong phai loi phase nay.
- Playwright co the hien warning `ResizeObserver loop completed...`; test van pass va day la warning runtime UI thuong gap voi table/layout.
- Phase 11 GitLab webhook automation chua duoc lam trong phase nay va dang cho review.
