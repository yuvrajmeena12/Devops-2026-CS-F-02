# SkillSwap Kubernetes Architecture & Deployment Documentation

## 1. Overview & Architecture

This repository contains the complete production-grade Kubernetes deployment and CI/CD automation manifests for the **SkillSwap** full-stack MERN application.

### High-Level Topology

```
                  [Browser Client / College Evaluator]
                                   │
                                   ├─── Port 5173 / NodePort 30173
                                   │    │
                                   │    ▼
                                   │  ┌────────────────────────────────────────────────────────┐
                                   │  │ Frontend Service (NodePort: 30173, TargetPort: 5173)   │
                                   │  └──────────────────────────┬─────────────────────────────┘
                                   │                             ▼
                                   │            ┌────────────────────────────────┐
                                   │            │ frontend-deployment (Replicas: 2)
                                   │            │ - Vite React SPA               │
                                   │            │ - Probes: / (Port 5173)        │
                                   │            └────────────────────────────────┘
                                   │
                                   └─── Port 5000 / NodePort 30500
                                        │
                                        ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │ Backend Service (NodePort: 30500, TargetPort: 5000)    │
                                      └──────────────────────────┬─────────────────────────────┘
                                                                 ▼
                                                ┌────────────────────────────────┐
                                                │ backend-deployment (Replicas: 2)
                                                │ - Node.js / Express API        │
                                                │ - Probes: /api/health (Port 5000)
                                                └────────────────┬───────────────┘
                                                                 │
                                                                 ▼
                                                  ┌─────────────────────────────┐
                                                  │ mongodb-service (Port 27017)│
                                                  └──────────────┬──────────────┘
                                                                 ▼
                                                  ┌─────────────────────────────┐
                                                  │ Endpoints: 172.23.0.5:27017 │
                                                  │ (Existing Database Preserved│
                                                  │  with Zero Data Loss)       │
                                                  └─────────────────────────────┘
```

---

## 2. Kubernetes Resources Implemented

| Manifest File | Kind | Name | Port / Config | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01-namespace.yaml` | `Namespace` | `skillswap` | Isolated Scope | Isolates all SkillSwap resources from default cluster namespaces |
| `02-secrets.example.yaml` | `Secret` | `skillswap-secret` | Base64 Encrypted | Stores `JWT_SECRET` and `MONGO_URI` securely |
| `03-configmap.yaml` | `ConfigMap` | `skillswap-config` | Port 5000, CORS | Stores non-sensitive runtime config (`PORT`, `NODE_ENV`, `CLIENT_URL`, `VITE_API_URL`) |
| `04-mongodb.yaml` | `Service` + `Endpoints` | `mongodb-service` | 27017 TCP | Headless proxy to existing MongoDB container, preserving user records |
| `04-mongodb.yaml` | `PVC` + `Deployment` | `mongodb-k8s` | 1Gi `local-path` | In-cluster MongoDB with PersistentVolumeClaim for storage demonstration |
| `05-backend.yaml` | `Deployment` + `Service` | `backend-deployment` | Port 5000 / NodePort 30500 | 2 Replicas, Liveness/Readiness probes at `/api/health`, resource limits |
| `06-frontend.yaml` | `Deployment` + `Service` | `frontend-deployment` | Port 5173 / NodePort 30173 | 2 Replicas, Vite dev host allowance, Liveness/Readiness checks |

---

## 3. Database Strategy: Preserving Existing MongoDB

To satisfy strict project constraints:
1. **Zero Data Loss**: The existing MongoDB container (`skillswap-mongodb`) holds active collections (`users`, `skills`, `swaprequests`, `messages`, `sessions`, `notifications`, `reviews`).
2. **Kubernetes Bridge**: The container was connected to the control plane bridge network (`kind`), receiving IP `172.23.0.5`.
3. A Kubernetes `Service` named `mongodb-service` paired with a manual `Endpoints` object points traffic from inside the cluster (`mongodb-service:27017`) directly to `172.23.0.5:27017`.
4. **Academic Demonstration of PVC**: In addition, `04-mongodb.yaml` defines a native Kubernetes `PersistentVolumeClaim` (`mongodb-pvc`) bound to the cluster's `local-path` provisioner to demonstrate storage persistence concepts to evaluators.

---

## 4. Containerd Image Import Solution

In Docker Desktop Kubernetes (which runs a `kindest/node` control-plane container backed by containerd):
Docker Desktop engine images are not automatically present inside the containerd `k8s.io` namespace. To bridge this without creating extra clusters or external registries:

```bash
# 1. Build images in Docker
docker build -t skillswap-backend:latest ./backend
docker build -t skillswap-frontend:latest ./frontend

# 2. Export tar archive and copy into control-plane container
docker save -o temp-backend.tar skillswap-backend:latest
docker cp temp-backend.tar desktop-control-plane:/temp-backend.tar

