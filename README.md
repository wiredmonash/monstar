# MonSTAR by WIRED Projects
<img width="1381" height="475" alt="image" src="https://github.com/user-attachments/assets/6281a492-2d9b-4a31-89c5-fd6da285f884" />

MonSTAR is a digital platform where Monash University students can come together and share their experiences in subjects they've completed.

We also have the full history of SETU results up until Semester 1 of 2025.

## Project Setup & Development:

### Environment-Based Configuration
This project now uses a unified environment-based configuration system. The `DEVELOPMENT` environment variable controls whether the application runs in development or production mode:

- **Development Mode** (`DEVELOPMENT=true`): Backend enables CORS, frontend uses full URLs to backend
- **Production Mode** (`DEVELOPMENT=false`): Backend serves static frontend files, frontend uses relative URLs

### Prerequisites
Ensure you have the following installed:
- Angular (v18.2.14)
- Node.js (v20.15.1 or higher)
- MongoDB

### Installation Steps
1. Install Angular Globally:
```shell
npm i -g @angular/cli@18
```

2. Install dependencies for all projects from root:
```shell
npm install
cd frontend && npm i --legacy-peer-deps
cd ../backend && npm i
```

3. Create an `.env` file in the `backend/.` directory and add the variables shown in `.env.template`. You may need to create your own Cloudinary account (used for profile pictures) for an API key.

4. Populate your MongoDB with units data:
```shell
# Copy the JSON from backend/scraper/processed_units.json
# POST to localhost:8080/api/v1/units/create-bulk
```

5. (Optional) Populate SETU data:
```shell
# Copy the JSON from backend/scraper/setu_data_2019_2024.json
# POST to localhost:8080/api/v1/setus/create-bulk
```

### Development Commands

#### Easy Development Setup (Recommended)
```shell
# Runs both frontend and backend in development mode
npm run dev
```

#### Manual Development Setup
```shell
# Terminal 1: Backend in development mode (with CORS)
npm run dev:backend

# Terminal 2: Frontend development server
npm run dev:frontend
```

#### Production Setup
```shell
# Build frontend for production
npm run build

# Start backend in production mode (serves static files)
npm run start:prod
```

### Branch Strategy
- **Single Branch**: Use `main` branch for both development and production
- **Environment Variable**: Set `DEVELOPMENT=true` for development, `DEVELOPMENT=false` for production
- **No More Branch Conflicts**: No need to maintain separate `develop` and `main` branches

## Contributors
- **WIRED Projects Team Members**: Collaborating to bring this web application to life.
- **Sai Kumar Murali Krishnan**: Contributed the [monash-handbook-scraper](https://github.com/saikumarmk/monash-handbook-scraper), a vital tool for gathering information about all Monash University units for our database. 

## Tech Stack
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Frontend:** Angular
- **Storage Bucket for Profile Pictures:** Cloudinary
- **Deployment:** Akamai

---

## Contact
For questions or support with development, please contact jenul15ferdinand@gmail.com
