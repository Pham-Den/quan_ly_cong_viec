Theo mình thì đừng xem đây là bài toán documentation, mà hãy xem nó là System Topology + Dependency Management.

Những gì bạn mô tả gần giống với:

Kubernetes Dashboard
n8n workflow
Grafana Service Map
Jaeger Dependency Graph
Backstage Software Catalog

Nhưng các tool trên đều khá nặng hoặc không đúng nhu cầu của bạn.

Mình sẽ làm luôn trong VueJS.

Ý tưởng

Mỗi app sẽ có một module mới

Infrastructure

├── Hosts
├── Docker Containers
├── Services
├── Databases
├── External APIs
├── Environment
├── Dependency Graph
├── Incidents

Toàn bộ dữ liệu chỉ cần lưu database.

Ví dụ

Host A (192.168.1.20)

    nginx
      |
      |
Laravel App A
      |
      +------ Redis
      |
      +------ MariaDB
      |
      +------ SAP API
      |
      +------ Kafka
      |
      +------ OCR
      |
      +------ Mail

Host khác

Host B

Laravel App B

      |
      +------ Redis
      |
      +------ Kafka
      |
      +------ RabbitMQ

Sau đó nối chúng lại.

Cuối cùng thành một graph.

Giống n8n.

Database

Có thể đơn giản.

hosts
id
name

ip

environment
description
services
id

name

type

host_id

docker_container

port

status

description

type

Laravel

MySQL

Redis

Kafka

SAP

RabbitMQ

Elastic

API

Nginx

OnlyOffice

S3

...
configs
id

service_id

key

value


Ví dụ

APP_URL

REDIS_HOST

REDIS_PORT

SAP_URL

SAP_USER

SAP_DB


Có thể hide password.

********
dependency

Quan trọng nhất.

from_service

to_service

type

Ví dụ

Laravel
    |

Redis

Laravel
    |

Kafka

Laravel
    |

SAP

Kafka

    |

Consumer

Vue Graph

Đây là phần đáng tiền.

Không dùng tree.

Dùng graph.

Có thể dùng

Vue Flow

hoặc

React Flow

(Vue có port)

hoặc

Cytoscape


hoặc

AntV G6

Theo mình

Vue Flow là đẹp nhất.

Bạn sẽ có

┌───────────┐
│ Laravel A │
└───────────┘
      │
      │
      ▼
┌─────────┐
│ Redis   │
└─────────┘

Có thể kéo thả.

Zoom.

Mini map.

Giống n8n.

Click node

Ví dụ click Redis.

Hiện panel bên phải.

Redis

Host

192.168.1.25

Docker

redis-prod

Port

6379

ENV

REDIS_HOST

REDIS_PASSWORD


Có nút

Copy config

SSH

Logs

Docker inspect

Health

Quan hệ

Đây mới hay.

Ví dụ click Laravel.

Nó highlight.

Laravel

↓

Redis

↓

Kafka

↓

SAP

↓

OnlyOffice

↓

OCR

↓

Mail


Nhìn phát hiểu.

Theo Host

Có mode

By Host
Host A

## Phase 3 đã chốt để triển khai tiếp

Phase 3 sẽ tập trung vào nhập tay và chỉnh sửa topology ngay trong UI, dùng dữ liệu thật từ database/API đã có ở Phase 2.

Phạm vi Phase 3:

- Thêm/sửa/xóa environment để sau này có thể có Local, Dev, Staging, Production hoặc custom environment.
- Thêm/sửa/xóa host theo environment.
- Thêm/sửa/xóa node topology theo environment, gồm app/component/service, runtime, tags, ports, notes và config groups.
- Thêm/sửa/xóa dependency edge giữa các node, trong đó config key/value là metadata của edge.
- Sau khi lưu, graph/search/side panel/flow dùng lại dữ liệu mới từ backend.
- Giữ service registry tập trung: Redis/MariaDB/Kafka là node dùng chung, dependency chỉ link tới service node đã khai báo.

Không làm trong Phase 3:

- JSON/YAML import.
- Scanner từ `.env`, docker-compose hoặc source code.
- Health check thật.
- Incidents.
- SSH, logs, Docker inspect/exec.
- Phân quyền production nâng cao.

UI Phase 3 sẽ là drawer quản lý dữ liệu ngay trong màn System Manager, desktop-first, để dev vừa xem graph vừa khai báo/chỉnh topology.

