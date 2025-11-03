# UW Tracker - Indonesian IPO Underwriter Performance Tracker

A full-stack web application for tracking and analyzing Indonesian IPO (Initial Public Offering) underwriter performance. This application provides insights into how different underwriters perform with their IPO listings across multiple days.

## 🚀 Features

- **📊 Dashboard**: Overview statistics and system health monitoring
- **📋 Records Management**: Browse, search, and view IPO records with full D+1 to D+7 return data
- **🔥 Heatmap Visualization**: Underwriter performance heatmap showing average returns across all days
- **🔍 Advanced Search**: Search by underwriter code with automatic grouping
- **📥 Data Export**: Download records as JSON or CSV/Excel files
- **🔐 Admin Dashboard**: Secure admin panel for adding/deleting records
- **📈 Sorting & Filtering**: Sort records by any return column (D+1 through D+7)
- **🎯 Smart Grouping**: Automatically groups stocks with multiple underwriters

## 📁 Project Structure

```
UW-Tracker-2/
├── backend/                 # FastAPI backend
│   ├── models/             # Pydantic data models
│   ├── routers/            # API route handlers
│   ├── services/           # Business logic layer
│   ├── server.py           # Main FastAPI application
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   ├── package.json       # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
└── README.md              # This file
```

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: NoSQL database with Motor (async driver)
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

### Frontend
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing

## 📚 Documentation

- [Setup Guide](./docs/SETUP.md) - Installation and local development setup
- [API Documentation](./docs/API.md) - Complete API endpoint reference
- [Deployment Guide](./docs/DEPLOYMENT.md) - How to deploy to production
- [Frontend README](./frontend/README.md) - Frontend-specific documentation

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ 
- Node.js 18+
- MongoDB (local or cloud instance)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔐 Admin Access

- **URL**: `/admin`
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in production!

## 📊 API Endpoints

- `GET /api/healthz` - Health check
- `GET /api/info` - API information
- `GET /api/uw-data-grouped/grouped` - Get grouped records
- `GET /api/uw-data-grouped/stats` - Get statistics
- `POST /api/uw-data-grouped/` - Create record
- `DELETE /api/uw-data-grouped/{id}` - Delete record

See [API Documentation](./docs/API.md) for complete details.

## 🌐 Deployment

The application can be deployed to:
- **Frontend**: Vercel (recommended) or Netlify
- **Backend**: Render (recommended) or Railway
- **Database**: MongoDB Atlas (required for production)

**Quick Deploy**: See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) for 5-minute deployment guide.

**Detailed Guide**: See [Deployment Guide](./docs/DEPLOYMENT.md) for step-by-step instructions.

**Render Specific**: See [Render Deployment Guide](./docs/DEPLOYMENT_RENDER.md) for detailed Render setup.

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For issues or questions, please contact the project maintainer.

---

Built with ❤️ for tracking Indonesian IPO underwriter performance

