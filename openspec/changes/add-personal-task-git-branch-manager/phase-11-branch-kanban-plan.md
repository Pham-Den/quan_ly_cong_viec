# Phase 11 Plan - Branch Kanban And Status Movement

Phase nay tap trung review lai flow `/branches`, khong lam GitLab webhook automation.

## Hien trang

- `/branches` da co nut tao branch.
- Branch co the sua trong drawer `Chi tiet branch`.
- Drawer hien co select `Trang thai`, nen co the sua status thu cong.
- Hien da co board nhom theo status, nhung chi la danh sach rut gon, chua drag/drop.
- `Merge release` va `Merge main` dang la action rieng de giu dung rule update task/timeline.

## Muc tieu

- Giu table view hien tai de scan chi tiet.
- Them Kanban view de nhin branch theo lifecycle nhanh hon.
- Kanban la mot hang ngang: moi status la mot cot, cac cot cung nam tren mot row, man hinh hep thi scroll ngang.
- Cho phep keo branch card vao status duoc cau hinh la cho phep drop.
- Khong cho keo truc tiep vao status co rule dac biet neu viec do co the bypass business rule.

## Status drop rule de xuat

Default nen nhu sau:

- Cho phep drop: `CODING`, `MERGED_DEVELOP`.
- Chan drop mac dinh: `MERGED_RELEASE`, vi phai dung action `Merge release` de cap nhat actual target, task status va timeline.
- Chan drop mac dinh: `MERGED_MAIN`, vi phai dung action `Merge main` de tinh done task theo lineage.
- Branch status duoc rut gon con 4 cot: `CODING`, `MERGED_DEVELOP`, `MERGED_RELEASE`, `MERGED_MAIN`.

## UI flow de xuat

1. `/branches` co segmented control: `Bảng` / `Kanban`.
2. Filter repository, status, search dung chung cho ca 2 view.
3. Kanban hien column header gom mau status, ten status, so branch.
4. Branch card gom: branch name, repo, task title first, task code as secondary id, checkout source -> intended target -> actual merged/main state.
5. Keo card sang cot hop le thi goi API move status va ghi timeline.
6. Keo vao cot bi chan thi card quay ve vi tri cu va hien message nhu: `Trang thai nay can dung nut Merge main`.
7. Merge release/main van nam tren card hoac drawer nhu quick action rieng.

## Backend flow de xuat

- Them metadata cho branch workflow status: `allowKanbanDrop`, `dropBlockReason`, optional `requiresConfirmation`.
- Them API rieng: `POST /api/branches/:id/move-status`.
- API nay chi update status thu cong khi target status cho phep drop.
- API nay khong thay the `mark-merged-release` va `mark-merged-main`.
- Moi lan move status phai tao timeline event.

## Review gate

Sau phase nay dung lai de review UI/flow truoc khi quay lai GitLab automation.