## Correction quan trọng sau Phase 3

Mô hình đúng không phải là mỗi environment tạo một bộ node riêng.

Mô hình đúng:

- Node/app/component/service là khai báo toàn cục.
- Flow/dependency giữa các node là toàn cục.
- Khi tạo `B2P Web/API -> Redis`, flow này tồn tại cho mọi environment.
- Environment chỉ quyết định runtime/config/binding cụ thể:
  - Local dùng node global `Redis`, host/IP/port local, config value local.
  - Dev dùng node global `Redis`, host/IP/port dev, config value dev.
  - Staging dùng node global `Redis`, host/IP/port staging, config value staging.
  - Production dùng node global `Redis`, host/IP/port production, config value production.

Ví dụ đúng:

```text
Global flow:
B2P Web/API ── REDIS_HOST ──▶ Redis

Local binding:
B2P Web/API(Local) ── REDIS_HOST=redis-local.company.local ──▶ Redis(Local)

Dev binding:
B2P Web/API(Dev) ── REDIS_HOST=redis-dev.company.local ──▶ Redis(Dev)
```

Vì vậy Phase 4 phải là phase chỉnh model:

- Tách topology blueprint khỏi environment.
- Tách node global khỏi node runtime theo environment.
- Tách dependency global khỏi dependency config value theo environment.
- UI tạo node/dependency một lần, sau đó cấu hình runtime/config cho từng environment.
- Tên node trên graph luôn là tên global, ví dụ `Redis`, không phải `Redis Local` hay `Redis Dev`.
- Edge config dùng cú pháp `.env` style, ví dụ `REDIS_HOST=redis-dev.company.local`; secret dùng prefix `secret:`.
- Graph vẫn filter theo environment, nhưng cấu trúc flow giữ nguyên; chỉ runtime/config/status/binding đổi theo environment.

Điều này đúng hơn với mục tiêu dev: nhìn một flow hệ thống thống nhất, rồi đổi environment để xem cấu hình tương ứng.

Laravel

Redis

MySQL

Host B

Kafka

SAP

Host C

OCR

OnlyOffice


Sau đó nối.

Theo Environment

Dropdown

DEV

UAT

STAGING

PRODUCTION

Mỗi env một topology.

Theo App

App A

Laravel

↓

Redis

↓

SAP

↓

Kafka

App B

Laravel

↓

Redis

↓

RabbitMQ

↓

Elastic
Khi có sự cố

Ví dụ

Redis die.

Node đổi đỏ.

Laravel

↓

Redis 🔴

↓

Kafka

↓

SAP

Ngay lập tức biết app nào bị ảnh hưởng.

Config Viewer

Ví dụ

Laravel.

APP_NAME

APP_URL

DB_HOST

REDIS_HOST

KAFKA_HOST

SAP_HOST


Click copy.

Docker

Có thể thêm

docker compose

container name

image

restart

healthcheck

volume

network

SSH

Host

192.168.1.25

ubuntu

22

Container

docker exec

docker logs

docker stats

Incident

Ví dụ

Kafka down

2025-07-12

Impact

App A

App C

SAP Sync


Sau này tìm lại rất nhanh.

Auto Import

Đây là phần mình thích nhất.

Thay vì nhập tay.

Mỗi app có

infra.json

Ví dụ

{
  "app":"proposal",

  "host":"docker-host-2",

  "services":[

      {
         "name":"redis",
         "host":"redis-master",
         "port":6379
      },

      {
         "name":"sap",
         "url":"http://sap.company"
      }

  ]
}

Hoặc parse

docker-compose.yml

.env

supervisor

nginx


=> Auto tạo graph.

Không cần nhập.

Hay hơn nữa (phù hợp với công việc của bạn)

Do bạn chủ yếu làm Laravel chạy trên Docker và thường kết nối tới nhiều dịch vụ nội bộ (SAP, Kafka, Redis, MariaDB, OnlyOffice...), mình sẽ coi mã nguồn là nguồn sự thật (source of truth) thay vì dữ liệu nhập tay.

Xây một Infrastructure Scanner chạy định kỳ:

