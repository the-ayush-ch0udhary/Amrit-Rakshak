# 💊 MedChain – Secure Medicine Tracking System

MedChain is a **medicine supply chain tracking platform** that helps pharmaceutical manufacturers, wholesalers, and hospitals securely track medicines across the supply chain.

The system ensures **transparency, traceability, and drug authenticity verification** using batch tracking and QR-based verification.

---

## 🚀 Features

* 🔐 **Authentication System** – Secure login and registration using Supabase Auth
* 🏭 **Organization Management** – Supports manufacturers, wholesalers, and hospitals
* 💊 **Medicine Batch Tracking** – Track medicines using unique batch IDs
* 🚚 **Shipment Tracking** – Monitor movement of medicines across organizations
* 📦 **Request System** – Organizations can request medicines from upstream suppliers
* 📊 **Stock Analytics** – View medicine stock trends and transaction logs
* 🔎 **Drug Verification** – Verify authenticity of medicines using batch ID / QR code
* 🌙 **Dark Mode UI** – User-friendly interface with theme toggle

---

## 🛠️ Tech Stack

**Frontend**

* ⚛️ React + TypeScript
* ⚡ Vite
* 🎨 Tailwind CSS

**Backend**

* 🗄️ Supabase (PostgreSQL + Auth)

**Deployment**

* ☁️ Vercel

---

## 📁 Project Structure

```
src/
 ├── components/      # UI components (Auth, Dashboard, Modals)
 ├── services/        # Business logic and Supabase data operations
 ├── lib/             # Supabase client configuration
 ├── types/           # TypeScript interfaces and database types
 ├── utils/           # Helper utilities
 ├── App.tsx          # Main application logic
 └── main.tsx         # React entry point
```

---

## 🧩 Main Components

### 🔐 Auth Component

Handles **user registration and login** using Supabase authentication.
Includes security features like **CAPTCHA verification and role-based organization creation**.

### 📊 Dashboard

Displays key information for organizations including:

* medicine inventory
* shipment activity
* transaction logs
* stock insights

### 🔎 Drug Verification Modal

Allows users to **verify a medicine batch** by entering or scanning a batch ID / QR code.
This helps detect **fake or untracked medicines**.

### 📦 SupabaseDataManager

Centralized service that handles:

* medicine records
* shipment updates
* organization data
* transaction logging

This keeps database logic **separate from UI components**.

---

## 🗄️ Database Design

The system uses Supabase PostgreSQL with the following main tables:

* **organizations** – Registered manufacturers, wholesalers, hospitals
* **medicines** – Medicine batches and stock details
* **requests** – Medicine supply requests between organizations
* **shipments** – Tracking medicine movement
* **transactions** – Complete history of supply chain actions
* **stock_trends** – Stock analytics data

This structure enables **complete supply chain traceability**.

---

## ⚙️ Environment Variables

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## ▶️ Running the Project

Install dependencies:

```
npm install
```

Start development server:

```
npm run dev
```

Build project:

```
npm run build
```

---

## 🌐 Deployment

The project is deployed using **Vercel**.

Steps:

1. Push project to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy
5. Vercel Deployed Link: `https://amrit-rakshak.vercel.app/`
Project built for learning secure medicine supply chain tracking.
