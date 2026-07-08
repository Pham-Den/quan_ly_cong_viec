# Huong Dan Test Phase 11 - Branch Kanban

Phase nay chi cai tien `/branches`, chua lam GitLab webhook automation.

## Lenh test

Chay tu root:

```bash
npm run typecheck
npm run test:backend
npm run test:ui
npm run build
npx -y @fission-ai/openspec@latest validate add-personal-task-git-branch-manager --strict
```

## Review UI nhanh

1. Mo app:

```bash
sh dev.sh
```

2. Vao `Nhánh`.
3. Tao branch nhu cu.
4. Chon toggle `Kanban`.
5. Keo branch sang status binh thuong `Vào develop`.
6. Thu keo branch vao `Đã vào release` hoac `Đã vào main`.
7. Ky vong: app chan drop va bao dung nut `Merge release` hoac `Merge main`.
8. Thu keo branch vao `Đóng`.
9. Ky vong: app hoi xac nhan truoc khi dong branch.

## Review workflow settings

1. Vao `Cài đặt`.
2. Chon tab `Workflow`.
3. O bang `Branch status`, kiem tra cac cot moi:

- `Kanban`: cho phep/chặn kéo branch vao status.
- `Xác nhận`: status nay co can confirm khi drop khong.
- `Lý do chặn`: noi dung hien khi drop bi chan.

## Rule mac dinh

- Cho keo: `CODING`, `MERGED_DEVELOP`.
- Chan keo: `MERGED_RELEASE`, `MERGED_MAIN`.
- Kanban chi con 4 cot branch: `Đang code`, `Vào develop`, `Vào release`, `Vào main`.

## Ghi chu

- `Merge release` va `Merge main` van la action rieng, de khong bypass rule cap nhat task/timeline.
- Kanban la mot hang ngang. Neu man hinh hep, scroll ngang de xem cac cot.
