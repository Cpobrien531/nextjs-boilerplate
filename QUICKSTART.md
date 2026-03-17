# AI Expense Tracker - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment
Edit `.env.local` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-key-here
NEXTAUTH_SECRET=your-secret-key-here
```

Generate a secret with:
```bash
openssl rand -base64 32
```

### Step 3: Initialize Database
```bash
npx prisma migrate dev --name init
```

### Step 4: Start Development
```bash
npm run dev
```

Visit: http://localhost:3000

## 📝 First Time Usage

1. **Register** - Create an account at `/register`
2. **Create Categories** - Go to Categories page and add expense categories
3. **Add Expenses** - Use the dashboard to add your first expense
4. **Try AI Suggestion** - Click "Get AI Suggestion" when adding an expense
5. **View Dashboard** - See your spending statistics

## 🎯 Core Features

| Feature | Location | Description |
|---------|----------|-------------|
| Add Expense | Dashboard | Quick expense entry with AI categorization |
| Manage Categories | Categories page | Create categories with budgets |
| View All Expenses | Expenses page | Filter and export expenses |
| Budget Alerts | Dashboard | Real-time budget violation warnings |
| Export CSV | Expenses page | Download expense report |

## 🔑 Key Pages

- `/` - Home page (overview)
- `/login` - Login
- `/register` - Registration
- `/dashboard` - Main dashboard
- `/expenses` - Expenses management
- `/categories` - Category management

## 🔌 API Examples

### Quick Add Expense (with AI)
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coffee at Starbucks",
    "amount": 5.50,
    "expenseDate": "2024-03-17T10:00:00Z",
    "categoryId": "cat-id-here"
  }'
```

### Get AI Category Suggestion
```bash
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "expenseName": "Uber ride to work",
    "description": "Morning commute"
  }'
```

### Get Budget Alerts
```bash
curl http://localhost:3000/api/budget/alerts
```

## 💡 Pro Tips

1. **AI Suggestions**: The AI works best with descriptive expense names
2. **Budget Tracking**: Set realistic monthly budgets for better tracking
3. **Filtering**: Use date ranges and categories to analyze spending
4. **Exports**: Export monthly for tax records or analysis
5. **Tags**: Add tags to expenses for better organization

## 🆘 Troubleshooting

### Database Error?
```bash
rm prisma/dev.db
npx prisma migrate dev --name init
```

### API Key Error?
- Check OpenAI API key is correct
- Verify account has API quota remaining
- Test key at https://platform.openai.com/account/api-keys

### Can't Login?
- Clear browser cookies
- Check `.env.local` has NEXTAUTH_SECRET
- Database may need reset (see above)

## 📞 Need Help?

Check [SETUP.md](./SETUP.md) for:
- Complete setup instructions
- All API endpoints reference
- Database schema details
- Deployment guides
- Environment variables

## ✨ What's Included

✅ User authentication (register, login)
✅ Expense CRUD with AI categorization
✅ Category management with budgets
✅ Tag system for expenses
✅ Budget alerts at 80% & 100%
✅ CSV export functionality
✅ AI-powered budget summary
✅ Responsive UI with Tailwind CSS
✅ Full TypeScript support
✅ Database with Prisma ORM

## 🎨 Next Customizations

Consider adding:
- Receipt image upload
- Budget templates
- Recurring expense tracking
- Multi-currency support
- Mobile app version
- Email daily digest
- Advanced analytics

---

**Ready to track expenses the smart way!** 🚀