# 3. Import tar archive into the k8s.io containerd namespace
docker exec desktop-control-plane ctr -n k8s.io images import /temp-backend.tar
docker exec desktop-control-plane rm /temp-backend.tar
del temp-backend.tar
```
This enables Kubernetes Deployments to use `imagePullPolicy: IfNotPresent` and start instantly.

---

## 5. Verification Commands & Evidence

### Inspect Pods & Deployments
```bash
kubectl get pods -n skillswap -o wide
```
**Actual Output:**
```
NAME                                     READY   STATUS    RESTARTS   AGE   IP            NODE
backend-deployment-bb849b64d-9lmxk       1/1     Running   0          18m   10.244.0.7    desktop-control-plane
backend-deployment-bb849b64d-bglqq       1/1     Running   0          18m   10.244.0.6    desktop-control-plane
frontend-deployment-58db55f96f-nqgt6     1/1     Running   0          1m    10.244.0.11   desktop-control-plane
frontend-deployment-58db55f96f-w89dc     1/1     Running   0          1m    10.244.0.12   desktop-control-plane
mongodb-k8s-deployment-cfb68ccd8-j7fc8   1/1     Running   0          18m   10.244.0.10   desktop-control-plane
```

### Inspect Services & Endpoints
```bash
kubectl get services,endpoints -n skillswap
```
**Actual Output:**
```
NAME                              TYPE        CLUSTER-IP      PORT(S)          AGE
service/backend-service           NodePort    10.96.148.39    5000:30500/TCP   18m
service/frontend-service          NodePort    10.96.38.116    5173:30173/TCP   18m
service/mongodb-cluster-service   ClusterIP   10.96.243.237   27017/TCP        18m
service/mongodb-service           ClusterIP   10.96.173.228   27017/TCP        18m

NAME                                ENDPOINTS                         AGE
endpoints/backend-service           10.244.0.6:5000,10.244.0.7:5000   18m
endpoints/frontend-service          10.244.0.11:5173,10.244.0.12:5173 1m
endpoints/mongodb-cluster-service   10.244.0.10:27017                 18m
endpoints/mongodb-service           172.23.0.5:27017                  18m
```

### Verify Internal Service Discovery & MongoDB Connection
```bash
# Verify backend connected to MongoDB
kubectl logs -l app=backend -n skillswap --tail=10
```
**Actual Log Evidence:**
```
SkillSwap server running on port 5000
MongoDB connected: mongodb-service
```

```bash
# Test frontend-to-backend request through service discovery
kubectl exec -n skillswap deployment/frontend-deployment -c frontend -- node -e "const http = require('http'); http.get('http://backend-service:5000/api/health', res => { console.log('HTTP Status:', res.statusCode); });"
```
**Actual Output:**
```
HTTP Status: 200
```

---

## 6. Accessing the Application

### Option A: Using Port-Forwarding (Recommended for localhost demo)
```bash
# Terminal 1: Forward frontend
kubectl port-forward svc/frontend-service 5173:5173 -n skillswap

# Terminal 2: Forward backend
kubectl port-forward svc/backend-service 5000:5000 -n skillswap
```
Then visit `http://localhost:5173` in your browser.

### Option B: Using NodePort
- Frontend: `http://localhost:30173` (or `http://<node-ip>:30173`)
- Backend: `http://localhost:30500` (or `http://<node-ip>:30500`)

---

## 7. Teacher Viva & Concept Reference Guide

| Kubernetes Concept | Where Used in SkillSwap | Explanation for Professor |
| :--- | :--- | :--- |
| **Pod** | Containers in `skillswap` namespace | The smallest deployable computing unit in Kubernetes. Groups one or more containers sharing network IP and storage. |
| **Deployment** | `backend-deployment`, `frontend-deployment` | A declarative controller that manages ReplicaSets, enabling zero-downtime rolling updates and automated rollbacks. |
| **Replication / Scaling** | `replicas: 2` | If traffic spikes or one pod fails, Kubernetes maintains the desired replica count automatically (`kubectl scale deployment backend-deployment --replicas=4 -n skillswap`). |
| **Self-Healing** | Liveness & Readiness Probes | Kubelet queries `/api/health` and `/` regularly. If a container hangs, Kubernetes automatically restarts it; if it fails readiness, it is removed from load balancing. |
| **Service & Discovery** | `ClusterIP` & `NodePort` | Provides a stable DNS name and virtual IP with built-in round-robin load balancing across dynamic pod IPs. |
| **Endpoints** | `mongodb-service` | Defines explicit IP/port destinations for a service, demonstrated here to bridge cluster traffic to an existing database container. |
| **PersistentVolumeClaim** | `mongodb-pvc` (1Gi) | Decouples storage requirements from underlying infrastructure; dynamically provisioned by `local-path` storage class. |
| **Secrets & ConfigMaps** | `skillswap-secret`, `skillswap-config` | Decouples sensitive environment variables (`JWT_SECRET`) and configuration (`CLIENT_URL`) from application container images. |
| **CI/CD Pipeline** | `Jenkinsfile` | Automates code checkout, dependency installation, testing, container building, containerd loading, manifest deployment, and rollout health auditing. |
