# SkillSwap Kubernetes Monitoring — Performance Results Comparison

## 1. Executive Summary

This document presents the observed, empirical comparison between the **Zero-User Baseline** (idle state) and the **Controlled 3–5 Concurrent User Load Test** on the SkillSwap MERN Kubernetes application.

All metrics are authentic, measured directly from Prometheus scrapes (Blackbox Exporter, cAdvisor, kube-state-metrics, Node Exporter) and the client-side load testing benchmark engine.

---

## 2. Quantitative Comparison Table

| Metric | Zero Users (Baseline) | 3–5 Concurrent Users (Active Load) | Delta / Change Under Load |
| :--- | :--- | :--- | :--- |
| **Frontend HTTP Availability** | 100% (`UP (200 OK)`) | 100% (`UP (200 OK)`) | Stable (No downtime or dropped probes) |
| **Backend API Availability** | 100% (`UP (200 OK)`) | 100% (`UP (200 OK)`) | Stable (No 5xx/connection drops) |
| **MongoDB Pod Condition** | `READY` (1/1) | `READY` (1/1) | Stable (Zero restarts) |
| **Frontend Pod CPU Usage** | ~0.0035 cores (3.5 mCPU) | 0.120 – 0.133 cores (120–133 mCPU) | **+3,700%** (Expected CPU surge serving Vite SSR/assets) |
| **Backend Pod CPU Usage** | ~0.0035 cores (3.5 mCPU) | 0.0302 cores (30.2 mCPU) | **+760%** (Healthy API request handling) |
| **MongoDB Pod Memory** | 232.5 MiB | 232.8 MiB | +0.3 MiB (Negligible growth, clean caching) |
| **Frontend Pod Memory** | 129.8 MiB | 131.2 MiB | +1.4 MiB (Light runtime allocation) |
| **Backend Pod Memory** | 58.5 MiB – 64.0 MiB | 59.8 MiB – 64.4 MiB | +0.4 MiB – 1.3 MiB (Consistent footprint) |
| **HTTP Request Rate** | 0.2 req/s (synthetic probes only) | **21.56 req/s** | +21.36 req/s user load delivered |
| **Frontend Probe Latency** | Mean: 5.84 ms (Max: 7.74 ms) | Mean: 6.77 ms (Max: 31.2 ms) | +0.93 ms average (+23.4 ms transient peak) |
| **Backend Probe Latency** | Mean: 5.40 ms (Max: 31.5 ms) | Mean: 4.70 ms (Max: 34.3 ms) | Consistent sub-10ms baseline response |
| **Client Benchmark Latency (P50)**| *Not measured* (No user traffic) | **4.82 ms** | Excellent median responsiveness |
| **Client Benchmark Latency (P95)**| *Not measured* (No user traffic) | **20.78 ms** | Sub-25ms SLA compliance |
| **Client Benchmark Latency (Max)**| *Not measured* (No user traffic) | **67.35 ms** | Sub-100ms worst-case roundtrip |
| **Error Rate** | 0.00% | **0.00%** (0 failed of 975 requests) | Zero HTTP or network errors |
| **SkillSwap Pod Restarts** | 3 (Historical from initial startup) | **3 (Zero new restarts)** | 100% Pod stability |

---

## 3. Analysis & Bottleneck Identification

1. **CPU Scalability**:
   - Under 5 concurrent virtual users generating ~21.5 requests/sec, frontend pod CPU rose to ~133m out of a configured 500m limit (26.6% saturation).
   - Backend pod CPU peaked at ~30.2m out of a configured 500m limit (6.0% saturation).
   - Both services operate comfortably within their burst limits without CPU throttling or OOM kills.

2. **Memory Footprint**:
   - Memory remained exceptionally stable across all pods. Frontend consumed ~130 MiB (limit 512 MiB), Backend consumed ~64 MiB (limit 512 MiB), and MongoDB consumed ~233 MiB (limit 512 MiB).
   - No signs of memory leakage or excessive buffer allocation were observed.

3. **Latency Profile**:
   - P50 (median) latency of 4.82 ms and P95 latency of 20.78 ms demonstrate that the Kubernetes internal networking, CoreDNS, and service mesh load-balancing function with negligible overhead on Docker Desktop.

4. **Identified Bottlenecks & Recommendations**:
   - **Single-Node Density**: Because all workloads (Kubernetes control plane, Prometheus, Grafana, Node Exporter, MongoDB, and SkillSwap) reside on the single `desktop-control-plane` node, resource contention will occur if concurrent users scale above 50–100 users without node scaling.
   - **Horizontal Pod Autoscaling (HPA)**: Adding an HPA resource targeting 70% CPU utilization on `backend-deployment` and `frontend-deployment` would automatically scale replicas from 2 to 5 during peak evaluation traffic.

---

## 4. Evidence Verification

- Baseline Grafana Screenshot: `monitoring-evidence/01-baseline-0-users.png`
- Baseline Frontend Screenshot: `monitoring-evidence/01-frontend-baseline.png`
- Active 3-5 Users Load Test Screenshot: `monitoring-evidence/02-load-test-3-to-5-users.png`
- Benchmark Text Report: `monitoring-evidence/02-load-test-report.txt`
- Benchmark JSON Metrics: `performance-test/results.json`
