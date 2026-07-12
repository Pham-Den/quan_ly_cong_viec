# System Manager UI Proposal: Graph + Side Panel + Search

Tài liệu này bổ sung cho `plan.md`, tập trung vào MVP đầu tiên của module System Manager.

Mục tiêu của MVP không phải là làm một màn CRUD quản lý hạ tầng thật đầy đủ ngay từ đầu. Mục tiêu là tạo một màn hình giúp dev mở ra là thấy được:

- App nào đang chạy ở môi trường nào.
- Service nào phụ thuộc service nào.
- Config key nào tạo ra mối liên kết đó.
- Host/container/IP/port nằm ở đâu.
- Khi cần debug thì tìm nhanh được service, host, container hoặc config.

## Quyết định UI

Chọn **cả 4 UI mẫu**, nhưng hiểu đúng là:

- Không phải 4 màn hình tách rời.
- Không phải chọn 1 trong 4.
- Đây là 4 trạng thái/chức năng của cùng một màn hình chính.

Màn hình chính nên là:

```text
Graph + Toolbar + Search + Side Panel
```

4 UI mẫu tương ứng với 4 việc người dùng sẽ làm thường xuyên:

1. Nhìn tổng thể topology.
2. Click node để xem chi tiết.
3. Search để tìm/debug nhanh.
4. Highlight dependency để hiểu phạm vi ảnh hưởng.

Nếu chỉ chọn 1 UI thì module sẽ bị lệch:

- Chỉ có graph: nhìn đẹp nhưng thiếu thông tin debug.
- Chỉ có side panel: chi tiết tốt nhưng mất cái nhìn tổng.
- Chỉ có search: tìm nhanh nhưng không thấy quan hệ.
- Chỉ có highlight: hữu ích khi phân tích, nhưng cần graph và search làm nền.

Vì vậy MVP nên làm cả 4, nhưng triển khai theo mức vừa đủ.

## Phạm Vi MVP

MVP tập trung vào 3 trục chính:

```text
Graph        -> nhìn tổng quan hệ thống
Side Panel   -> xem chi tiết service/node
Search       -> tìm nhanh khi debug
```

Các chức năng chưa cần làm sâu ở phase đầu:

- SSH.
- Docker exec.
- Docker logs realtime.
- Docker inspect realtime.
- Health check tự động.
- Incident timeline đầy đủ.
- Scanner tự parse source code.

Những phần trên nên để phase sau, sau khi topology thủ công/bán thủ công đã dùng ổn.

## Môi Trường

Do người dùng sẽ triển khai trước ở DEV và STAGING, còn PRODUCTION không trực tiếp quản lý nhưng vẫn cần theo dõi, UI nên thể hiện rõ mode theo môi trường:

```text
DEV       managed
STAGING   managed
PROD      observed / read-only / reference
```

Ý nghĩa:

- DEV/STAGING: có thể khai báo, chỉnh sửa, cập nhật topology.
- PRODUCTION: ưu tiên xem, đối chiếu, ghi chú, theo dõi; không cần thao tác vận hành sâu.

## UI 1: Màn Hình Chính

Màn hình chính là nơi graph làm trung tâm.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ System Manager                                                              │
│ [DEV ▼] [App: Proposal ▼] [Host: All ▼] [Type: All ▼]    Search service...  │
├──────────────────────────────────────────────────────────────────────┬───────┤
│                                                                      │Detail │
│                         DEPENDENCY GRAPH                             │       │
│                                                                      │ Redis │
│        ┌────────────────┐                                            │───────│
│        │ Proposal Web   │                                            │ Env   │
│        │ Laravel App    │──── REDIS_HOST ────┐                       │ DEV   │
│        └────────────────┘                    │                       │       │
│              │                               ▼                       │ Host  │
│              │ DB_HOST                ┌────────────┐                 │ host-2│
│              ▼                        │ Redis      │                 │       │
│        ┌────────────┐                 │ cache      │                 │ Port  │
│        │ MariaDB    │                 └────────────┘                 │ 6379  │
│        │ database   │                       │                        │       │
│        └────────────┘                       │ queue/cache            │ Used  │
│                                             ▼                        │ by 3  │
│                                      ┌────────────┐                  │ apps  │
│                                      │ Queue      │                  │       │
│                                      │ Worker     │                  │       │
│                                      └────────────┘                  │       │
│                                                                      │       │
└──────────────────────────────────────────────────────────────────────┴───────┘
```

Toolbar cần có:

- Environment filter: DEV, STAGING, PRODUCTION.
- Application filter: Proposal, CRM, SAP Sync...
- Host filter.
- Service type filter: App, DB, Cache, Broker, External API...
- Search input.

Graph cần hiển thị:

- Node là app/service/container/shared service.
- Edge là dependency.
- Edge label là config key hoặc connection reason.

Ví dụ:

```text
Proposal Web ── REDIS_HOST ──> Redis
Proposal Web ── DB_HOST ─────> MariaDB
Proposal Web ── SAP_URL ─────> SAP API
Queue Worker ── KAFKA_HOST ──> Kafka
```

## UI 2: Node Detail Side Panel

Khi click một node, side panel bên phải mở ra.

Ví dụ click Redis:

```text
┌───────────────────────────────┐
│ Redis                         │
│ cache / shared service        │
│ Status: Healthy               │
├───────────────────────────────┤
│ Environment                   │
│ DEV                           │
│                               │
│ Host                          │
│ docker-host-02                │
│ 192.168.1.25                  │
│                               │
│ Container                     │
│ redis-dev                     │
│ redis:7-alpine                │
│                               │
│ Ports                         │
│ 6379                          │
├───────────────────────────────┤
│ Configs Using This Service    │
│ REDIS_HOST    copy            │
│ REDIS_PORT    copy            │
│ REDIS_DB      copy            │
│ REDIS_PASS    ********        │
├───────────────────────────────┤
│ Upstream                      │
│ Proposal Web                  │
│ Proposal Queue                │
│ Notification Worker           │
│                               │
│ Downstream                    │
│ none                          │
├───────────────────────────────┤
│ Notes                         │
│ Shared Redis for dev apps.    │
└───────────────────────────────┘
```

Side panel nên chia tab nhẹ:

```text
[Overview] [Configs] [Dependencies] [Notes]
```

Thông tin cần có trong MVP:

- Basic information.
- Environment.
- Host/IP.
- Container name.
- Image.
- Port.
- Config keys.
- Upstream/downstream dependencies.
- Notes.

Không lưu secret thật. Password/token chỉ nên hiển thị dạng masked hoặc chỉ lưu tên key.

## UI 3: Search

Search phải phục vụ debug, không chỉ tìm tên service.

Ví dụ search `redis`:

```text
Search: redis
┌──────────────────────────────────────────────┐
│ Services                                     │
│ Redis DEV          docker-host-02 :6379       │
│ Redis STAGING      staging-host-01 :6379      │
│                                              │
│ Config Keys                                  │
│ REDIS_HOST         Proposal Web / DEV         │
│ REDIS_PORT         Proposal Worker / DEV      │
│                                              │
│ Dependencies                                 │
│ Proposal Web   → Redis DEV                   │
│ Queue Worker   → Redis DEV                   │
└──────────────────────────────────────────────┘
```

Search nên tìm được theo:

- Service name.
- Application name.
- Host name.
- IP.
- Container name.
- Config key.
- Port.
- Environment.
- Dependency edge.

Khi chọn một kết quả search, UI cần làm 3 việc:

```text
1. Center graph vào node/dependency đó.
2. Highlight node và các dependency liên quan.
3. Mở side panel tương ứng.
```

Đây là luồng debug quan trọng nhất. Ví dụ chỉ nhớ `REDIS_HOST`, search là thấy ngay app nào đang dùng Redis nào.

## UI 4: Dependency Highlight

Khi click một app hoặc service, graph nên highlight upstream/downstream.

Ví dụ click `Proposal Web`:

```text
                 ┌──────────────┐
                 │ Proposal Web │
                 └──────┬───────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
       ▼                ▼                ▼
