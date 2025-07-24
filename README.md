# MonSTAR by WIRED Projects
<img width="1381" height="475" alt="image" src="https://github.com/user-attachments/assets/6281a492-2d9b-4a31-89c5-fd6da285f884" />

MonSTAR is a digital platform where Monash University students can come together and share their experiences in subjects they've completed.

We also have the full history of SETU results up until Semester 1 of 2025.

## Project Setup & Development:
### Contribution Tips
You can fork this repository and start working on your feature, make sure that you work in the `develop` branch. Since the `main` branch is for production.

### Prerequisites
Ensure you have the following installed:
- Angular (v18.2.14)
- Node.js (v20.15.1 or higher)
- MongoDB

### Deployment Setup/Installation Steps
1. Install Angular Globally:
```shell
npm i -g @angular/cli@18
```
2. Navigate to frontend directory and install packages
```shell
cd frontend
npm i --legacy-peer-deps
```
3. Navigate to backend directory and install packages
```shell
cd backend
npm i
```
4. Create an `.env` file in the `backend/.` directory and add the variables shown in `.env.template`. You may need to create your own Cloudinary account (used for profile pictures) for an API key.
5. For the webapp to work as intended you'll need to populate your MongoDB (local or atlas) with the units, copy and paste the json from the `backend/scraper/processed_units.json` file and run the `POST localhost:8080/api/v1/units/create-bulk` endpoint to populate your database with the units.
6. (Optional) If you would like to see the SETU results as well, you'll need to populate your database with the SETU data, you can copy and paste the json from the `backend/scraper/setu_data_2019_2024.json` file and run the `POST localhost:8080/api/v1/setus/create-bulk` endpoint to populate your database with the SETU data.
5. Start the frontend app and backend server. Then you can start contributing!
```
cd frontend
ng serve
cd backend
node server.js
```

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
