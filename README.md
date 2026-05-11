# Smart Voting System

A web-based smart voting system that combines online voting with face capture/recognition functionality. The project uses a React frontend and a FastAPI backend with SQLite for data storage.

---

# Features

- User registration and login
- Webcam image capture
- Online voting interface
- Backend API using FastAPI
- SQLite database integration
- Face/image processing using OpenCV
- Machine learning dependencies using Keras

---

# Tech Stack

## Frontend
- React
- Vite
- JavaScript (JSX)
- CSS

## Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy

## Machine Learning / Image Processing
- OpenCV
- NumPy
- Keras

## Database
- SQLite

---

# Project Structure

```text
SMART_VOTING_SYSTEM/
│
├── backend/
│   ├── auth/
│   ├── blockchain/
│   ├── models/
│   ├── __init__.py
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── voting.db
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
└── venv/
```

---

# Backend Overview

The backend is built using FastAPI and handles:
- API routing
- Authentication-related functionality
- Database operations
- Voting logic
- Image/face processing integration

## Important Files

### `main.py`
Entry point of the FastAPI backend application.

### `database.py`
Handles database configuration and connection.

### `voting.db`
SQLite database file used for storing application data.

### `auth/`
Contains authentication-related logic.

### `models/`
Contains database models/schema definitions.

### `blockchain/`
Contains blockchain-related functionality used in the project.

---

# Frontend Overview

The frontend is built using React and Vite.

## Main Components

### `Navbar.jsx`
Navigation bar component.

### `WebcamCapture.jsx`
Handles webcam access and image capture.

### `App.jsx`
Main application component.

---

# Installation & Setup

## Prerequisites

Install:
- Python 3
- Node.js
- npm

---

# Backend Setup

Open terminal inside the `backend` folder.

## Create virtual environment (optional)

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux/Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Install backend dependencies

```bash
pip install -r requirements.txt
```

---

## Run backend server

```bash
uvicorn main:app --reload
```

Backend runs on:

```text
http://127.0.0.1:8000
```

---

# Frontend Setup

Open a new terminal inside the `frontend` folder.

## Install frontend dependencies

```bash
npm install
```

---

## Run frontend

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# Usage

1. Start the backend server
2. Start the frontend server
3. Open the frontend URL in browser
4. Register/Login
5. Allow webcam access if prompted
6. Access the voting interface

---

# Dependencies

## Backend Requirements

```text
fastapi
uvicorn
pydantic
opencv-python
numpy
keras
sqlalchemy
```

---

# Notes

- The project uses SQLite for local database storage.
- Webcam functionality requires camera permission in browser.
- Backend and frontend must run simultaneously.

---

# Future Improvements

- Improved face recognition accuracy
- Better authentication and security
- Enhanced UI/UX
- Scalable database support
- Deployment configuration

---

# Author

Developed as a Smart Voting System final year project.
