# Real-Time Multiplayer Chess Platform

A full-stack, real-time chess platform built with Node.js, React, Tailwind CSS v4, PostgreSQL, and Socket.io. Features secure email activation, JWT refresh token rotation, live matchmaking, and ELO ranking calculations.

## Features

- **Authentication & Security**: Email activation route (`/activate/:token`), HTTP-only refresh token rotation, and JWT authentication.
- **Real-Time Gameplay**: Socket.io middleware with real-time PostgreSQL token verification for socket connections.
- **Matchmaking & Stats**: Instant player matchmaking, ELO rating updates, and complete game history.
- **Modern UI**: Tailored with React 18, React Router v7, and Tailwind CSS v4 styling.

## Tech Stack

- **Frontend**: React 18, Vite, React Router v7, Axios, Tailwind CSS v4
- **Backend**: Node.js, Express, Socket.io, PostgreSQL (`pg-promise`)
- **Authentication**: JWT, HTTP-Only Cookies, bcrypt

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database instance that can be recreated from db-schema.sql file