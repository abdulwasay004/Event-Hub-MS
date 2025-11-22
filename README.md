# Event Hub - Full-Stack Event Management System

A comprehensive full-stack event management system built with Node.js, Express, React, and PostgreSQL. This project demonstrates BCNF database normalization and includes role-based authentication with features for administrators, organizers, and attendees.

## 🚀 Features

### For All Users
- **Authentication**: Secure session-based login and registration
- **Event Discovery**: Browse and search events by category, date, location
- **User Profiles**: Manage personal information and preferences
- **Responsive Design**: Modern UI built with React and TailwindCSS

### For Attendees
- **Event Booking**: Register for events with secure payment processing
- **Booking Management**: View and cancel bookings
- **Event Reviews**: Rate and review attended events
- **Ticket Management**: Digital tickets with QR codes

### For Organizers
- **Event Creation**: Create and manage events with detailed information
- **Attendee Management**: View registered attendees and their details
- **Analytics Dashboard**: Track event performance and bookings
- **Revenue Tracking**: Monitor ticket sales and payments

### For Administrators
- **System Overview**: Comprehensive dashboard with platform statistics
- **User Management**: Manage user accounts, roles, and permissions
- **Event Moderation**: Approve and monitor all events on the platform
- **Payment Management**: Handle refunds and resolve payment issues

## 🏗️ Architecture

### Backend (Node.js + Express)
- RESTful API design with proper error handling
- Session-based authentication with role-based access control
- BCNF normalized PostgreSQL database with 10 tables
- Middleware for authentication, logging, and validation
- Comprehensive API endpoints for all entities

### Frontend (React + TailwindCSS)
- Component-based architecture with React hooks
- Context API for state management
- Responsive design with TailwindCSS
- Axios for API communication
- Protected routes based on user roles

### Database (PostgreSQL)
- **BCNF Normalized Schema** with 10 tables:
  - Users, Events, Bookings, Tickets, Reviews
  - Venues, Payments, Categories, Notifications, Event_Images
- Proper foreign key constraints and indexes
- Triggers for automatic timestamp updates
- Sample data for testing and development

## 📋 Prerequisites

Before running this project, make sure you have the following installed:
- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd eventhub
```

### 2. Database Setup
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE eventhub;

# Connect to the database
\c eventhub

# Run the schema script
\i database/schema.sql

# Insert sample data
\i database/seed_data.sql
```

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials
# Update the following variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=eventhub
# DB_USER=your_username
# DB_PASSWORD=your_password
# SESSION_SECRET=your_very_long_random_secret_key
```

### 4. Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

## 🚀 Running the Application

### Start the Backend Server
```bash
# From the backend directory
cd backend
npm start

# The server will run on http://localhost:5000
```

### Start the Frontend Application
```bash
# From the frontend directory
cd frontend
npm start

# The application will run on http://localhost:3000
```

### Development Mode
For development with hot reload:
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm start
```

## 📁 Project Structure

```
eventhub/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── validation.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User management
│   │   ├── events.js           # Event management
│   │   ├── bookings.js         # Booking system
│   │   ├── tickets.js          # Ticket management
│   │   ├── reviews.js          # Review system
│   │   ├── venues.js           # Venue management
│   │   ├── payments.js         # Payment processing
│   │   ├── notifications.js    # Notification system
│   │   └── organizer.js        # Organizer-specific routes
│   ├── .env.example            # Environment variables template
│   ├── package.json            # Backend dependencies
│   └── server.js               # Main server file
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Reusable components
│   │   │   ├── layout/         # Layout components
│   │   │   └── auth/           # Authentication components
│   │   ├── context/
│   │   │   └── AuthContext.js  # Authentication context
│   │   ├── pages/
│   │   │   ├── admin/          # Admin dashboard pages
│   │   │   ├── organizer/      # Organizer pages
│   │   │   ├── Home.js         # Landing page
│   │   │   ├── Events.js       # Event listing
│   │   │   ├── Bookings.js     # User bookings
│   │   │   └── Profile.js      # User profile
│   │   ├── services/
│   │   │   └── api.js          # API service layer
│   │   ├── App.js              # Main app component
│   │   └── index.js            # App entry point
│   ├── package.json            # Frontend dependencies
│   └── tailwind.config.js      # TailwindCSS configuration
├── database/
│   ├── schema.sql              # Database schema (BCNF normalized)
│   └── seed_data.sql           # Sample data
└── README.md                   # This file
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event (Organizer/Admin)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (Organizer/Admin)
- `DELETE /api/events/:id` - Delete event (Admin)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Users (Admin only)
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔐 User Roles & Permissions

### Attendee
- Register for events
- Manage bookings
- Write reviews
- Update profile

### Organizer
- All attendee permissions
- Create and manage events
- View attendee lists
- Access analytics dashboard

### Administrator
- All organizer permissions
- Manage all users
- Moderate events
- Access system analytics
- Manage payments and refunds

## 🧪 Sample Data

The database includes sample data for testing:
- **Users**: 3 users with different roles (admin, organizer, attendee)
- **Events**: 5 sample events across different categories
- **Venues**: 3 venues with different capacities
- **Bookings**: Sample bookings and payments
- **Reviews**: Sample reviews for completed events

### Test Credentials
```
Admin User:
Email: admin@example.com
Password: password

Organizer User:
Email: organizer@example.com
Password: password

Attendee User:
Email: attendee@example.com
Password: password
```

## 🛡️ Security Features

- **Session-based Authentication**: Secure session management with httpOnly cookies
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for frontend-backend communication
- **Input Validation**: Comprehensive validation for all inputs
- **SQL Injection Prevention**: Parameterized queries throughout
- **Role-based Access Control**: Middleware for protecting routes

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with TailwindCSS
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Loading States**: Loading indicators for better user experience
- **Error Handling**: User-friendly error messages and validation
- **Accessibility**: Semantic HTML and keyboard navigation support

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database on your server
2. Configure environment variables for production
3. Install dependencies: `npm install`
4. Run database migrations: `psql -d eventhub -f database/schema.sql`
5. Start the server: `npm start`

### Frontend Deployment
1. Build the production version: `npm run build`
2. Serve the build folder using a web server (nginx, Apache)
3. Configure proxy to backend API

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built as a university course project demonstrating full-stack development
- Demonstrates BCNF database normalization principles
- Showcases modern web development best practices
- Implements comprehensive authentication and authorization

---

**Note**: This is a demonstration project for educational purposes. For production use, additional security measures, testing, and optimizations should be implemented.