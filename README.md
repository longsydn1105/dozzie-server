# Capsule Hotel Server

Backend API for the Capsule Hotel project. The server is built with Node.js, Express, MongoDB, Socket.IO, MQTT, Firebase Admin, and email services for booking, chat, room control, and notifications.

## Prerequisites

- Node.js 18+ recommended
- MongoDB connection string
- Environment variables for the app and third-party services

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Note: the current `package.json` does not define a `dev` script yet. If you want to run the server with `npm run dev`, add a suitable script such as `nodemon server.js`.

## Environment Variables

The server reads at least these variables:

- `PORT` - HTTP port, defaults to `3000`
- `MONGODB_URI` - MongoDB connection string
- `RESEND_API_KEY` - used by the email utility

## App Entry Point

The server starts from [`server.js`](server.js) and mounts the following route groups:

- `/api/bookings`
- `/api/auth`
- `/api/rooms`
- `/api/blogs`
- `/api/reviews`
- `/api/service-packages`
- `/api/invoices`
- `/api/sos`
- `/api/users`
- `/api/chat`

It also exposes a health check at `/`.

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Bookings

- `POST /api/bookings/`
- `GET /api/bookings/`
- `GET /api/bookings/admin`
- `GET /api/bookings/my-bookings`
- `GET /api/bookings/my-status`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id`
- `DELETE /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel`

### Rooms

- `GET /api/rooms/`
- `GET /api/rooms/:id`
- `POST /api/rooms/`
- `PUT /api/rooms/:id`
- `DELETE /api/rooms/:id`
- `POST /api/rooms/iot-command`

### Blogs

- `GET /api/blogs/`
- `POST /api/blogs/`

### Reviews

- `GET /api/reviews/`
- `GET /api/reviews/my-reviews`
- `POST /api/reviews/`
- `PUT /api/reviews/:id`
- `DELETE /api/reviews/:id`
- `DELETE /api/reviews/admin/:id`

### Service Packages

- `GET /api/service-packages/`
- `GET /api/service-packages/all`
- `POST /api/service-packages/`
- `PUT /api/service-packages/:id`
- `DELETE /api/service-packages/:id`

### Invoices

- `GET /api/invoices/my-invoices`
- `PATCH /api/invoices/:id/pay`
- `GET /api/invoices/all`
- `POST /api/invoices/create`
- `PATCH /api/invoices/:id/refund`

### SOS Alerts

- `POST /api/sos/emergency`
- `GET /api/sos/list`
- `PATCH /api/sos/resolve/:id`

### Users

- `PUT /api/users/profile`
- `GET /api/users/`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Chat

- `GET /api/chat/history/:bookingId`

## Core Runtime Features

- Express middleware for JSON and CORS
- MongoDB connection and server bootstrap
- Socket.IO initialization for realtime chat notifications
- MQTT client initialization for IoT room commands
- Cron job startup for booking timeout handling

## Project Structure

- `controllers/` - request handlers
- `models/` - Mongoose schemas
- `routes/` - API route definitions
- `middleware/` - auth guards and shared middleware
- `utils/` - MQTT, Firebase, email, password, and socket helpers
- `cron/` - scheduled tasks

## Quick Start

```bash
npm install
npm run dev
node server.js
```

If you do not have a dev script yet, start the server with your preferred Node.js runner after adding one to `package.json`.
