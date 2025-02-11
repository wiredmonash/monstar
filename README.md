# MonSTAR
MonSTAR is an online platform designed for Monash University students to browse, review, and share feedback on academic units. Our mission is to help students make informed decisions about their studies by fostering a community of honest respectful, and insightful reviews.

---

## Key Features
- **Comprehensive Unit Database:** Access a complete list of units offered at Monash University.
- **User Reviews:** Write and read reviews to gain valuable insights into unit content, teaching quality, and assessment structure.
- **Community Engagement:** Share your experiences and help others navigate their academic journey.

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

### Installation Steps
1. Clone the repository:
```shell
git clone https://github.com/wiredmonash/monstar.git
```
2. Navigate to the project directory:
```shell
cd monstar
```
3. Install dependencies
```shell
npm install
```
4. Create a `.env` file in the `backend/.` directory and add the following variables:
```shell
MONGODB_CONN_STRING='(mongodb atlas connection string)'
PORT=8080
JWT_SECRET='(secret key for the jwt)'
EMAIL_USERNAME=(email of the account used to send emails)
EMAIL_PASSWORD=(app password from google account)
FRONTEND_URL=(url of the frontend app)

CLOUDINARY_NAME='(name of the cloudinary cloud)'
CLOUDINARY_API_KEY='(api key for the cloudinary account)'
CLOUDINARY_API_SECRET='(secret key for the cloudinary account)'
CLOUDINARY_URL='(full url to the cloudinary)'

GOOGLE_CLIENT_ID='923998517143-95jlbb9v6vi97km61nfod8c3pg754q49.apps.googleusercontent.com'
```
5. Start the application `npm start`

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
- Deployment: EC2 (Amazon Web Services)

---

## Contact
For questions or support with development, please contact jenul15ferdinand@gmail.com