┌────────────┐   ┌────────────┐   ┌────────────┐
│ MariaDB    │   │ Redis      │   │ Kafka      │
└────────────┘   └────────────┘   └─────┬──────┘
                                        │
                                        ▼
                                  ┌────────────┐
                                  │ SAP Sync   │
                                  └────────────┘
```

Các node không liên quan nên bị làm mờ. Các edge liên quan nên nổi bật hơn.

Nên có 3 chế độ highlight:

- Direct only: chỉ dependency trực tiếp.
- Downstream: những service/app bị node hiện tại phụ thuộc hoặc gọi tới.
- Upstream: những app/service đang phụ thuộc node hiện tại.

Với phân tích sự cố, upstream rất quan trọng.

Ví dụ Redis lỗi:

```text
Redis DEV
  ↑
  ├── Proposal Web
  ├── Proposal Queue
  └── Notification Worker
```

Nhìn vào là biết các app nào bị ảnh hưởng.

## Data Gợi Ý Cho MVP

Nên tách service logic và instance theo môi trường.

```text
Application
  Proposal

Service Definition
  Redis
  MariaDB
  Kafka
  SAP API

Service Instance
  Redis DEV
  Redis STAGING
  Redis PROD

Dependency
  Proposal Web DEV -- REDIS_HOST --> Redis DEV
  Proposal Web STAGING -- REDIS_HOST --> Redis STAGING
```

Lý do: cùng một service logic có nhiều instance theo môi trường. Nếu không tách, graph DEV/STAGING/PROD dễ bị trộn.

Dependency nên có thêm metadata:

```text
fromServiceInstance
toServiceInstance
environment
type
configKey
protocol
port
criticality
description
```

Ví dụ:

```text
Proposal Web DEV
  -> Redis DEV
  type: cache
  configKey: REDIS_HOST
  port: 6379
  criticality: high
```

## Thứ Tự Triển Khai Đề Xuất

Triển khai MVP theo thứ tự:

1. Data model tối thiểu cho environment, host, application, service instance, config, dependency.
2. API lấy topology theo filter.
3. Màn System Manager với toolbar và graph.
4. Side panel khi click node.
5. Search service/config/host/container.
6. Highlight upstream/downstream.

Không nên làm scanner trước. Scanner nên là phase sau khi đã biết dữ liệu nào thật sự cần cho graph và debug.

## Tiêu Chí Hoàn Thành MVP

MVP được xem là có ích nếu làm được các tình huống sau:

- Chọn DEV và thấy topology của DEV.
- Chọn STAGING và thấy topology khác DEV.
- Search `REDIS_HOST` và thấy app nào dùng Redis.
- Click Redis và thấy host/container/port/config liên quan.
- Click Proposal Web và thấy các service mà app này phụ thuộc.
- Click Redis và xem được các app đang phụ thuộc Redis.
- Mở PRODUCTION ở chế độ theo dõi/read-only.

## Kết Luận

Nên chọn **cả 4 UI mẫu** vì chúng bổ sung cho nhau trong cùng một trải nghiệm:

```text
Graph       -> nhìn tổng thể
Side Panel  -> hiểu chi tiết
Search      -> tìm nhanh
Highlight   -> phân tích ảnh hưởng
```

Đây là hướng phù hợp nhất với mục tiêu của một dev cần cái nhìn tổng, trực quan và hữu ích cho công việc hằng ngày.
