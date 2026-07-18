> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `OAT [PROJECT_NAME]\OAT - HA.md`.

# OAT HA and Failover

> **Mục đích sử dụng:** Dùng cho kịch bản HA/failover/DR ở mức ứng dụng, hạ tầng, database hoặc network, kèm expected behavior và rollback.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

## 1. Danh sách hệ thống

| **Hệ thống** | **HA mode** | **Số lượng instance** | **Note** |
| --- | --- | --- | --- |
| **Network** |  |  |  |
| F5 | Cluster 2 nodes: active-standby | 2 |  |
| Router Inbound | Cluster 2 nodes: active-active | 2 |  |
| Router Outbound | Cluster 2 nodes: active-active | 2 |  |
| Router Backbone | Cluster 2 nodes: active-active | 2 |  |
| Switch Edge | Cluster 2 nodes: active-active | 2 |  |
| **Security** |  |  |  |
| Firewall Inbound | Cluster 1 nodes (Off 1 node để dồn license cho PT) | 1 |  |
| Firewall Outbound | Cluster 1 nodes (Off 1 node để dồn license cho PT) | 1 |  |
| Firewall Core | Cluster 1 nodes (Off 1 node để dồn license cho PT) | 1 |  |
| Firewall DC-DR | Cluster 2 nodes: active-standby (nhưng no-license ) | 2 |  |
|  |  |  |  |
| **[SYSTEM_NAME] Service ([SYSTEM_NAME]-common)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| approval | 2 | 2 |  |
| audit-log | 15 | 4 |  |
| limit-capture | 2 | 2 |  |
| [USER_OR_PARTNER] | 2 | 2 |  |
| user-partner-bff | 2 | 2 |  |
| notification | 2 | 2 |  |
| ops-bff | 2 | 2 |  |
| outgoing-connector | 2 | 2 |  |
| outgoing-connector-02 | 2 | 2 |  |
| portal-[USER_OR_PARTNER] | 2 | 2 |  |
| portal-ops | 2 | 2 |  |
| [BATCH_PROCESSING_MODULE]-dispatcher | 2 | 2 |  |
| [BATCH_PROCESSING_MODULE]-management | 3 | 2 |  |
| transaction-log | 15 | 4 |  |
| transaction-management | 2 | 2 |  |
| **[SYSTEM_NAME] Service ([SYSTEM_NAME]-transaction-01)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| incoming-connector | 10 | 5 |  |
| incoming-connector-inquiry | 10 | 7 |  |
| [USER_OR_PARTNER] | 5 | 4 |  |
| user-partner-inquiry | 5 | 5 |  |
| outgoing-connector | 5 | 5 |  |
| outgoing-connector-02 | 5 | 4 |  |
| outgoing-connector-inquiry | 5 | 5 |  |
| outgoing-connector-inquiry-02 | 5 | 5 |  |
| [BUSINESS_DOMAIN]-dispatcher | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-01 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-02 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-03 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-04 | 2 | 2 |  |
| screening | 5 | 5 |  |
| transaction-management | 2 | 2 |  |
| **[SYSTEM_NAME] Service ([SYSTEM_NAME]-transaction-02)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| incoming-connector | 10 | 6 |  |
| incoming-connector-inquiry | 10 | 7 |  |
| [USER_OR_PARTNER] | 5 | 5 |  |
| user-partner-inquiry | 5 | 5 |  |
| outgoing-connector | 5 | 5 |  |
| outgoing-connector-02 | 5 | 5 |  |
| outgoing-connector-inquiry | 5 | 5 |  |
| outgoing-connector-inquiry-02 | 5 | 5 |  |
| [BUSINESS_DOMAIN]-dispatcher | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-01 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-02 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-03 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-04 | 2 | 2 |  |
| screening | 5 | 5 |  |
| transaction-management | 2 | 2 |  |
| **[SYSTEM_NAME] Service ([SYSTEM_NAME]-transaction-03)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| incoming-connector | 10 | 5 |  |
| incoming-connector-inquiry | 10 | 8 |  |
| [USER_OR_PARTNER] | 5 | 5 |  |
| user-partner-inquiry | 5 | 5 |  |
| outgoing-connector | 5 | 4 |  |
| outgoing-connector-02 | 5 | 5 |  |
| outgoing-connector-inquiry | 5 | 5 |  |
| outgoing-connector-inquiry-02 | 5 | 4 |  |
| [BUSINESS_DOMAIN]-dispatcher | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-01 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-02 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-03 | 2 | 2 |  |
| [BUSINESS_DOMAIN]-dispatcher-04 | 2 | 2 |  |
| screening | 5 | 5 |  |
| transaction-management | 2 | 2 |  |
| **[SYSTEM_NAME] Service (ingress-nginx)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| ingress-nginx-controller | 4 | 4 |  |
| **[SYSTEM_NAME] Service (vault)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| vault-agent-injector | 3 | 3 |  |
| vault-secrets-operator-controller-manager | 1 | 1 |  |
| **[SYSTEM_NAME] Service (keycloak)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| keycloak | 2 | 2 |  |
| **NexSafe Service (nexsafe)** |  |  |  |
| aml-service | 10 | 8 |  |
| fraud-aml-core-service | 11 | 7 |  |
| fraud-aml-decision-engine | 3 | 3 |  |
| fraud-aml-history | 3 | 2 |  |
| fraud-aml-sync-job | 1 | 1 |  |
| **NexSafe Service (ingress-nginx)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| ingress-nginx-controller | 5 | 3 |  |
| **NexSafe Service (vault)** | **Số lượng pod(s)** | **Số lượng node(s)** |  |
| vault-agent-injector | 3 | 2 |  |
|  |  |  |  |
|  |  |  |  |
| [WORKFLOW_ENGINE] | Chạy 2 cluster   - Mode active-active chia workload theo nhóm partner | Số lượng pod theo từng service trong 1 cluster:   - **frontend: 5** - **history: 10** - **matching: 8** - internal-frontend: 2 - web: 2 - worker: 2 - admintools: 1 | Số lượng k8s node cho mỗi cluster: 26 node |
| Kong | Tất cả các cluster Kong chạy mode active-active. Load Balancer và Instance Group | Số lượng VMs:   - Kong Public: 3 - Kong Internal: 3 - Kong [OPS_PORTAL]: 2 - Kong Admin: 2 |  |
|  |  |  |  |
|  |  |  |  |
| **Database** |  |  |  |
| Oracle TXN (core transaction) | Cluster 2 nodes   - active-active | 2 | 2 |
| Oracle STLM (đối chiếu dữ liệu) | Cluster 2 nodes   - active-active | 2 | 2 |
| Redis (cache) | hệ thống cluster 6 nodes   - active-standby - 3 master - 3 slave | 6 | 6 |
| Postgres (Kong) | hệ thống chạy cluster patroni 3 nodes   - active-standby - 1 master - 2 replica | 3 | 3 |
| Postgres (keycloak) | hệ thống chạy cluster patroni 3 nodes   - active-standby - 1 master - 2 replica | 3 | 3 |
| Cassandra ([WORKFLOW_ENGINE]) | Hệ thống chạy cluster 3 nodes   - active-active | 3 | 3 |
|  |  |  |  |







