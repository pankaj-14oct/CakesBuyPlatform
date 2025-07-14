# CakesBuy - Local Development Setup

## Prerequisites

1. **Node.js 20 or higher** - Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL** - Install locally or use a cloud service like Neon, Supabase, or PlanetScale
3. **Git** - For cloning the repository

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
# Clone your repository (replace with your actual repo URL)
git clone <your-repo-url>
cd cakesbuy

# Install dependencies
npm install
```

### 2. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL on your system
# Create a database
createdb cakesbuy_dev

# Set your DATABASE_URL
export DATABASE_URL="postgresql://username:password@localhost:5432/cakesbuy_dev"
```

**Option B: Cloud Database (Recommended)**
- Sign up for [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)
- Create a new database
- Copy the connection string

### 3. Environment Variables

Create a `.env` file in your root directory:

```env
# Database
DATABASE_URL="your_postgresql_connection_string"

# Email Service (Optional - for order notifications)
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="your_app_password"

# JWT Secret
JWT_SECRET="your_super_secret_jwt_key_here"

# Push Notifications (Optional - for delivery boys)
VAPID_PUBLIC_KEY="your_vapid_public_key"
VAPID_PRIVATE_KEY="your_vapid_private_key"
VAPID_EMAIL="mailto:your_email@example.com"
```

### 4. Database Migration

```bash
# Push the database schema
npm run db:push
```

### 5. Start the Application

```bash
# Development mode (includes hot reload)
npm run dev

# Alternative: If you get WebSocket errors, use this instead
node start-local.js

# Or set the environment variable manually
DISABLE_WEBSOCKET=true npm run dev

# Production build and start
npm run build
npm run start
```

### 6. Access the Application

- **Frontend**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin-login
  - Phone: 1111111111
  - Password: password123

## Project Structure

```
cakesbuy/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities
├── server/               # Express backend
│   ├── routes.ts         # API routes
│   ├── db.ts             # Database connection
│   ├── auth.ts           # Authentication
│   └── storage.ts        # Database operations
├── shared/
│   └── schema.ts         # Database schema
└── uploads/              # File uploads (images)
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

## Features Included

✅ **Customer Features**
- Browse cakes by category
- Photo cake customization
- Shopping cart with addons
- User authentication
- Address management
- Order tracking
- Wallet system with rewards
- Occasion reminders

✅ **Admin Features** 
- Product management
- Order management
- User management
- Analytics dashboard
- Email notifications

✅ **Delivery System**
- Delivery boy management
- Real-time order assignment
- Push notifications
- PWA for delivery dashboard

## Troubleshooting

**WebSocket/Network Error (Error: listen ENOTSUP):**
- This is a WebSocket or network binding compatibility issue in some local environments
- The app will still work without WebSocket features (real-time notifications)
- **Quick Fix Option 1**: Run `node start-local-simple.js` (recommended for local dev)
- **Quick Fix Option 2**: Run `node start-local.js` instead of `npm run dev`
- **Quick Fix Option 3**: Run `DISABLE_WEBSOCKET=true npm run dev`
- **For Windows users**: Set the environment variable first: `set DISABLE_WEBSOCKET=true && npm run dev`

**Database Connection Issues:**
- Verify your DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall settings

**Email Not Working:**
- Gmail requires App Passwords (not regular password)
- Enable 2FA and generate App Password in Google Account settings

**Port Already in Use:**
- Kill the process using port 5000: `lsof -ti:5000 | xargs kill -9`
- Or change the port in server/index.ts

**Build Errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20+)

## Production Deployment

The app is optimized for Replit Deployments but can be deployed to:
- Vercel
- Netlify
- Railway
- DigitalOcean App Platform
- Heroku

Make sure to set all environment variables in your hosting platform.