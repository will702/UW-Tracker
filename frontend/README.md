# UW Tracker Frontend

Modern React + TypeScript frontend for the Indonesian IPO Underwriter Performance Tracker.

## Features

- 📊 **Dashboard**: Overview statistics and system health
- 📋 **Records Table**: Browse and search IPO records with pagination
- 🔍 **Record Details**: View detailed information about individual IPOs
- 🎨 **Modern UI**: Clean, responsive design with TailwindCSS
- ⚡ **Fast**: Built with Vite for optimal performance

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:8000` (or configure `VITE_API_BASE_URL`)

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

Build the optimized production bundle:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Configuration

By default, the frontend connects to `http://localhost:8000/api`. To change this, create a `.env` file:

```env
VITE_API_BASE_URL=http://your-api-url/api
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
└── package.json        # Dependencies
```

## Tech Stack

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing

