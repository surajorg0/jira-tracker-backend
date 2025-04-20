# JIRA Tracker Backend API

A Node.js/Express backend API that powers the JIRA Tracker application, providing a complete set of RESTful endpoints for user management, project tracking, bug reporting, and task management.

## Features

### Authentication System
- User registration with validation
- JWT-based authentication
- Role-based access control (admin, teamlead, user)
- User approval workflow

### User Management
- Get all users
- Get pending users awaiting approval
- Approve/reject user registrations
- User profile management

### Projects
- Create, read, update, and delete projects
- Assign projects to users
- Track project status
- Role-based access control for project operations

### Bugs
- Report bugs with severity levels
- Bug status management
- Bug search and filtering
- Delete and update bugs

### Tasks
- Task creation and assignment
- Task priority management
- Task status updates
- Due date management

## Technology Stack

- Node.js
- Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- RESTful API architecture

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user information

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/pending` - Get users awaiting approval (admin only)
- `PUT /api/users/:id/approve` - Approve a user (admin only)
- `PUT /api/users/:id/reject` - Reject a user (admin only)

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get a specific project
- `POST /api/projects` - Create a new project (admin/teamlead)
- `PUT /api/projects/:id` - Update a project (admin/teamlead)
- `DELETE /api/projects/:id` - Delete a project (admin/teamlead)

### Bugs
- `GET /api/bugs` - Get all bugs
- `GET /api/bugs/:id` - Get a specific bug
- `POST /api/bugs` - Report a new bug
- `PUT /api/bugs/:id` - Update a bug
- `DELETE /api/bugs/:id` - Delete a bug (admin/teamlead)

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task (admin/teamlead)
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task (admin/teamlead)

## Setup and Installation

1. Ensure you have Node.js (v18 or later) and MongoDB installed
2. Clone this repository
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/jira-tracker
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```
5. Start the server:
   ```
   npm start
   ```
   or for development with nodemon:
   ```
   npm run dev
   ```
6. The API will be available at `http://localhost:5000`

## Project Structure

- `/controllers` - Request handlers for each route
- `/models` - Mongoose schema definitions
- `/routes` - Express router configurations
- `/middleware` - Custom middleware for authentication and authorization
- `/config` - Configuration files
- `/utils` - Utility functions

## Future Development

Check the `jira-tracker-status.txt` file for planned features and development priorities. 