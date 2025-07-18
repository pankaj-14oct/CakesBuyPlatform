# Cake Ordering Platform

## Overview
A full-stack cake ordering platform built with React frontend and Express backend, featuring customizable cakes, photo cake options, admin dashboard, and delivery management.

## Recent Changes
- **2025-01-18**: Successfully migrated from Replit Agent to Replit environment
- **2025-01-18**: Set up PostgreSQL database with all required tables
- **2025-01-18**: Configured environment variables and verified all dependencies
- **2025-01-18**: Removed attached_assets folder as requested by user
- **2025-01-18**: Imported dummy data seed with categories, cakes, addons, users, and sample content
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