# Cake Ordering Platform

## Overview
A full-stack cake ordering platform built with React frontend and Express backend, featuring customizable cakes, photo cake options, admin dashboard, and delivery management.

## Recent Changes
- **2025-01-22**: Successfully completed migration from Replit Agent to standard Replit environment - PostgreSQL database created and configured, schema pushed with all tables, database seeded with comprehensive dummy data, all services operational on localhost:5000, user registration API working correctly with proper validation, email notifications functional
- **2025-01-19**: Updated admin email from admin@cakesbuy.com to online.cakesbuy@gmail.com - changed in seed files, dummy data, push notification VAPID settings, and updated existing admin user in database
- **2025-01-19**: Fixed reminder title update issue - backend now properly handles title field when updating reminders, custom titles save and update correctly
- **2025-01-19**: Added comprehensive sorting logic for delivery date and other columns - implemented dropdown controls for sorting by Order Date/Delivery Date/Amount/Status/Order Number, added ascending/descending toggle button with arrow indicators, made column headers clickable with visual sort indicators, backend supports all sorting parameters with proper database queries, pagination display updated to show "Showing X to Y of Z" format in title
- **2025-01-19**: Implemented pagination in admin orders section - added search functionality by order number/status/payment status, paginated display with 10 orders per page, uses dedicated paginated API endpoint for better performance, includes navigation controls and result count display
- **2025-01-19**: Added 25 dummy orders for pagination testing - created comprehensive test data with various order statuses, payment methods, delivery dates, and random customer information to validate pagination functionality in admin dashboard
- **2025-01-19**: Enhanced reminder email functionality - fixed database sent count increment error, improved date formatting to show "20 July" instead of "07-20", added event title support for personalized messages like "daughter's bday", updated email subjects and content to include "Don't forget" messaging for better user engagement
- **2025-01-19**: Fixed admin reminder display and coupon selection - corrected backend filtering to show only upcoming events within 15 days sorted by nearest date first, resolved field name mapping issues between frontend and backend, fixed NaN discount percentage issue by properly parsing coupon discount values and types, admin panel now displays complete event information correctly
- **2025-01-19**: Fixed admin reminder management - corrected date parsing logic to handle both YYYY-MM-DD and MM-DD formats, upcoming reminders now display correctly in admin panel for events within next 15 days
- **2025-01-19**: Successfully migrated project from Replit Agent to standard Replit environment - database connectivity established, schema migrated, application running on localhost:5000
- **2025-01-19**: Enhanced reminder management system - added sent counter tracking, manual delete options, integrated existing discount coupons from coupons section, improved UI with coupon selection dropdown and preview, filtered to show only events upcoming in next 15 days for focused management, sorted occasions by nearest date first in both admin and customer interfaces
- **2025-01-19**: Added image field to addons table for single primary image support (in addition to existing images array)
- **2025-01-19**: Enhanced checkout order summary to display detailed addon information including names, quantities, custom inputs, and individual pricing
- **2025-01-19**: Updated checkout page - removed payment method selection, set PhonePe as default, changed button text to "Make Payment"
- **2025-01-19**: Added image column to admin addon table - admins can now see uploaded images in the management interface
- **2025-01-19**: Fixed addon image display in customer selection modal - uploaded images now display instead of placeholder
- **2025-01-19**: Fixed form validation for addon images - now properly accepts both URLs and media library file paths
- **2025-01-19**: Added complete media management system - admins can upload, browse, and manage images through dedicated media library
- **2025-01-19**: Enhanced addon forms with media picker - admins can select images from media library or enter URLs directly
- **2025-01-19**: Added image field to addon schema and admin forms - admins can now add image URLs when creating/editing addons
- **2025-01-19**: Migration to Replit completed successfully - all services operational with database connectivity
- **2025-01-19**: Added 3 sample orders with various addon combinations for testing and demonstration
- **2025-01-19**: Updated vendor dashboard to full width display with admin-set vendor pricing - vendors now see their assigned prices instead of original customer prices, with proper addon pricing calculations
- **2025-01-19**: Successfully completed migration from Replit Agent to standard Replit environment - all services operational
- **2025-01-19**: Enhanced vendor dashboard with addon images and improved layout - vendors can now see visual references for all addons
- **2025-01-19**: Added images field to addons schema and enriched order data to include addon images from database
- **2025-01-19**: Improved order item cards with better visual design, color-coded details, and enhanced addon display sections
- **2025-01-19**: Fixed vendor panel accordion React error - delivery address object now properly formatted as text
- **2025-01-19**: Fixed email layout to display cake price next to product name instead of at bottom for better clarity
- **2025-01-19**: Enhanced order confirmation emails to include complete addon details (name, quantity, custom input, prices)
- **2025-01-19**: Fixed user registration welcome email issue by updating remaining static sendWelcomeEmail imports to dynamic imports
- **2025-01-19**: User registration now fully functional with proper welcome email delivery and ₹50 wallet bonus
- **2025-01-19**: Fixed Gmail service configuration by installing dotenv and configuring proper environment variable loading
- **2025-01-19**: Converted all static email-service imports to dynamic imports to prevent premature module loading
- **2025-01-19**: Gmail credentials now loading correctly from .env file - email notifications fully operational
- **2025-01-19**: Implemented Gmail notification for vendor order assignments - vendors automatically receive detailed email notifications when orders are assigned to them
- **2025-01-19**: Created comprehensive vendor assignment email template with order details, items, delivery information, and call-to-action buttons
- **2025-01-19**: Added email notification integration to admin vendor assignment route - emails sent automatically upon successful assignment
- **2025-01-19**: Successfully completed migration from Replit Agent to Replit environment
- **2025-01-19**: Created PostgreSQL database and pushed schema with all required tables
- **2025-01-19**: Seeded database with comprehensive dummy data including categories, cakes, addons, users, orders, and navigation items
- **2025-01-19**: Verified application is running successfully on localhost:5000 with all services operational
- **2025-01-18**: Synchronized order status values between vendor and admin panels (changed "ready" to "out_for_delivery")
- **2025-01-18**: Fixed addon display in vendor panel - addons now show with name, quantity, and price

## Project Architecture
- **Frontend**: React with TypeScript, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript, Drizzle ORM for PostgreSQL
- **Database**: PostgreSQL with comprehensive schema for users, cakes, orders, categories, etc.
- **Authentication**: JWT-based with session management
- **File Upload**: Multer for handling image uploads
- **Notifications**: Email (Nodemailer), WhatsApp (demo mode), Push notifications

## Key Features
- Cake browsing and customization
- Photo cake designer with image positioning
- Shopping cart and checkout
- Order tracking and management
- Admin dashboard for order management
- Delivery dashboard for drivers
- Loyalty program and wallet system
- Multi-role authentication (customer, admin, vendor, delivery)

## User Preferences
- Clean, professional communication style
- Focus on functionality over excessive explanations
- Prompt removal of unnecessary files when requested

## Technical Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Wouter routing
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **File Handling**: Multer for uploads