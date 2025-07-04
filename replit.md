# CakesBuy - E-commerce Cake Ordering Platform

## Overview

CakesBuy is a specialized full-stack e-commerce platform for ordering 100% eggless cakes online in Gurgaon. The application provides a comprehensive cake ordering system focused exclusively on egg-free products, featuring category browsing, product customization, shopping cart functionality, and order management. Built as a modern web application with React frontend and Express backend, it offers contactless online delivery with same-day delivery options for vegetarian and health-conscious customers.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: React Context API for cart management, React Query for server state
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom color scheme (caramel, brown, pink themes)
- **Build Tool**: Vite for development and production builds
- **Authentication**: JWT token-based with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with organized route handlers
- **Development**: Hot reload with tsx for development server
- **Authentication**: JWT-based with bcrypt password hashing
- **Email Service**: Gmail SMTP with nodemailer integration
- **Admin System**: Role-based access control with dedicated admin routes

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **Database Provider**: Replit PostgreSQL (configured via DATABASE_URL)
- **Session Management**: JWT tokens with localStorage persistence
- **Password Security**: bcrypt hashing with salt rounds

## Key Components

### Database Schema
The application uses a comprehensive database schema with the following main entities:

1. **Users**: Customer information with role-based access (customer/admin), loyalty program integration, password hashing
2. **Categories**: Cake categories with slugs and metadata for product organization
3. **Cakes**: Product catalog with pricing, customization options, delivery settings, and eggless specifications
4. **Orders**: Complete order management with status tracking, payment integration, and email notifications
5. **Addons**: Additional items (candles, cards, flowers) with pricing and availability
6. **Reviews**: Customer feedback system with rating capabilities
7. **Delivery Areas**: Service area management with pincode validation for Gurgaon delivery zones
8. **Promo Codes**: Discount management system with usage tracking and expiration dates
9. **Event Reminders**: Birthday/anniversary tracking with automated email notifications
10. **Loyalty Rewards**: Points-based reward system with tier management and redemption tracking

### Frontend Components
- **Layout Components**: Header with navigation, Footer with contact info
- **Product Components**: CakeCard for product display, CategoryCard for navigation
- **Cart System**: Context-based cart management with persistence
- **UI Components**: Complete shadcn/ui component library implementation

### API Endpoints
- **GET /api/categories**: Category listing and individual category retrieval
- **GET /api/cakes**: Product catalog with filtering (category, eggless, bestseller, search)
- **Order Management**: Create orders, track status, user order history, status updates with email notifications
- **Addon System**: Additional product options with pricing and availability
- **Delivery**: Area validation and delivery options for Gurgaon pincodes
- **Reviews**: Product review system with rating capabilities
- **Authentication**: User registration, login, JWT token management, forgot password with OTP
- **Admin Routes**: Protected admin panel access with role-based authentication
- **Loyalty System**: Points earning, tier management, reward redemption
- **Event Reminders**: Birthday/anniversary tracking with automated notifications
- **Profile Management**: User profile updates, address management, order history
- **Email Service**: Test email functionality, order confirmations, welcome emails

## Data Flow

### Customer Journey
1. **Browse**: Categories → Product listing → Product details
2. **Customize**: Select weight, flavor, add custom message/image, choose addons
3. **Cart**: Add to cart, modify quantities, apply promo codes
4. **Checkout**: Address selection, delivery scheduling, payment method selection
5. **Order**: Confirmation, tracking, reviews

### State Management
- **Client State**: Cart items, user preferences, UI state (React Context + useState)
- **Server State**: Product catalog, categories, orders (React Query)
- **Form State**: React Hook Form with Zod validation

### Real-time Updates
- Cart updates with immediate UI feedback
- Order status tracking
- Delivery area validation

## External Dependencies

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon system
- **Class Variance Authority**: Component variant management

### Data and Forms
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **Date-fns**: Date manipulation

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Build tool with hot reload
- **ESBuild**: Production bundling for backend
- **Drizzle Kit**: Database schema management

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20, PostgreSQL 16
- **Hot Reload**: Vite dev server with backend proxy
- **Database**: Replit PostgreSQL with automatic connection management
- **Port Configuration**: Backend on 5000, proxied through Vite
- **Email Service**: Gmail SMTP with nodemailer integration
- **Authentication**: JWT tokens with bcrypt password hashing
- **Admin Access**: Role-based authentication with dedicated admin user

### Production Build
- **Frontend**: Vite build to static assets
- **Backend**: ESBuild bundle for Node.js deployment
- **Deployment Target**: Replit Autoscale
- **Environment**: Production mode with optimized builds

### Build Commands
- **Development**: `npm run dev` (runs tsx server with Vite)
- **Production Build**: `npm run build` (Vite + ESBuild)
- **Production Start**: `npm run start` (Node.js production server)
- **Database**: `npm run db:push` (Drizzle schema deployment)

