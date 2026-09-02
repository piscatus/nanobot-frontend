# Nanobot Frontend Documentation

## Introduction

Nanobot Frontend is a Node.js application designed to run the Discord Bot client and interact with the Nanobot Backend application.

## Prerequisites

Before running the Nanobot Frontend application, please ensure the follow prerequisites are met:

1. **Docker**:

   - Docker engine installed and running on your system
   - https://docs.docker.com/engine/install/ubuntu/

2. **Hosts File**:

   - Update the Host Machines Hosts File with `sudo nano /etc/hosts`
   - Add `127.0.0.1 nanobot-frontend`

3. **Nanobot-API**:

   - Running with necessary docker network.
   - Ready to Process Requests.

5. **.env.template Modifications**

   - Copy the template file with `sudo cp .env.template .env`
   - Edit the .env file with `sudo vi .env`

5. **Cute Pictures Imported**:

   - Import at least one of each cute image type to ./cute
   - `cd /birdPics && sudo scp -r ./* anon@192.168.86.250:/opt/nanobot-frontend/cute/bird`

6. **File and Former Permissions Updated**:

   - Due to docker-compose specifying user: "1000:1000" you may need to:
   - `sudo chown -R 1000:1000 nanobot-frontend/`

## Instructions

To run the application, navigate to the root of the project directory and execute `docker compose up -d`
