# 👥 Contributing to MonSTAR

Contributions are welcome, monash uni students preferred.

## 🚀 Getting Started with Dev

### Prerequisites

Make sure you have these node.js, angular, and mongodb installed.

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
   cd frontend && npm install
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

### Development commands

```shell
# Development
cd backend && node server.js # Starts backend server at localhost:8080
cd frontend && ng serve # Starts frontend server at localhost:4200

# If can use make
make dev # Starts both backend and frontend servers

# Production build (remember to set DEVELOPMENT=false in .env)
cd frontend && ng build
cd backend && node server.js
```

### Development modes

**Development Mode** (`DEVELOPMENT=true`):
- Backend enables CORS for frontend communication
- Frontend uses full URLs to connect to backend
- Hot reloading for both frontend and backend

**Production Mode** (`DEVELOPMENT=false`):
- Backend serves static frontend files
- Frontend uses relative URLs
- Optimized builds for performance

## 📝 Contribution Guidelines

### Code style
- Follow existing code conventions in the project
- Use meaningful variable and function names
- Comment complex logic where necessary

### Commit messages
- Use [conventional commit messages](https://gist.github.com/Zekfad/f51cb06ac76e2457f11c80ed705c95a3)
- A `commit-msg` git hook enforces this locally — enable it with `make hooks` (or `make install`, which runs it for you).

### Pull Request Process

1. **Create a Branch**
   ```shell
   git switch -c thisisabranch
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Test your changes

3. **Submit a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots for UI changes

### What you can add to this project

- **Bug Fixes**: Help us squash those pesky bugs
- **Feature Enhancements**: Improve existing functionality
- **New Features**: Add value for Monash students (contact jenul15ferdinand@gmail.com first, let's chat about it)
- **Documentation**: Help others understand and contribute
- **Performance Improvements**: Make MonSTAR faster and more efficient

## 🤝 Guidelines

- **Be Respectful**: We're all here to learn and improve
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Remember that we're all volunteers with other commitments
- **Have Fun**: Building something great for fellow students should be enjoyable!

## 📞 Support

If you have questions about contributing or need help getting started:

- **Open an Issue**: Use GitHub issues for questions or discussions
- **Contact Us**: Reach out to `jenul15ferdinand@gmail.com`

---

*Thank you for helping make MonSTAR better for the Monash community! 🎓*