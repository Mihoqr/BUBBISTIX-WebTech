# BUBBiSTiX 🍓

A full-stack e-commerce web application for browsing, purchasing, and downloading cute digital sticker packs. Built with vanilla HTML/CSS/JavaScript on the frontend and a Node.js/Express REST API on the backend.

---

## 📋 Table of Contents

- 📸 [Pages](#-pages)
- ✨ [Features](#-features)
- 🛠️ [Tech Stack](#️-tech-stack)
- 📁 [Project Structure](#-project-structure)
- ⚙️ [Setup & Installation](#️-setup--installation)
- 🧪 [Testing](#-testing)
- 🔌 [API Reference](#-api-reference)
- 📜 [License](#-license)

---

## 📸 Pages

| Page | Description |
|------|-------------|
| `index.html` | Homepage with featured collections |
| `shop.html` | Full sticker gallery with search, sort, and category navigation |
| `shop-preview.html` | Individual sticker detail page with image carousel |
| `add-to-cart.html` | Shopping cart with item management |
| `checkout.html` | Checkout form with card validation and order confirmation |
| `order-confirmation.html` | Post-purchase confirmation screen |
| `purchase.html` | User account — profile, avatar, and purchased sticker downloads |
| `registration.html` | Login with email/password or Google |
| `create-account.html` | New user registration |
| `reset-password.html` | Request a password reset email |
| `set-new-password.html` | Set a new password via reset token |
| `about.html` | About the Bubbistix brand |
| `faqs.html` | Frequently asked questions with accordion |
| `contact.html` | Contact form for custom requests and inquiries |

---

## ✨ Features

### 🛍️ Sticker Shop
- Browse all sticker packs in a gallery layout grouped by category
- Search stickers by name in real time
- Sort by name (A–Z, Z–A) or price (low–high, high–low)
- Click any sticker to open a full preview page with an image carousel
- Category navigation with smooth scroll to section

### 🛒 Shopping Cart
- Add stickers to cart from the shop or preview page
- Cart is tied to the authenticated user's account and persists across sessions
- Duplicate and already-owned sticker prevention
- Remove individual items or proceed to checkout

### 💳 Checkout & Orders
- Contact and credit card form with full client-side validation
  - Email format check
  - 16-digit card number with auto-formatting (groups of 4)
  - MM/YY expiry with auto-slash insertion and expiry date check
  - 3–4 digit CVV
  - Name on card
- Confirmation modal before payment is processed
- Order created and cart cleared on successful checkout
- Payment is mocked (no real payment gateway)

### ⭐ Limited Edition Stickers
- Certain sticker packs are marked as limited edition
- Only one user can ever purchase a limited sticker
- Once claimed, the sticker is permanently sold out for all other users
- Ownership tracked via a dedicated `OwnershipToken` record in the database

### 📦 Digital Downloads
- Purchased stickers appear in the user's account page
- Downloads are served via **pre-signed AWS S3 URLs** that expire after 60 seconds
- Every download is logged with user ID, sticker ID, order ID, and IP address
- Download is blocked if the user does not own the sticker

### 👤 User Accounts
- Register with username, full name, email, and a strong password
- Password requirements: 8+ characters, uppercase, lowercase, number, and special character
- Login with email/password or Google OAuth (Google Sign-In)
- JWT-based session management stored in `localStorage`
- Choose from 4 avatar options (pink, gray, green, blue)
- Password reset via secure email link — token is hashed before storage and expires in 15 minutes
- Reset token is single-use and cleared after a successful reset

### 🔐 Security
- JWT authentication on all protected routes
- Role-based access control — `USER` and `ADMIN` roles enforced via middleware
- Helmet.js security headers (CSP, X-Frame-Options, X-Content-Type-Options, no X-Powered-By)
- Passwords hashed with bcrypt (10 salt rounds)
- Reset tokens stored as SHA-256 hashes, never in plain text
- Email enumeration prevention on the reset password endpoint
- CORS configured for frontend origin
> **Note:** Bubbistix does not have a dedicated admin dashboard or UI. Admin tasks such as creating and deleting stickers, managing categories, and viewing contact messages are performed directly via the REST API using a tool like Postman. All admin endpoints require an `ADMIN`-role JWT in the Authorization header. See the [API Reference](#-api-reference) section for the full list of admin routes.

### 💌 Contact
- Public contact form — no login required
- Messages stored in the database with a `NEW` / `READ` / `RESOLVED` status
- Admin can view, update status, and delete messages via API

---

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript (ES Modules)
- Bootstrap 5.3
- Google Fonts (Poppins, Outfit)
- Font Awesome icons

### Backend
- Node.js + Express.js 5
- Mongoose (MongoDB ODM)
- JSON Web Tokens (`jsonwebtoken`)
- Google OAuth (`google-auth-library`)
- bcrypt — password hashing
- Helmet — HTTP security headers
- Multer + multer-s3 — direct file upload to S3
- Nodemailer — transactional email
- uuid — ownership token generation

### Database
- MongoDB (hosted on MongoDB Atlas)

### Storage
- Amazon S3 — preview images (`previews/<category-slug>/`), sticker zip files (`stickers/`), and static assets

### Testing
- Vitest — test runner
- Supertest — HTTP integration testing
- mongodb-memory-server — in-memory MongoDB for tests

---

## 📁 Project Structure

```
BUBBISTIX-WebTech/
├── docs/                        # Frontend
│   ├── html/                    # All HTML pages
│   ├── css/                     # Stylesheet
│   └── js/                      # JavaScript modules
│       ├── config.js            # Central API URL config (single place to change for deploy)
│       └── utils/auth.js        # Shared auth header helpers
│
├── backend/                     # Node.js/Express Backend
│   ├── backend/src/
│   │   ├── controllers/         # Route handlers
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # Express routers
│   │   ├── middleware/          # Auth, role, upload middleware
│   │   └── utils/               # JWT, email, formatters
│   │
│   └── tests/                   # Automated test suite
│       ├── setup/               # DB setup, global setup, test helpers
│       ├── unit/                # Unit tests (utils + middleware)
│       ├── integration/         # HTTP integration tests (all API routes)
│       └── security/            # Security attack scenario tests
│
└── index.html                   # Homepage
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- A MongoDB Atlas cluster (or local MongoDB)
- An AWS S3 bucket with appropriate IAM permissions
- A Google Cloud project with OAuth 2.0 credentials
- An email account configured for Nodemailer (e.g. Gmail app password)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/BUBBISTIX-WebTech.git
cd BUBBISTIX-WebTech
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```env
# MongoDB
MONGODB_URI=mongodb://<db_username>:<db_password>@ac-duogskq-shard-00-00.xcc9qpm.mongodb.net:27017,ac-duogskq-shard-00-01.xcc9qpm.mongodb.net:27017,ac-duogskq-shard-00-02.xcc9qpm.mongodb.net:27017/BubbistixDB?replicaSet=atlas-14bu8w-shard-0&ssl=true&authSource=admin
PORT=4000

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret_key_here

# Email (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (used in password reset emails)
FRONTEND_URL=http://127.0.0.1:5500/docs/html

# AWS S3
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```
> For the mentor, please refer to this [file](https://docs.google.com/document/d/1BslgBMb741TSTiJ_AJrE_JoV6zY_-Rv1AO420ys_zSY/edit?usp=sharing) to access the .env file for this project.

### 4. Start the backend server

```bash
npm run dev
```

The API runs on `http://localhost:4000`.

### 5. Run the frontend

Open any page in `docs/html/` using the **Live Server** extension in VS Code, or open `index.html` directly in your browser.

---

## 🧪 Testing

The backend has a full automated test suite. All tests run against an **in-memory MongoDB instance** — your real database is never touched.

### Running Tests

Run all commands from inside the `backend/` folder:

```bash
npm test                   # Run everything
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:security      # Security tests only
npm run test:coverage      # Generate HTML coverage report
```

> On the first run, `mongodb-memory-server` will automatically download a MongoDB binary. An internet connection is required once.

### What is Tested

**Unit tests** — isolated function and middleware tests, no database or HTTP layer:

| File | Covers |
|------|--------|
| `utils/textFormatter.test.js` | `toTitleCase()` — happy path, edge cases, null input |
| `utils/jwt.test.js` | `generateToken()`, `verifyToken()`, expired/tampered/wrong-secret tokens |
| `middleware/auth.middleware.test.js` | JWT extraction, missing/malformed/expired/fake tokens |
| `middleware/authorizeRoles.middleware.test.js` | USER vs ADMIN access, missing role, case sensitivity |

**Integration tests** — full HTTP → controller → database → response pipeline:

| File | Routes Covered |
|------|----------------|
| `user.api.test.js` | Register, login, Google auth, logout, getMe, reset password, set new password, update avatar |
| `cart.api.test.js` | Add to cart, get cart, remove item, clear cart, price snapshotting, cart isolation |
| `order.api.test.js` | Checkout, total calculation, cart clearing, duplicate purchase prevention, order history, purchased stickers |
| `category.api.test.js` | Create, get all, update, delete, blocked delete when stickers exist |
| `sticker.api.test.js` | Get all, get by ID, filter by category, delete, bulk create |
| `contact_message.api.test.js` | Submit, get all (admin), update status, delete |

**Security tests** — real attack scenarios against the live API:

| Category | What is Tested |
|----------|----------------|
| SEC-01 Authentication Bypass | No token, empty Bearer, fake tokens, `alg:none` JWT attack |
| SEC-02 Privilege Escalation | USER attempting ADMIN-only create/delete routes |
| SEC-03 NoSQL Injection | `$gt`, `$regex`, `$where` operators in login and register fields |
| SEC-04 Input Validation | 10,000-char inputs, null bytes, script tags, array injection |
| SEC-05 Sensitive Data Exposure | `password_hash` never in responses, reset tokens stored hashed, no stack traces |
| SEC-06 BOLA | User A cannot access or modify User B's cart |
| SEC-07 HTTP Security Headers | Helmet: `nosniff`, `X-Frame-Options`, CSP, no `X-Powered-By` |
| SEC-08 Password Security | 8 weak password patterns all rejected at registration |

### Test Environment

No `.env` file needed — these are set automatically by `vitest.config.js`:

```
JWT_SECRET=test_super_secret_key_for_vitest_only
JWT_EXPIRES_IN=1h
NODE_ENV=test
```

---

## 🔌 API Reference

All routes are prefixed with `/api/v1`.

### Users `/users`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | Public | Create a new account |
| POST | `/login` | Public | Login with email + password |
| POST | `/googleAuth` | Public | Login or register with Google |
| POST | `/logout` | User | Logout |
| GET | `/getMe` | User | Get current user profile |
| POST | `/resetPassword` | Public | Request password reset email |
| POST | `/setNewPassword` | Public | Set new password via token |
| PATCH | `/updateAvatar` | User | Update avatar selection |

### Stickers `/stickers`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/getAll` | Public | Get all stickers (optional `?category_id=`) |
| GET | `/getByID/:id` | Public | Get single sticker |
| GET | `/getByCategory/:category_id` | Public | Get stickers under a category |
| POST | `/create` | Admin | Create a sticker (with S3 file upload) |
| PUT | `/update/:id` | Admin | Update a sticker |
| DELETE | `/delete/:id` | Admin | Delete a sticker and its S3 files |
| POST | `/createMultipleStickers` | Admin | Bulk create stickers |

### Cart `/carts`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/getCart` | User | Get current user's cart |
| POST | `/addToCart` | User | Add a sticker to cart |
| DELETE | `/removeFromCart/:sticker_id` | User | Remove a sticker from cart |
| DELETE | `/clearCart` | User | Clear all cart items |

### Orders `/orders`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/create` | User | Checkout — create order from cart |
| GET | `/getMyOrders` | User | Get all orders for current user |
| GET | `/getbyID/:id` | User | Get a specific order (must be owner) |
| GET | `/getMyPurchasedStickers` | User | Get all purchased stickers |

### Categories `/categories`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/getAll` | Public | Get all categories |
| POST | `/create` | Admin | Create a category |
| PUT | `/update/:id` | Admin | Update a category name |
| DELETE | `/delete/:id` | Admin | Delete a category (blocked if stickers exist) |

### Downloads `/downloads`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/:sticker_id` | User | Get a pre-signed S3 download URL (60s expiry) |

### Contact Messages `/contactMessages`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/create` | Public | Submit a contact message |
| GET | `/getAll` | Admin | Get all messages |
| PATCH | `/update/:id` | Admin | Update message status (NEW / READ / RESOLVED) |
| DELETE | `/delete/:id` | Admin | Delete a message |

---

## 📜 License
© 2025–2026 Bubbistix. For educational use only — not for commercial resale.

---

🍓 **Thanks for visiting Bubbistix — where stickers make everything sweeter!**
