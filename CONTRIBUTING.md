# 👥 Contributing to MonSTAR

We welcome contributions from the Monash community! Whether you're fixing bugs, adding features, or improving documentation, your help makes MonSTAR better for everyone.

## 🎯 Development Philosophy

- **Single Branch Strategy**: We use `main` for both development and production
- **Environment-Based Configuration**: No more branch conflicts or complicated deployments
- **Student-First**: Every feature should benefit the student experience

## 🚀 Getting Started with Development

### Prerequisites

Make sure you have these installed:
- Node.js (v20.15.1 or higher)
- Angular CLI (v18.2.14)
- MongoDB

### Setup Instructions

1. **Fork and Clone**
   ```shell
   git clone https://github.com/your-username/monstar.git
   cd monstar
   ```

2. **Install Dependencies**
   ```shell
   # Install Angular globally
   npm install -g @angular/cli@18

   # Install all project dependencies
   npm install
   cd frontend && npm install --legacy-peer-deps
   cd ../backend && npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the `backend/` directory using `.env.template` as your guide. You'll need:
   - MongoDB connection string
   - Cloudinary API credentials (for profile pictures)

4. **Database Setup**
   ```shell
   # Populate units data
   # POST the JSON from backend/scraper/processed_units.json to localhost:8080/api/v1/units/create-bulk

   # (Optional) Add SETU data
   # POST the JSON from backend/scraper/setu_data_2019_2024.json to localhost:8080/api/v1/setus/create-bulk
   ```

## 🛠️ Development Workflow

### Development Commands

```shell
# Development
cd backend && node server.js # Starts backend server at localhost:8080
cd frontend && ng serve # Starts frontend server at localhost:4200

# Production build (remember to set DEVELOPMENT=false in .env)
cd frontend && ng build
cd backend && node server.js
```

### Development Modes

**Development Mode** (`DEVELOPMENT=true`):
- Backend enables CORS for frontend communication
- Frontend uses full URLs to connect to backend
- Hot reloading for both frontend and backend

**Production Mode** (`DEVELOPMENT=false`):
- Backend serves static frontend files
- Frontend uses relative URLs
- Optimized builds for performance

## 📝 Contribution Guidelines

### Code Style
- Follow existing code conventions in the project
- Use meaningful variable and function names
- Comment complex logic where necessary

### Commit Messages
- Use clear, descriptive commit messages
- Follow the format: `type: description`
- Examples: `feat: add unit review functionality`, `fix: resolve login authentication issue`

### Pull Request Process

1. **Create a Feature Branch**
   ```shell
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Test your changes thoroughly
   - Ensure all existing tests pass

3. **Submit a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots for UI changes

### What We're Looking For

- **Bug Fixes**: Help us squash those pesky bugs
- **Feature Enhancements**: Improve existing functionality
- **New Features**: Add value for Monash students
- **Documentation**: Help others understand and contribute
- **Performance Improvements**: Make MonSTAR faster and more efficient

## 🤝 Community Guidelines

- **Be Respectful**: We're all here to learn and improve
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Remember that we're all volunteers with other commitments
- **Have Fun**: Building something great for fellow students should be enjoyable!

## 📞 Need Help?

If you have questions about contributing or need help getting started:

- **Open an Issue**: Use GitHub issues for questions or discussions
- **Contact Us**: Reach out to jenul15ferdinand@gmail.com

---

*Thank you for helping make MonSTAR better for the Monash community! 🎓*