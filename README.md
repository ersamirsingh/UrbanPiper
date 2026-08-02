# OmniServe - Multi-Tenant Restaurant OS & Order Simulator Stack

Comprehensive food ordering, POS, KDS, and online integration platform with a standalone **Order Simulator Tool**.

---

## 🐳 Running the App Stack with Docker (Live Hot-Reloading Enabled)

Run Frontend, Backend Server, and Order Simulator in Docker with **Live Volume Mounting** enabled so any code change you save on your laptop automatically syncs inside Docker:

```bash
# From omniserve root directory:
cd omniserve
docker compose up --build
```

### Services & Port Mappings

| Service | Container Name | Description | Access URL | Port |
| :--- | :--- | :--- | :--- | :--- |
| **Client** | `omniserve-frontend` | OmniServe Admin & KDS Web App | `http://localhost:5173` | `5173` |
| **Order Simulator** | `omniserve-order-simulator` | Delayed & Batch Test Launcher | `http://localhost:5050` | `5050` |
| **Server** | `omniserve-backend` | Backend API & WebSockets | `http://localhost:5000/api` | `5000` |

> ⚡ **Live Hot-Reloading**: Changes saved in `./server/src`, `./order-simulator/src`, and `./order-simulator/public` are mounted live into the containers!

---

## 💻 Running Locally without Docker

### 1. Backend Server
```bash
cd server
npm install
npm run dev
```

### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```

### 3. Order Simulator
```bash
cd order-simulator
npm install
npm run dev
```
