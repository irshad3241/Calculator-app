# CalcStack — Three-Tier CI/CD Demo

A production-style **three-tier Node.js calculator app** demonstrating a full CI/CD pipeline using **Docker**, **Jenkins**, and **AWS**.

```
┌─────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                        │
│                                                          │
│  GitHub Push → Jenkins → Test → Build → ECR → EC2       │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│               THREE-TIER ARCHITECTURE                     │
│                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌───────────────┐  │
│  │  TIER 1     │   │  TIER 2     │   │  TIER 3       │  │
│  │  Frontend   │──▶│  Backend    │──▶│  Database     │  │
│  │  Nginx:80   │   │  Node:3001  │   │  Postgres:5432│  │
│  │  HTML/CSS/JS│   │  Express API│   │  Calculations │  │
│  └─────────────┘   └─────────────┘   └───────────────┘  │
│       Docker           Docker             Docker         │
│    Container         Container          Container        │
└──────────────────────────────────────────────────────────┘
```

## Project Structure

```
calculator-app/
├── frontend/
│   ├── index.html          # Calculator UI
│   ├── nginx.conf          # Nginx config + API proxy
│   └── Dockerfile          # Nginx container
├── backend/
│   ├── server.js           # Express API
│   ├── server.test.js      # Unit tests (Jest)
│   ├── package.json
│   └── Dockerfile          # Node.js container
├── database/
│   └── init.sql            # PostgreSQL schema + seed
├── jenkins/
│   ├── Jenkinsfile          # Full CI/CD pipeline
│   └── docker-compose.jenkins.yml
├── aws/
│   ├── cloudformation.yml  # VPC, EC2, ECR infra
│   └── ec2-setup.sh        # EC2 bootstrap script
└── docker-compose.yml      # Local dev stack
```

## Quick Start — Local Development

### Prerequisites
- Docker & Docker Compose installed
- Node.js 20+ (for local backend dev)

### 1. Run the full stack locally

```bash
git clone <your-repo>
cd calculator-app

# Start all three tiers
docker compose up -d

# Check status
docker compose ps
```

Visit `http://localhost` — the calculator is live!

### 2. Run backend tests

```bash
cd backend
npm install
npm test
```

### 3. Check API health

```bash
curl http://localhost:3001/health
curl -X POST http://localhost:3001/api/calculate \
     -H 'Content-Type: application/json' \
     -d '{"expression":"10+5*2"}'
```

---

## AWS Infrastructure Setup

### Step 1 — Deploy CloudFormation stack

```bash
aws cloudformation deploy \
  --template-file aws/cloudformation.yml \
  --stack-name calculator-app-demo \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName=calculator-app \
    Environment=demo \
    YourIP=$(curl -s ifconfig.me)/32 \
    KeyPairName=your-key-pair-name
```

### Step 2 — Note the outputs

```bash
aws cloudformation describe-stacks \
  --stack-name calculator-app-demo \
  --query 'Stacks[0].Outputs'
```

You'll get: `EC2PublicIP`, `FrontendECRUrl`, `BackendECRUrl`

### Step 3 — Bootstrap the EC2 instance

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
bash <(curl -s https://raw.githubusercontent.com/.../aws/ec2-setup.sh)
```

---

## Jenkins CI/CD Setup

### Step 1 — Start Jenkins

```bash
docker compose -f jenkins/docker-compose.jenkins.yml up -d
```

Open `http://localhost:8080`

### Step 2 — Install plugins

In Jenkins UI: **Manage Jenkins → Plugins → Available**
- Pipeline
- Git
- Docker Pipeline
- SSH Agent
- AWS Credentials
- JUnit
- HTML Publisher

### Step 3 — Add Credentials

| ID | Type | Value |
|---|---|---|
| `docker-registry-url` | Secret text | ECR registry URL |
| `ec2-host` | Secret text | EC2 public IP |
| `ec2-ssh-key` | SSH private key | EC2 .pem file |
| `aws-ecr-credentials` | Username/password | AWS access keys |
| `db-password` | Secret text | DB password |

### Step 4 — Create Pipeline job

1. New Item → Pipeline
2. Pipeline → Definition: "Pipeline script from SCM"
3. SCM: Git → your repo URL
4. Script Path: `jenkins/Jenkinsfile`

### Pipeline Stages

```
Checkout → Install & Lint → Unit Tests → Docker Build
    → Security Scan → Push to ECR → Deploy → Smoke Test
```

- **Branches `staging`** → auto-deploys to staging EC2
- **Branch `main`** → requires manual approval for production

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (API + DB) |
| POST | `/api/calculate` | Evaluate expression |
| GET | `/api/history` | Fetch last N results |
| DELETE | `/api/history` | Clear all history |

### POST /api/calculate

```json
// Request
{ "expression": "10 + 5 * 2" }

// Response
{
  "id": 42,
  "expression": "10 + 5 * 2",
  "result": 20,
  "timestamp": "2024-01-15T12:34:56Z"
}
```

---

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `calculator_db` | Database name |
| `DB_USER` | `postgres` | DB username |
| `DB_PASSWORD` | `postgres` | DB password |
| `FRONTEND_URL` | `*` | CORS allowed origin |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS, Nginx |
| Backend | Node.js 20, Express, pg |
| Database | PostgreSQL 15 |
| Containerization | Docker, Docker Compose |
| CI/CD | Jenkins (Pipeline as Code) |
| Registry | AWS ECR |
| Hosting | AWS EC2 (Ubuntu 22.04) |
| IaC | AWS CloudFormation |
| Security Scanning | Trivy |
| Testing | Jest, Supertest |