Clone hoặc đọc source của từng app.
Parse:
.env.example, .env.*
docker-compose.yml
docker-compose.override.yml
Dockerfile
supervisor/*.conf
config/database.php
config/queue.php
config/cache.php
config/filesystems.php
config/services.php
các client SAP/Kafka/Redis tự viết.
Sinh ra một file chuẩn (ví dụ topology.json).
Vue chỉ việc đọc topology.json và render graph.

Khi đổi REDIS_HOST, thêm Kafka hay chuyển Redis sang host khác, graph sẽ tự cập nhật sau mỗi lần scan, gần như không cần chỉnh tay.

Kiến trúc mình sẽ chọn
                 Infrastructure Scanner
              (Laravel Console Command)
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   Parse Docker                  Parse Laravel Config
        │                                 │
        └──────────────┬──────────────────┘
                       │
              topology.json / Database
                       │
                 REST API (/infra)
                       │
                  Vue + Vue Flow
                       │
      ┌────────────────┼─────────────────┐
      │                │                 │
  Dependency      Host View        Environment View
      │                │                 │
      └────────────────┴─────────────────┘
                   Incident Impact

Mô hình này vừa là tài liệu kiến trúc luôn, vừa là công cụ điều tra sự cố. Khi một service hoặc host gặp vấn đề, bạn chỉ cần mở graph là thấy ngay các ứng dụng và container nào phụ thuộc vào nó, thay vì phải nhớ thủ công hàng chục file .env, docker-compose và địa chỉ IP. Đây là hướng tiếp cận có khả năng mở rộng tốt khi số lượng ứng dụng và dịch vụ trong công ty tiếp tục tăng.

rồi, tóm tắt lại thành 1 mô tả, cho agent có thể từ đó mà plan thực hiện

Bạn có thể đưa cho Agent mô tả sau:

Infrastructure Topology & Dependency Management Module
Mục tiêu

Xây dựng một module trong ứng dụng VueJS hiện có để quản lý toàn bộ hạ tầng của nhiều ứng dụng đang chạy trên các Docker Host khác nhau.

Module này không chỉ là nơi lưu tài liệu, mà là một System Topology Dashboard, cho phép trực quan hóa toàn bộ hệ thống, các service, cấu hình kết nối và mối quan hệ phụ thuộc giữa chúng dưới dạng graph tương tự n8n.

Mục tiêu cuối cùng là khi xảy ra sự cố hoặc cần phân tích hệ thống, chỉ cần mở module này là có thể hiểu ngay kiến trúc hiện tại mà không phải tìm kiếm trong nhiều repository, docker-compose hoặc file .env.

Phạm vi

Hệ thống cần quản lý:

Docker Hosts
Applications
Docker Containers
Internal Services
External Services
Databases
Message Brokers
APIs
Shared Services
Environment Configurations
Service Dependencies

Ví dụ các service:

Laravel App
Nginx
Redis
MariaDB
Kafka
RabbitMQ
SAP
OCR
OnlyOffice
MinIO / S3
ElasticSearch
Mail Service
Scheduler
Queue Worker
Core Features
1. Service Registry

Cho phép khai báo tất cả service trong công ty.

Thông tin mỗi service:

Name
Type
Description
Host
Container Name
Docker Image
Port
Environment
Status
Tags
2. Configuration Management

Mỗi service có thể khai báo các cấu hình cần thiết.

Ví dụ:

APP_URL
DB_HOST
DB_DATABASE
REDIS_HOST
REDIS_PORT
KAFKA_BOOTSTRAP_SERVERS
SAP_URL
OCR_URL

Các trường nhạy cảm như password/token chỉ hiển thị dạng masked.

3. Dependency Graph

Đây là chức năng quan trọng nhất.

Cho phép khai báo quan hệ:

App A
    ↓
Redis

App A
    ↓
Kafka

Kafka
    ↓
Consumer

Consumer
    ↓
SAP

Graph cần hỗ trợ:

Zoom
Pan
Drag node
Auto layout
Highlight dependency
Highlight upstream/downstream
Mini map

UI tương tự n8n hoặc ReactFlow.

Khuyến nghị sử dụng Vue Flow.

4. Host View

Hiển thị topology theo Docker Host.

Ví dụ:

Host A

 ├── nginx
 ├── laravel
 ├── redis
 └── mysql

Host B

 ├── kafka
 ├── consumer
 └── onlyoffice

Các node giữa host vẫn được nối dependency.

5. Application View

Có thể filter theo application.

Ví dụ:

Proposal

↓

Redis

↓

Kafka

↓

SAP

↓

OCR

Chỉ hiển thị dependency của ứng dụng đang chọn.

6. Environment View

Cho phép chuyển nhanh giữa:

Development
UAT
Staging
Production

Mỗi môi trường có topology riêng.

7. Service Detail

Khi click vào node sẽ mở side panel.

Hiển thị:

Basic Information
Host
Container
Docker Image
Port
Configurations
Dependencies
Connected Applications
Notes
8. Search

Có thể tìm theo:

Service
Host
IP
Container
Config Key
Environment
9. Incident Analysis

Khi một service gặp sự cố:

Ví dụ Redis down.

Node chuyển màu đỏ.

Highlight toàn bộ service bị ảnh hưởng.

Ví dụ:

Redis

↓

Proposal

↓

Queue

↓

Scheduler

Cho phép nhanh chóng đánh giá phạm vi ảnh hưởng.

Database Design

Dự kiến gồm các entity:

hosts
applications
services
service_configs
service_dependencies
environments
incidents
tags
API

REST API:

GET /hosts

GET /applications

GET /services

GET /topology

GET /dependency

GET /service/{id}

POST /service

POST /dependency
UI

Trang chính gồm:

----------------------------------------------------
Toolbar
----------------------------------------------------

Host Filter
Environment Filter
Application Filter
Search

----------------------------------------------------

            Graph (Vue Flow)

----------------------------------------------------

Side Panel

Graph là trung tâm của module.

Future Automation (Phase 2)

Giảm tối đa việc nhập tay bằng cách tự động sinh topology từ source code.

Tạo một Infrastructure Scanner có khả năng parse:

docker-compose.yml
Dockerfile
.env.example
.env.*
Laravel config/*
supervisor/*.conf
nginx.conf

Scanner sinh ra dữ liệu topology (JSON hoặc DB), sau đó đồng bộ vào module.

Nhờ đó khi thay đổi Docker, thêm service hoặc đổi endpoint, sơ đồ sẽ được cập nhật tự động thay vì phải chỉnh sửa thủ công.

Mục tiêu cuối cùng

Module này sẽ trở thành nguồn sự thật (Single Source of Truth) cho toàn bộ hạ tầng, giúp:

Trực quan hóa kiến trúc hệ thống.
Quản lý tập trung service và cấu hình.
Theo dõi quan hệ phụ thuộc giữa các thành phần.
Phân tích nhanh phạm vi ảnh hưởng khi xảy ra sự cố.
Hỗ trợ onboarding thành viên mới.
Là nền tảng để tự động đồng bộ topology từ mã nguồn và cấu hình Docker trong tương lai.

---

## Quyết định đã chốt sau bàn luận

Phần này bổ sung các quyết định đã được chốt sau khi trao đổi thêm về MVP.

### Phạm vi sử dụng

Module System Manager là module toàn cục cho công ty, nhưng phạm vi thực tế ban đầu chỉ áp dụng cho những ứng dụng mà người dùng đang trực tiếp làm việc.

Người dùng có thể khai báo thêm app/service/host về sau.

### Hướng MVP

Phase đầu chỉ làm UI với dữ liệu mẫu để xem và chỉnh trải nghiệm.

Chưa triển khai backend API thật, chưa làm database thật, chưa làm scanner.

Phase đầu ưu tiên:

- Graph.
- Side panel.
- Search.
- Highlight dependency.
- Dữ liệu mock trên frontend.

### Môi trường

Các môi trường mặc định:

- Local.
- Dev.
- Staging.
- Production.

Cho phép khai báo thêm môi trường khác.

Khi chọn một môi trường, toàn bộ graph phải lấy đúng topology của môi trường đó.

Ví dụ chọn Dev thì chỉ thấy service instance, host, dependency của Dev.

Production vẫn được phép hiển thị thông tin để theo dõi, vì người dùng không trực tiếp quản lý production nhưng cần có cái nhìn tổng quan.

### Cấp độ node

Graph nên hỗ trợ kiểu kết hợp:

- Mặc định hiển thị app ở mức tổng quan.
- Có thể expand app để xem các runtime component bên trong.

Ví dụ:

```text
B2P
  ├── B2P Web/API
  ├── B2P Queue Worker
  ├── B2P Scheduler
  └── B2P Consumer
```

Các thành phần runtime gợi ý:

- Web/API.
- Queue Worker.
- Scheduler/Cron.
- Kafka Consumer.
- RabbitMQ Consumer.
- Frontend nếu tách riêng.
- Nginx nếu cần quản lý rõ reverse proxy.

Chi tiết container/IP/port/image nằm trong side panel, không bắt buộc luôn là node chính.

Khi app đang collapsed, graph vẫn phải hiển thị dependency tổng hợp từ app tới các service liên quan.

Ví dụ collapsed:

```text
B2P -- DB_HOST --> MariaDB Dev
B2P -- REDIS_HOST +3 --> Redis Dev
B2P -- SAP_URL --> SAP API Dev
```

Khi expand app, graph hiển thị dependency chi tiết theo từng runtime component.

Ví dụ expanded:

```text
B2P Web/API -- DB_HOST --> MariaDB Dev
B2P Web/API -- REDIS_HOST +3 --> Redis Dev
B2P Queue Worker -- KAFKA_BROKER / publish --> Kafka Dev
B2P Consumer -- KAFKA_BROKER / consume --> Kafka Dev
B2P Scheduler -- OCR_URL --> OCR Dev
```

Mục tiêu là collapsed vẫn giúp nhìn nhanh app phụ thuộc service nào, còn expanded giúp debug chính xác dependency đó thuộc component nào.

### Host group

Host nên hiển thị như group/swimlane trong graph.

Tùy chọn bật/tắt hoặc chọn layout host group sẽ đưa vào settings.

Khi bật host group, các node service/app được gom theo host của môi trường đang chọn.

Ví dụ:

```text
Environment: Dev

Host: dev-app-01
  - Proposal Web
  - Proposal Worker

Host: dev-service-01
  - Redis Dev
  - MariaDB Dev
  - Kafka Dev
```

### Service registry tập trung

Service phải được khai báo tập trung trong module, không để mỗi app tự khai báo service trùng lặp.

Ví dụ Redis Dev là một service instance chung:

```text
Redis Dev
  type: Redis
  environment: Dev
  host: dev-service-01
  port: 6379
```

Khi App A hoặc App B dùng Redis Dev thì dependency sẽ link tới cùng một service instance này.

Không tạo kiểu:

```text
App A -> Redis C riêng của App A
App B -> Redis C riêng của App B
```

Mà phải là:

```text
App A -> Redis Dev
App B -> Redis Dev
```

Như vậy graph thể hiện đúng service dùng chung và tránh tình trạng mỗi app mạnh ai nấy khai báo.

### Dependency và flow dữ liệu

Dependency là quan hệ giữa các service instance/component đã được khai báo.

Graph hiển thị quan hệ theo dạng node nối node. Config key không phải là node riêng, mà là label/thông tin nằm trên edge.

Ví dụ đúng:

```text
B2P Web/API -- DB_HOST --> MariaDB Dev
```

Hiểu trực quan là:

```text
B2P Web/API ───── DB_HOST ─────▶ MariaDB Dev
```

Khi bấm vào edge hoặc label `DB_HOST`, UI phải hiển thị chi tiết config của quan hệ đó.

Ví dụ thông tin edge/config detail:

```text
From: B2P Web/API
To: MariaDB Dev
Config key: DB_HOST
Config value: mariadb-dev.local
Connection type: database
Port: 3306
Direction: outbound
```

Ví dụ:

```text
B2P Web/API -- REDIS_HOST --> Redis Dev
B2P Web/API -- DB_HOST --> MariaDB Dev
B2P Queue Worker -- KAFKA_BROKER --> Kafka Dev
B2P Scheduler -- SAP_URL --> SAP API Dev
```

Config key nên được lưu trong dữ liệu dependency/config của component, nhưng graph vẫn hiển thị config key trên edge để người dùng nhìn là hiểu quan hệ được tạo bởi cấu hình nào.

Nếu nhiều config key của cùng một component cùng trỏ tới một service, graph không nên vẽ nhiều edge song song gây rối.

Nên dùng một edge chung, click vào edge để xem toàn bộ config keys liên quan.

Ví dụ:

```text
B2P Web/API ───── Redis configs ─────▶ Redis Dev
```

Click edge sẽ thấy:

```text
REDIS_HOST=redis-dev.local
REDIS_PORT=6379
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

Graph label có thể hiển thị:

```text
REDIS_HOST +3
```

### Hướng dependency

Dependency cần phân biệt hướng quan hệ để graph thể hiện đúng luồng phụ thuộc.

Ví dụ:

```text
B2P Queue Worker -- KAFKA_BROKER / publish --> Kafka Dev
B2P Consumer -- KAFKA_BROKER / consume --> Kafka Dev
```

Vẫn có thể hiểu là component phụ thuộc vào Kafka, nhưng edge cần lưu metadata về hướng/role:

```text
publish
consume
request
response
read
write
proxy
```

Phase đầu chỉ cần hiển thị direction đơn giản trên edge hoặc trong side panel.

Nhờ dependency tập trung, module phải hỗ trợ xem đường đi của flow dữ liệu.

Khi bắt đầu từ một app hoặc một runtime component, người dùng phải biết flow đi qua bao nhiêu service.

Ví dụ:

```text
Start: B2P

B2P Web/API
  -> Redis Dev
  -> MariaDB Dev
  -> Kafka Dev
      -> B2P Consumer
          -> SAP API Dev
```

Tính năng cần có:

- Start from app/component.
- Traverse downstream dependencies.
- Highlight toàn bộ đường đi liên quan.
- Hiển thị danh sách service đi qua.
- Cho biết mỗi bước đi qua config key nào.
- Side panel flow list nhóm theo component.

Ví dụ side panel flow list:

```text
B2P Web/API
  -> MariaDB Dev       DB_HOST
  -> Redis Dev         REDIS_HOST +3
  -> SAP API Dev       SAP_URL

B2P Queue Worker
  -> Redis Dev         REDIS_QUEUE
  -> Kafka Dev         KAFKA_BROKER / publish

B2P Scheduler
  -> MariaDB Dev       DB_HOST
  -> OCR Dev           OCR_URL
```

### Shared service

Service dùng chung chỉ hiển thị một node chung trong cùng môi trường.

Ví dụ:

```text
Proposal Web -> Redis Dev
CRM Web -> Redis Dev
Notification Worker -> Redis Dev
```

Redis Dev vẫn chỉ là một node.

Điều này giúp thấy rõ service nào đang được nhiều app phụ thuộc.

### Search

Search ưu tiên theo:

- Name.
- IP.
- Config key.

Search nên có khả năng tìm:

- App name.
- Service name.
- Host name.
- IP.
- Config key.
- Container name.
- Port.

Khi chọn kết quả search, UI nên:

1. Center graph vào node hoặc edge liên quan.
2. Highlight dependency liên quan.
3. Mở side panel tương ứng.

### Copy config

Side panel cần hỗ trợ copy cả dòng config.

Ví dụ:

```text
REDIS_HOST=redis-dev.local
DB_HOST=mariadb-dev.local
SAP_URL=https://sap-dev.example.local
```

Người dùng muốn cho phép copy đầy đủ giá trị config, bao gồm cả secret nếu có.

### Import

Phase sau hỗ trợ nhập dữ liệu bằng:

- Nhập tay trên UI.
- Import JSON/YAML theo từng app.
- Import JSON/YAML tổng cho toàn bộ topology.

Nên hỗ trợ cả hai kiểu file:

```text
1 app -> 1 infra file
1 system -> 1 topology file
```

Import phải có bước preview trước khi apply.

Luồng đề xuất:

```text
Upload JSON/YAML
  -> Preview nodes/edges/configs sẽ thêm/sửa/xóa
  -> Confirm
  -> Apply
```

### Local environment

Local là topology local của riêng máy người dùng.

Local vẫn cần được quản lý để đối chiếu config và hiểu app chạy trên máy local đang phụ thuộc service nào.

### Dữ liệu mẫu phase đầu

Phase đầu chỉ cần dữ liệu giả lập, bắt đầu với 1 app để UI đơn giản và dễ đánh giá.

Ví dụ app mẫu:

```text
B2P
  - B2P Web/API
  - B2P Queue Worker
  - B2P Scheduler
  - B2P Consumer
```

Service mẫu:

```text
Redis Dev
MariaDB Dev
Kafka Dev
SAP API Dev
Mail Dev
```

### Settings cần có

Một số hành vi nên đưa vào settings thay vì hard-code:

- App collapsed thì edge hiển thị ở app level hay chỉ hiển thị khi expand component.
- Graph có group theo host hay không.
- Host group mặc định tắt ở phase đầu.
- Layout mặc định của graph.
- Highlight mode mặc định.

### Trạng thái node gợi ý

Trạng thái node nên giữ vừa đủ cho MVP:

```text
unknown
healthy
warning
down
maintenance
disabled
```

Ý nghĩa:

- unknown: chưa có thông tin hoặc dữ liệu mẫu.
- healthy: đang hoạt động bình thường.
- warning: có cảnh báo nhưng chưa down.
- down: không hoạt động.
- maintenance: đang bảo trì.
- disabled: service có khai báo nhưng tạm không dùng.

Phase đầu với mock data có thể dùng `unknown`, `healthy`, `warning`, `down` là đủ.

### Quyết định UI phase 1

Phase 1 tập trung vào frontend mock data để kiểm chứng trải nghiệm graph, side panel, search và flow viewer.

Thông tin module:

- Tên menu/module: System Manager.
- Route: `/system-manager`.
- Target phase 1: desktop-first, chưa ưu tiên responsive mobile.
- Graph library: Vue Flow.

Lý do chọn Vue Flow:

- Frontend hiện tại dùng Vue.
- Nhu cầu phase 1 giống topology/workflow canvas hơn là graph analysis thuần túy.
- Cần zoom, pan, drag node, custom node, custom edge, edge label, click node, click edge, minimap/controls.
- Phù hợp với trải nghiệm giống n8n/system topology đã chốt.

Ghi chú:

- Cytoscape.js và AntV G6 có thể mạnh hơn cho graph analysis hoặc graph rất lớn, nhưng chưa cần cho phase 1.
- Nếu sau này topology lớn hoặc cần thuật toán phân tích dependency sâu hơn thì có thể đánh giá lại.

Layout mặc định:

- Graph đi từ trái sang phải.
- App/component nằm bên trái.
- Service phụ thuộc nằm bên phải.
- Host group mặc định tắt.
- Settings UI chưa cần làm trong phase 1; các lựa chọn mặc định có thể hard-code trước.

Environment switch:

- Dùng segmented control cho `Local | Dev`.
- Phase 1 mock trước hai môi trường Local và Dev.

Node trên graph:

- Hiển thị name.
- Hiển thị type.
- Hiển thị status.
- Chưa cần hiển thị host/IP trực tiếp trên node; host/IP nằm trong side panel.

Edge trên graph:

- Edge label hiển thị config key.
- Nếu nhiều config key cùng trỏ tới một service thì hiển thị dạng `REDIS_HOST +3`.
- Click edge mở config detail trong side panel.
- Search config key như `DB_HOST` phải nhảy tới edge liên quan, không chỉ nhảy tới node.

Click behavior:

- Click node mở side panel tab `Overview`.
- Click edge mở side panel phần `Config detail`.
- Double click app node để expand/collapse app.

Side panel phase 1 gồm các tab:

- Overview.
- Runtime.
- Configs.
- Dependencies.
- Flow.
- Notes.

Config trong side panel cần phân nhóm:

- App.
- DB.
- Redis.
- Kafka.
- External API.
- Mail.

Secret/config nhạy cảm:

- Mặc định masked.
- Có nút eye để hiển thị giá trị thật.
- Người dùng cho phép copy đầy đủ giá trị config khi đã cần.

Search:

- Search result nhóm theo:
  - Apps.
  - Services.
  - Hosts.
  - Configs.
  - IPs.
- Search ưu tiên phục vụ debug name, IP và config key.

Flow viewer:

- Action `Start flow` đặt trong side panel.
- Khi start flow, graph highlight toàn bộ downstream dependency.
- Side panel đồng thời liệt kê flow theo component.

Status color:

```text
healthy      xanh
warning      vàng
down         đỏ
unknown      xám
maintenance  xanh dương
disabled     xám nhạt
```

Mock data phase 1:

- App mẫu: B2P.
- Environment mẫu: Local và Dev.
- Component mẫu:
  - B2P Web/API.
  - B2P Queue Worker.
  - B2P Scheduler.
  - B2P Consumer.
- Service mẫu:
  - MariaDB.
  - Redis.
  - Kafka.
  - SAP API.
  - Mail.
  - OCR.
