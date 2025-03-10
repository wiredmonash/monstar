# Development Branch
This branch is for development.

MonSTAR is an online platform designed for Monash University students to browse, review, and share feedback on academic units. Our mission is to help students make informed decisions about their studies by fostering a community of honest respectful, and insightful reviews.

---

## Contributors
- **WIRED Projects Team Members**: Collaborating to bring this web application to life.
- **Sai Kumar Murali Krishnan**: Contributed the [monash-handbook-scraper](https://github.com/saikumarmk/monash-handbook-scraper), a vital tool for gathering information about all Monash University units for our database. 

---

## Project Setup:
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
2. Navigate to the project directory:
```shell
cd monstar
```
3. Navigate to frontend directory and install packages
```shell
cd frontend
npm i --legacy-peer-deps
```
4. Navigate to backend directory and install packages
```shell
cd ..
cd backend
npm i
```
4. Create a `.env` file in the `backend/.` directory and add the following variables:
```shell
MONGODB_CONN_STRING='mongodb+srv://wired:wired123@unit-review.sdij9.mongodb.net/dev_test?retryWrites=true&w=majority&appName=unit-review'
PORT=8080
JWT_SECRET='1e1859169d62ce4dd61400c9036b2c1c96df908b4b670ad8fb6f247ff6557d84'

EMAIL_USERNAME=monstarapp@gmail.com
EMAIL_PASSWORD=zieycfirwdraaith
FRONTEND_URL=http://localhost:4200

CLOUDINARY_CLOUD_NAME='dd1a4cx9e'
CLOUDINARY_API_KEY='937851319752153'
CLOUDINARY_API_SECRET='qZ6riJThQ3_zi03vjwtaXOSUaJE'
CLOUDINARY_URL='cloudinary://937851319752153:qZ6riJThQ3_zi03vjwtaXOSUaJE@dd1a4cx9e'

GOOGLE_CLIENT_ID='671526426147-a16p1qi3iq3mtf672f7ka5hlpq8mvl3d.apps.googleusercontent.com'
```
5. Start the app
```
cd frontend
ng serve
cd backend
node server.js
```
---

## Project Structure
```
monstar/
├── backend/               # Contains server-side code
├── frontend/              # Contains client-side code
└── README.md              
```

---

## Tech Stack
- Backend: Node.js, Express
- Cloud Database: MongoDB
- Frontend: Angular.js
- Cloud Storage (profile pictures): Cloudinary
- Deployment: Linode

---

## Contact
For questions or support with development, please contact jenul15ferdinand@gmail.com