### Configuration
- **TypeScript**: Strict mode with path mapping for imports
- **Module System**: ES modules throughout the stack
- **Asset Handling**: Vite for frontend, Express static serving for production

## Changelog
- June 25, 2025. Initial setup  
- June 25, 2025. JWT authentication system implemented with login/signup
- June 25, 2025. Multiple address management system added for authenticated users
- June 25, 2025. PostgreSQL database integration completed with persistent data storage
- July 1, 2025. Successfully migrated from Replit Agent to standard Replit environment
- July 1, 2025. Enhanced homepage with Bakingo.com-inspired sections: Quick Category Access, "Gurgaon Loves" bestsellers, Special Occasions grid, Delivery Promise section, Why Choose Us section
- July 1, 2025. Rebranded to CakesBuy - Complete transformation to focus on 100% eggless cake specialty shop with online delivery emphasis
- July 1, 2025. Added admin settings with dummy data management (25 products, 10 categories, 10 users, 5 orders)
- July 1, 2025. Implemented birthday and anniversary tracking system with automated event reminders sent one week prior to special occasions
- July 1, 2025. Migrated authentication system to mobile number-based login and registration, removing username field for simplified user experience
- July 1, 2025. Enhanced delivery address management with three address types: Home, Work, and Other - includes complete address forms with validation and CRUD operations
- July 2, 2025. Implemented comprehensive loyalty program system with points earning (1 point per ₹10 spent), tier system (Bronze/Silver/Gold/Platinum), and reward redemption with 8 default rewards
- July 2, 2025. Added complete orders history and tracking system with detailed order views, status filtering, search functionality, and comprehensive order information display
- July 2, 2025. Merged checkout delivery details with profile address management - users can now select from saved addresses or create new ones during checkout, with seamless integration between guest and authenticated user experiences
- July 2, 2025. Implemented pincode delivery checking feature with 16 specific Gurgaon delivery areas (122001-122007, 122009, 122011-012, 122015-018, 122051-052), including comprehensive delivery page and header pincode validator
- July 2, 2025. Fixed duplicate order status display in orders page - removed redundant payment status badge from order list view to prevent confusion when both order and payment status are the same
- July 2, 2025. Implemented comprehensive email reminder system for customer special dates - customers can enter birthday/anniversary dates in profile, admin panel manages reminder campaigns with discount codes, SendGrid integration for professional email delivery with customizable templates and automatic reminder scheduling
- July 2, 2025. Enhanced authentication and cart persistence - users stay logged in after page refresh using localStorage token persistence and proper authentication verification, cart data persists across browser sessions using localStorage with automatic restore on page load
- July 2, 2025. Implemented comprehensive email notification system for orders - SendGrid integration for professional order confirmation emails and status update notifications, guest checkout includes optional email field for non-authenticated users, automatic emails sent for order placement and all status changes (confirmed, preparing, out for delivery, delivered)
- July 3, 2025. Successfully migrated from Replit Agent to standard Replit environment - Fixed authentication persistence issues by updating JWT token generation and verification to use phone numbers instead of usernames, users now stay logged in across page refreshes and server restarts using localStorage token persistence
- July 3, 2025. Migrated email service from SendGrid to Gmail SMTP using order.cakesbuy@gmail.com - Configured nodemailer for reliable email delivery, added welcome/congratulations email for new user registrations with account details and platform benefits
- July 3, 2025. Added forgot password feature with OTP verification - Users can reset their passwords using phone number verification, includes two-step process with OTP sending and password reset functionality, integrated with existing authentication system
- July 3, 2025. Created comprehensive occasion reminder page with exclusive offers system - Users can save special dates (birthdays, anniversaries) to receive ₹750 worth of exclusive offers, includes modern UI with calendar illustrations, how-it-works section, benefits explanation, and reminder management with add/delete functionality
- July 4, 2025. Added email service testing feature to admin settings panel - Administrators can now test email functionality by sending test emails to verify Gmail SMTP configuration, includes professional test email template with system information and timestamp
- July 4, 2025. Implemented super admin authentication system - Added role-based access control with dedicated admin user (admin@cakesbuy.com / 1111111111), created secure admin login page at /admin-login, implemented admin middleware protection for all admin routes, users must authenticate as admin to access admin panel functionality
- July 4, 2025. Successfully completed migration from Replit Agent to standard Replit environment - Set up PostgreSQL database with proper schema migrations, created admin user with secure authentication, configured Gmail SMTP email service, verified all features working properly with robust security practices and client/server separation
- July 4, 2025. Complete rebranding from EgglessCakes to CakesBuy - Updated all branding across the application including HTML titles, email templates, user interface text, and documentation while maintaining the "100% Eggless Cake Shop" identity throughout all customer communications

## User Preferences

Preferred communication style: Simple, everyday language.