# Subscription Tracker API

A secure, production-style REST API for managing user subscriptions, built with Node.js, Express, and MongoDB. It handles authentication, subscription lifecycle management, automated renewal email reminders, and bot/rate-limit protection out of the box.

## Features

- **JWT Authentication** — sign up, sign in, and protected routes secured with `jsonwebtoken` and `bcryptjs` password hashing
- **Subscription Management** — create and fetch subscriptions with rich validation (price, currency, billing frequency, category, status)
- **Automatic Renewal Calculation** — renewal date and `expired` status are computed automatically from the billing frequency if not provided
- **Automated Email Reminders** — a workflow (powered by Upstash Workflow + QStash) sleeps until 7, 5, 2, and 1 day(s) before renewal and sends reminder emails via Nodemailer
- **Bot & Rate-Limit Protection** — every request passes through Arcjet middleware to block bots and throttle abuse
- **MongoDB + Mongoose** — schema-level validation and transactional user creation

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 4 |
| Database | MongoDB / Mongoose |
| Auth | JWT, bcryptjs |
| Security | Arcjet (rate limiting, bot detection) |
| Workflows | Upstash Workflow, QStash |
| Email | Nodemailer |
| Dates | Day.js |

## Project Structure

```
subscription-tracker/
├── app.js                      # Express app entry point
├── config/
│   ├── env.js                  # Environment variable loader
│   ├── arcjet.js                # Arcjet client config
│   ├── nodemailer.js            # Nodemailer transport config
│   └── upstash.js               # Upstash Workflow client config
├── controllers/
│   ├── auth.controller.js       # Sign up / sign in / sign out
│   ├── subscription.controller.js
│   ├── user.controller.js
│   └── workflow.controller.js   # Renewal reminder workflow
├── database/
│   └── mongodb.js               # MongoDB connection
├── middlewares/
│   ├── auth.middleware.js       # JWT route protection
│   ├── arcjet.middleware.js     # Bot/rate-limit protection
│   └── error.middlewares.js     # Centralized error handling
├── models/
│   ├── user.model.js
│   └── subscription.model.js
├── routes/
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── subscription.routes.js
│   └── workflow.routes.js
└── utils/
    ├── email.template.js
    └── send-email.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- An [Upstash](https://upstash.com/) account (for QStash / Workflow)
- An [Arcjet](https://arcjet.com/) account
- An email account/app password for Nodemailer (e.g. Gmail)

### Installation

```bash
git clone https://github.com/HoorAlrumaihani/subscription-tracker.git
cd subscription-tracker
npm install
```

### Environment Variables

Create a `.env.development.local` file in the project root (the app loads `.env.<NODE_ENV>.local`, defaulting to `development`):

```env
# Server
PORT=5500
SERVER_URL="http://localhost:5500"
NODE_ENV=development

# Database
DB_URI=your_mongodb_connection_string

# JWT Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN="1d"

# Arcjet
ARCJET_KEY=your_arcjet_key

# Upstash / QStash
QSTASH_URL=http://127.0.0.1:8080
QSTASH_TOKEN=your_qstash_token

# Email
EMAIL_PASSWORD=your_email_app_password
```

> **Note:** Never commit `.env*.local` files — they are already excluded via `.gitignore`.

### Running the App

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5500`.

## API Reference

Base URL: `/api/v1`

### Auth — `/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/sign-up` | Register a new user |
| POST | `/auth/sign-in` | Authenticate and receive a JWT |
| POST | `/auth/sign-out` | Sign out |

### Users — `/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | — | List all users |
| GET | `/users/:id` | ✅ | Get a single user |
| POST | `/users` | — | Create a user |
| PUT | `/users/:id` | — | Update a user |
| DELETE | `/users/:id` | — | Delete a user |

### Subscriptions — `/subscription`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/subscription` | — | List all subscriptions |
| GET | `/subscription/:id` | — | Get subscription details |
| POST | `/subscription` | ✅ | Create a subscription |
| PUT | `/subscription/:id` | — | Update a subscription |
| DELETE | `/subscription/:id` | — | Delete a subscription |
| GET | `/subscription/users/:id` | ✅ | Get all subscriptions for a user |
| PUT | `/subscription/:id/cancel` | — | Cancel a subscription |
| GET | `/subscription/upconimg-renewals` | — | Get upcoming renewals |

### Workflows — `/workflows`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/workflows/subscription/reminder` | Triggers the Upstash renewal-reminder workflow |

> Routes marked **Auth ✅** require an `Authorization: Bearer <token>` header.

## Subscription Model

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, 2–100 chars |
| `price` | Number | Required, ≥ 0 |
| `currency` | String | `USD`, `EUR`, `GBP` (default `USD`) |
| `frequency` | String | `daily`, `weekly`, `monthly`, `yearly` |
| `category` | String | `sports`, `news`, `entertainment`, `lifestyle`, `technology`, `finance`, `politics`, `other` |
| `paymentMethod` | String | Required |
| `status` | String | `active`, `cancelled`, `expired` (default `active`) |
| `startDate` | Date | Required, must be in the past |
| `renewalDate` | Date | Auto-calculated from `startDate` + `frequency` if omitted |
| `user` | ObjectId | References `User` |

