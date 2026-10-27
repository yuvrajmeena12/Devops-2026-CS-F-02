# SkillSwap Kubernetes Monitoring Operations Guide

This guide details how to operate, verify, test, and maintain the Prometheus and Grafana monitoring stack deployed for the **SkillSwap** Kubernetes application on Docker Desktop.

---

## 1. Architecture Summary

- **Cluster Context**: `docker-desktop` (Kubernetes v1.36.1)
- **Application Namespace**: `skillswap`
  - `frontend-deployment` (2 Replicas, Port 5173, NodePort 30173)
  - `backend-deployment` (2 Replicas, Port 5000, NodePort 30500)
  - `mongodb-k8s-deployment` (1 Replica, Port 27017, PVC 1Gi Bound)
  - `mongodb-service` (ClusterIP routed to in-cluster MongoDB, preserving 18 application records)
- **Monitoring Namespace**: `monitoring`
  - `kube-prometheus-stack` (Prometheus Operator v0.94.2, Prometheus v3.15.1, Node Exporter, Kube State Metrics)
  - `monitoring-grafana` (Grafana v13.2.4 with auto-provisioned SkillSwap dashboard and anonymous Admin viewing)
  - `blackbox-exporter` (Prometheus Blackbox Exporter probing HTTP 200 health on frontend and backend)
  - `skillswap-probes` (Kubernetes Probe CRD scraping endpoints at 10s intervals)

---

## 2. Port-Forwarding Commands

To access the services locally on Windows:

```powershell
# 1. Access Grafana Monitoring Dashboard (http://localhost:3000)
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80

# 2. Access SkillSwap Frontend SPA (http://localhost:5173)
kubectl port-forward -n skillswap svc/frontend-service 5173:5173

# 3. Access SkillSwap Backend API (http://localhost:5000)
kubectl port-forward -n skillswap svc/backend-service 5000:5000

# 4. (Optional) Access Prometheus Directly (http://localhost:9090)
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```

---

## 3. Direct Dashboard URL

Once Grafana port-forwarding is running:
- **Dashboard URL**: `http://localhost:3000/d/skillswap-k8s-monitor/skillswap-kubernetes-application-monitoring`
- **Authentication**: Anonymous Admin is enabled for local localhost access (no login prompt required).

---

## 4. Verification Commands

### Inspect Application Health
```powershell
kubectl get pods,svc,endpoints -n skillswap
kubectl logs deployment/backend-deployment -n skillswap --tail=20
```

### Inspect Monitoring Stack Health
```powershell
helm list -n monitoring
kubectl get pods,svc,pvc -n monitoring
```

### Verify Blackbox Probes from Inside Cluster
```powershell
kubectl exec -n skillswap deployment/frontend-deployment -c frontend -- node -e "const http = require('http'); http.get('http://monitoring-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090/api/v1/query?query=probe_success', res => { let d = ''; res.on('data', c => d += c); res.on('end', () => console.log(d)); });"
```

---

## 5. Running the Repeatable Load Test

The load test runs a controlled 3–5 concurrent user benchmark against the verified frontend and backend endpoints over 45 seconds:

```powershell
node performance-test/load_test_3_to_5_users.js
```

### Outputs Generated:
- JSON detailed telemetry: `performance-test/results.json`
- Text summary report: `monitoring-evidence/02-load-test-report.txt`

---

## 6. Capturing Genuine Dashboard Evidence Screenshots

To capture updated screenshots programmatically using headless Edge:

```powershell
# Zero-user baseline screenshot
$tempDir = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "edge_" + [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir | Out-Null
$args = @("--headless", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=$tempDir", "--virtual-time-budget=8000", "--screenshot=c:\Users\GANPATI\OneDrive\Documents\SKILL_SWAP_FSD\monitoring-evidence\01-baseline-0-users.png", "--window-size=1920,1080", "http://localhost:3000/d/skillswap-k8s-monitor/skillswap-kubernetes-application-monitoring?kiosk")
$proc = Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList $args -PassThru
$proc.WaitForExit(20000)
```

---

## 7. Cleanup & Teardown Instructions

If you need to remove only the monitoring resources while keeping SkillSwap application and database untouched:

```powershell
# 1. Remove Probe and Dashboard ConfigMap
kubectl delete -f k8s/07-monitoring-probe.yaml
kubectl delete -f k8s/08-grafana-dashboard.yaml

# 2. Uninstall Blackbox Exporter and kube-prometheus-stack Helm releases
helm uninstall blackbox-exporter -n monitoring
helm uninstall monitoring -n monitoring

# 3. Remove monitoring namespace
kubectl delete namespace monitoring
```
