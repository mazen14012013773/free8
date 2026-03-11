# Freelance Marketplace Platform

A full-stack freelance marketplace platform similar to Fiverr, built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

### Authentication
- User registration with role selection (Client/Freelancer)
- JWT-based authentication
- Login/Logout functionality
- Protected routes

### User Profiles
- Profile picture upload
- Bio and skills management
- Portfolio showcase
- Education and experience
- Ratings and reviews

### Services (Gigs)
- Create, edit, and delete services
- Multiple pricing packages (Basic, Standard, Premium)
- Service categories and tags
- Image uploads
- Search and filter functionality

### Orders
- Place orders on services
- Order status tracking (pending, active, delivered, revision, completed, cancelled)
- Delivery management with file attachments
- Revision requests
- Order messaging

### Reviews
- Client can rate and review freelancers
- Average rating calculation
- Review responses from freelancers
- Helpful review marking

### Messaging
- Real-time chat between users
- Socket.io integration
- Conversation management
- Unread message notifications

### Admin Dashboard
- User management (activate/deactivate, role changes)
- Service management (approve/suspend)
- Order overview
- Report management
- Platform analytics

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui components
- React Router for routing
- Axios for API calls
- Socket.io-client for real-time features

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time messaging
- Multer for file uploads
- Express Validator for validation

## Project Structure

```
freelance-marketplace/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, validation, upload middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── socket/          # Socket.io handlers
│   ├── scripts/         # Database seeding
│   ├── uploads/         # Uploaded files
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React contexts (Auth, Socket)
│   │   ├── hooks/       # Custom hooks
│   │   ├── layouts/     # Page layouts
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   ├── types/       # TypeScript types
│   │   ├── App.tsx      # Main app component
│   │   └── main.tsx     # Entry point
│   ├── index.html
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd freelance-marketplace
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Make sure to set:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (a secure random string)
# - FRONTEND_URL (http://localhonpm run seedst:5173 for development)

# Seed the database with sample data (optional)
npm run seed

# Start the development server
npm run dev
```

The backend will run on http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start the development server
npm run dev
```

The frontend will run on http://localhost:5173

## Demo Accounts

After seeding the database, you can use these accounts:

| Role      | Email                     | Password       |
|-----------|---------------------------|----------------|
| Admin     | admin@freelance.com       | Admin123!      |
| Client    | client@example.com        | Client123!     |
| Freelancer| freelancer@example.com    | Freelancer123! |
| Freelancer| developer@example.com     | Dev123!        |
| Freelancer| writer@example.com        | Writer123!     |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/profile-picture` - Upload profile picture
- `GET /api/users/freelancers` - List freelancers

### Services
- `GET /api/services` - List services
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service (freelancer only)
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order (client only)
- `PUT /api/orders/:id/accept` - Accept order (freelancer)
- `PUT /api/orders/:id/deliver` - Deliver order (freelancer)
- `PUT /api/orders/:id/complete` - Complete order (client)
- `PUT /api/orders/:id/cancel` - Cancel order

### Reviews
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review (client only)
- `PUT /api/reviews/:id/response` - Add response (freelancer)

### Messages
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/conversations/:id/messages` - Get messages
- `POST /api/messages` - Send message

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/services` - List all services
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/reports` - List reports

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/freelance_marketplace
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in the `dist` folder.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@freelancehub.com or join our Slack channel.