n# AI Expense Tracker - Setup & Usage Guide

## 🎯 Overview

AI Expense Tracker is a full-stack expense management application built with Next.js 16, React 19, TypeScript, and Tailwind CSS. It features AI-powered automatic expense categorization, budget management, and expense tracking.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI categorization features)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create a `.env.local` file in the project root with the following:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# App Configuration
NEXT_PUBLIC_APP_NAME=AI Expense Tracker
```

### 3. Setup Database

Initialize the Prisma database:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the SQLite database
- Run all migrations
- Generate Prisma Client

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
nextjs-boilerplate/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── expenses/          # Expense CRUD endpoints
│   │   ├── categories/        # Category management
│   │   ├── tags/              # Tag management
│   │   ├── ai/                # AI features (categorization, summaries)
│   │   ├── budget/            # Budget alerts
│   │   └── export/            # CSV export
│   ├── dashboard/             # Dashboard page
│   ├── expenses/              # Expenses management page
│   ├── categories/            # Categories management page
│   ├── login/                 # Authentication pages
│   ├── register/
│   └── layout.tsx             # Root layout
├── components/
│   ├── Dashboard.tsx          # Dashboard components
│   └── ExpenseForm.tsx        # Expense form & list
├── lib/
│   ├── db.ts                  # Prisma client
│   ├── auth.ts                # NextAuth configuration
│   ├── api.ts                 # API utilities
│   ├── ai.ts                  # AI service (OpenAI)
│   ├── validations.ts         # Zod validation schemas
│   └── types.ts               # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
└── public/                    # Static assets
```

## 🔐 Authentication

The application uses NextAuth.js with credential-based authentication.

### Register
- Navigate to `/register`
- Enter email, name, and password
- Password is hashed with bcryptjs

### Login
- Navigate to `/login`
- Enter email and password
- Session is managed by NextAuth.js

### Session Management
- Protected routes check for valid session
- API routes require authentication

## 💰 Expense Management

### Create Expense
1. Go to Dashboard
2. Fill in expense details:
   - Name (required)
   - Amount (required)
   - Date (required)
   - Category (required)
   - Description (optional)
   - Location (optional)
   - Billable flag (optional)

### AI Categorization
- Click "Get AI Suggestion" to automatically categorize
- Uses OpenAI to suggest the best category
- Confidence score is provided

### View & Filter
- View all expenses on the Expenses page
- Filter by category or status
- Sort by date (newest first)

## 📊 Categories

### Create Category
1. Go to Categories page
2. Click "Add Category"
3. Enter:
   - Category name
   - Color (color picker)
   - Monthly budget (optional)

### Budget Alerts
- Budget progress is shown per category
- Automatic alerts triggered at 80% & 100% of budget
- Check `/api/budget/alerts` for current alerts

## 📥 Export

### Export to CSV
1. Go to Expenses page
2. (Optional) Filter by category
3. Click "Export CSV"
4. File will be downloaded as `expenses.csv`

Exported expenses are marked with status `INCLUDED_IN_EXPORT`

## 🤖 AI Features

### Smart Categorization
- Endpoint: `POST /api/ai/categorize`
- Uses GPT-3.5-turbo to suggest categories
- Requires expense name and optional description

### Budget Summary
- Endpoint: `GET /api/ai/summary`
- Generates AI insights about spending
- Filters by month and year

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Expenses
- `GET /api/expenses` - List expenses (with filters)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Get specific expense
- `PUT /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `GET /api/categories/[id]` - Get specific category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `DELETE /api/tags/[id]` - Delete tag

### AI & Budget
- `POST /api/ai/categorize` - AI categorization suggestion
- `GET /api/ai/summary` - Budget summary with AI insights
- `GET /api/budget/alerts` - Get budget violation alerts
- `GET /api/export/csv` - Export expenses as CSV

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# CI mode
npm run test:ci
```

## 🔧 Building

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📦 Dependencies

### Core
- **next**: ^16.1.6 - React framework
- **react**: ^19.2.3 - UI library
- **react-dom**: ^19.2.3 - DOM rendering

### Database & ORM
- **@prisma/client**: ^5.19.0 - Database ORM
- **prisma**: ^5.19.0 - Database tool

### Authentication
- **next-auth**: ^5.0.0 - Authentication library
- **bcryptjs**: ^2.4.3 - Password hashing

### API & Validation
- **zod**: ^3.23.5 - Schema validation
- **openai**: ^4.52.2 - AI API client

### Styling
- **tailwindcss**: ^4 - CSS framework
- **@tailwindcss/postcss**: ^4 - Tailwind plugins

### Development
- **typescript**: ^5 - Type safety
- **eslint**: ^9 - Code linting
- **jest**: ^30.3.0 - Testing framework

## 🎨 Styling

The application uses Tailwind CSS for styling:
- Responsive design
- Dark mode compatible
- Custom color palettes per category

## 🔒 Security

- Passwords hashed with bcryptjs (10 saltRounds)
- NextAuth.js for session management
- API route protection with session checks
- Environment variables for sensitive data
- CORS handling through Next.js

## 🐛 Common Issues

### Database Issues
```bash
# Reset database
rm prisma/dev.db
npx prisma migrate dev --name init
```

### OpenAI API Errors
- Ensure API key is valid
- Check API quota hasn't been exceeded
- Verify correct model name in `.env.local`

### Authentication Issues
- Clear cookies and login again
- Check NEXTAUTH_SECRET is set
- Ensure NEXTAUTH_URL matches deployment domain

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | SQLite database connection string |
| NEXTAUTH_URL | Yes | Application URL for authentication |
| NEXTAUTH_SECRET | Yes | Secret key for NextAuth (generate with `openssl rand -base64 32`) |
| OPENAI_API_KEY | Yes | Your OpenAI API key |
| OPENAI_MODEL | No | OpenAI model (default: gpt-3.5-turbo) |
| NEXT_PUBLIC_APP_NAME | No | Application display name |

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Connect repository to Vercel
# Set environment variables in Vercel dashboard
# Deploy automatically on push
```

### Self-Hosted
1. Build: `npm run build`
2. Set production environment variables
3. Run: `npm start`
4. Use process manager (pm2, systemd, etc.)

## 📧 Support

For issues or questions, please refer to the documentation or create an issue in the repository.

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.
