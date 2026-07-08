# Phase 12 Plan - Branch Flow Rules And Release Cycles

Phase nay chuan hoa lai Git flow theo rule thuc te dang dung, truoc khi di tiep automation.
Chua implement code neu chua co review/approval.

## Rule moi can chot

- Moi task branch duoc tao tu app mac dinh checkout tu `main`.
- `main` la trust source khi tao `feature` va `hotfix`.
- `feature` dung ten mac dinh `feature/<jira-code>`.
- `hotfix` dung ten mac dinh `hotfix/<jira-code>-<ngay>`.
- `feature` co ke hoach di qua `develop`, active `release/...`, roi `main`.
- `hotfix` co ke hoach di qua active `release/...`, roi `main`.
- Task chi done khi release branch chua task do da duoc record merge vao `main`.
- Moi sprint/release cycle co mot active release branch, vi du `release/08072026`.
- Cac rule tren phai co man hinh cau hinh de sau nay doi pattern/target/source neu workflow thay doi.

## Conflict voi plan/cu trien khai hien tai

- Hien tai spec/cu code tung cho tao branch tu bat ky source branch. Rule moi se doi mac dinh thanh chi tao task branch tu `main`.
- Hien tai co y tuong branch `B` tao tu branch `A` va carry task. Rule moi se tat mac dinh luong nay; neu can thi dua vao advanced override sau.
- Hien tai branch co the mark merge main truc tiep. Rule moi nen uu tien main merge tren release branch, sau do release keo theo cac task branch da nam trong release do.
- Hien tai `Du dinh merge vao` da la multi target. Rule moi van giu multi target, nhung target se duoc sinh tu rule theo branch type thay vi nhap tu do trong flow thuong ngay.

## Cau hinh de xuat

Them khu vuc cau hinh trong repository/workflow settings:

- `trustSourceBranch`: default `main`.
- `productionBranch`: default `main`.
- `developBranch`: default `develop`.
- `releaseBranchPattern`: default `release/DDMMYYYY`.
- `releaseCycleMode`: `MANUAL_ACTIVE_RELEASE` truoc, sau nay co the them 1/2 week auto suggestion.
- `featureNamePattern`: default `feature/{jiraCode}`.
- `hotfixNamePattern`: default `hotfix/{jiraCode}-{date}`.
- `featurePlannedTargets`: default `develop`, active release, `main`.
- `hotfixPlannedTargets`: default active release, `main`.
- `allowCheckoutSourceOverride`: default `false`.
- `allowDirectTaskBranchMainMerge`: default `false`.

## Data model de xuat

Co the lam gon bang 2 huong:

- Phase dau: luu rule config dang JSON tren repository config de it migration.
- Neu can mo rong: tach bang `branch_flow_rules` va `release_cycles`.

Khuyen nghi phase nay:

- Them field/config cho repository workflow rules neu schema hien co du suc.
- Them entity/field cho active release cycle:
  - release branch name
  - start date/end date optional
  - status active/closed
  - repository id/project id
- Branch task co lien ket toi active release branch/cycle khi mark merged release.

## Backend flow de xuat

1. Tao branch:
   - Lay rule theo repo + branch type.
   - Source mac dinh `main`, UI khong can cho sua neu override dang tat.
   - Validate ten branch theo pattern.
   - Sinh intended targets theo type.
   - Gan active release branch vao ke hoach neu co.

2. Merge develop:
   - Dung cho `feature`.
   - Cap nhat status `MERGED_DEVELOP`.
   - Ghi timeline, khong doi task done.

3. Merge release:
   - `feature` va `hotfix` merge vao active release branch.
   - Cap nhat status `MERGED_RELEASE`.
   - Luu actual merged into = active release branch.
   - Gan branch vao release cycle/branch do.
   - Task sang nhom in release, chua done.

4. Merge main:
   - Nen thuc hien tren release branch.
   - Khi release branch merge vao `main`, app tim tat ca task branch da nam trong release branch/cycle do.
   - Cap nhat cac branch con thanh da vao `main` ve mat tracking.
   - Mark task `DONE` neu tat ca required branch cua task da duoc release do keo vao main.
   - Ghi timeline cho release merge main, branch child propagated main, va task done.

## UI flow de xuat

- Drawer tao branch:
  - Chon repo, task, branch type `feature`/`hotfix`.
  - Hien source readonly `main` neu override dang tat.
  - Hien active release branch dang ap dung.
  - Ten branch auto theo pattern, van co nut override neu rule cho phep.
  - `Du dinh merge vao` la multi tag sinh san: `develop`, `release/...`, `main` voi feature; `release/...`, `main` voi hotfix.

- `/branches` Kanban:
  - Cot van giu 4 status: `Dang code`, `Vao develop`, `Vao release`, `Vao main`.
  - Cot `Vao release` co filter/chip active release branch.
  - Card branch hien ro:
    - `Tao tu: main`
    - `Ke hoach: develop -> release/08072026 -> main`
    - `Thuc te: develop done / release/08072026 / chua vao main`
  - Action `Merge release` yeu cau chon/confirm active release branch.
  - Action `Merge main` tren release branch co the propagate task done.

- Settings:
  - Them tab `Git flow rules`.
  - Them khu vuc `Release cycles` de tao/chon active release branch.

## Test can co

- Tao feature branch tu app bat buoc source `main`, ten `feature/<jira-code>`, intended targets dung rule.
- Tao hotfix branch tu app bat buoc source `main`, ten `hotfix/<jira-code>-<ngay>`, intended targets dung rule.
- Neu nhap source khac `main` khi override tat thi backend reject.
- Merge feature vao develop khong done task.
- Merge feature/hotfix vao active release khong done task.
- Merge release branch vao `main` propagate cac branch con trong release do va done task hop le.
- Doi active release branch thi branch moi di vao release moi, branch cu van giu release da gan.
- Settings doi pattern/target/source thi branch moi sinh theo rule moi, branch cu khong bi sua ke hoach goc.

## Review gate

Sau khi plan nay duoc review, moi bat dau implement phase 12. Het phase 12 dung lai de user test flow branch rule/release cycle truoc khi quay lai GitLab webhook automation.
