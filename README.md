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
dcoker network create calculator-network 

# step:1 create backend image and run container (same network for connection)

## Run

cd backend 
docker build -t backend-image .

docker run -d -p 3001:3001 --network calculator-network --name backend-container backend-image

docker run -d \
--name backend-container \
--network calculator-network \
--env-file .env \
-p 3001:3001 \
calculator-backend

# step 2: create frontend container

## Run

docker build -t frontend-image .

docker run -d \
-p 80:80 \
--network calculator-network \
--name frontend-container \
frontend-image

# step 3 Database Container

## Run

docker run -d \
--name db-container \
--network calculator-network \
--env-file .env \
-p 5432:5432 \
postgres:15-alpine