## How Renewal Reminders Work

1. A subscription is created with a `renewalDate`.
2. The `/workflows/subscription/reminder` endpoint kicks off an Upstash Workflow run for that subscription.
3. The workflow sleeps until each reminder checkpoint (**7, 5, 2, and 1 day(s)** before renewal).
4. On each checkpoint, it sends an email to the subscription owner via Nodemailer.
5. If the renewal date has already passed, the workflow exits early.

## Error Handling

All errors flow through a centralized `error.middlewares.js`, returning consistent JSON error responses with appropriate HTTP status codes (e.g. `404` user not found, `409` duplicate user, `429` rate limit exceeded).

## Security

- Passwords are hashed with `bcryptjs` before storage.
- JWTs are used for stateless authentication on protected routes.
- Arcjet middleware inspects every incoming request for bot traffic and enforces rate limits.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## Run with Docker

### 1. Create the environment file

Create `.env.docker.local` in the project root with the app variables. Write values **without quotes**, and point the database URI at the Mongo container name instead of `localhost`:

```
DB_URI=mongodb://dbMongo:27017/subscription-tracker
```

### 2. Option A: Docker Compose (recommended)

`compose.yaml` defines both containers (`myApp` and `dbMongo`), a private network, and a named volume for the database.

```bash
# Start everything in the background
docker compose up -d

# First run only: turn MongoDB into a replica set (needed for transactions)
docker compose exec dbMongo mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'dbMongo:27017'}]})"

# First run only: start the app again if it exited before the replica set was ready
docker compose up -d

# Check status and logs
docker compose ps
docker compose logs myApp --tail 20
```

Useful commands:

```bash
docker compose up -d --build   # rebuild the app image after code changes
docker compose down            # stop and remove containers and network (data volume is kept)
```

> **Note:** Compose prefixes network and volume names with the project name, e.g. `subscription-tracker_mongo-data`. The replica set config is saved inside that volume, so `rs.initiate` is needed only once.

### 3. Option B: Manual Docker commands

The same setup without Compose:

```bash
docker build -t subscription-tracker .
docker network create firstNetwork
docker volume create mongo-data
docker run -d --name dbMongo --network firstNetwork -v mongo-data:/data/db mongo:7 --replSet rs0
docker exec dbMongo mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'dbMongo:27017'}]})"
docker run -d --name myApp --network firstNetwork --env-file .env.docker.local -p 5500:5500 subscription-tracker
```

Only the app publishes a port (`5500`). MongoDB stays reachable only from inside the private network.

## Problems I solved

### 1. Transactions failed inside the container
- **Problem:** Sign-up failed because it uses a MongoDB transaction.
- **Cause:** MongoDB allows transactions only on a replica set. MongoDB Atlas sets this up automatically, but a plain `mongo` container runs as a standalone server.
- **Fix:** Run Mongo with `--replSet rs0`, then initialize it once with `rs.initiate`.
- **Lesson:** The local environment should match production as closely as possible.

### 2. `JWT_EXPIRES_IN` was rejected
- **Problem:** The app rejected the token expiry value.
- **Cause:** Docker's `--env-file` does not strip quotes like `dotenv` does, so the value arrived as `"1d"` with the quotes included.
- **Fix:** Removed quotes from all values in `.env.docker.local`.

### 3. Data was lost when the Mongo container was removed
- **Problem:** Registered users disappeared after deleting and recreating the database container.
- **Cause:** Without a volume, data lives in the container's writable layer and is deleted with it.
- **Fix:** Mounted a named volume on `/data/db`. The replica set config survives too, since it is stored in the same folder.

### 4. Naming mistakes that almost leaked secrets
- **Problem:** Docker could not find the build file, and an env file was about to be pushed to GitHub.
- **Cause:** The file must be named exactly `Dockerfile`, and a typo (`.evn`) did not match the `.env*` rule in `.gitignore`.
- **Fix:** Renamed both files and checked `git status` before every commit.

### 5. Arcjet blocked `curl` requests
- **Problem:** Testing the API with `curl` returned a blocked response.
- **Cause:** Arcjet's bot protection identifies `curl` from its User-Agent header.
- **Fix:** Sent a browser User-Agent while testing: `curl -A "Mozilla/5.0" ...`

### 6. The app exited on the first `docker compose up`
- **Problem:** After `docker compose up -d`, only `dbMongo` was running. The logs showed `MongooseServerSelectionError: Server selection timed out after 30000 ms`.
- **Cause:** Compose started both containers at the same time. Mongo was running, but the replica set was not initialized yet, so the app found no primary server, gave up after 30 seconds, and exited. A container stops when its main process stops.
- **Fix:** Initialized the replica set, then ran `docker compose up -d` again, which starts only the stopped service.
- **Next step:** Add a health check and a restart policy so the app waits for the database or restarts automatically.
