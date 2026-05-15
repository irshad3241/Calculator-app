# Calculator App

Dockerized calculator application using Node.js, NGINX, and PostgreSQL.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Docker
- NGINX

# create network
## Run
docker network create calculator-network

# step 1 Database Container

create .env file in database directory before running container
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=

## Run

docker run -d \
  --name calculator-db \
  --network calculator-network \
  -p 5432:5432 \
  -e POSTGRES_DB=calculator_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=securepassword \
  -v calculator-postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine



# step:2 create backend image and run container (same network for connection)

create backend env file before running container.
PORT=

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

FRONTEND_URL=

## Run

cd backend 
docker build -t calculator-backend-image .

docker run -d -p 3001:3001 --network calculator-network --name backend-container backend-image

docker run -d \
  --name calculator-backend \
  --network calculator-network \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e DB_HOST=calculator-db \
  -e DB_PORT=5432 \
  -e DB_NAME=calculator_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=securepassword \
  calculator-backend-image

Note: 

# step 3: create frontend container

## Run

docker build -t frontend-image .

docker run -d \
-p 80:80 \
--network calculator-network \
--name frontend-container \
frontend-image

