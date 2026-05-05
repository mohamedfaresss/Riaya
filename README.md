# 🖥️ Riaya Frontend

A modern Angular frontend for **Riaya**, a healthcare management system that connects patients, doctors, and administrators in one role-based platform.

Riaya Frontend integrates with an **ASP.NET Core backend API** to support secure authentication, appointment booking, doctor management, and online payments through Paymob.

---

## 🌐 Live Demo

Frontend:
https://mohamedfaresss.github.io/Riaya/

Backend API:
https://github.com/mohamedfaresss/Riaya-Backend-

---

## 📌 Project Overview

Riaya Frontend is the client-side application for a healthcare system designed to streamline medical booking workflows. The application provides separate experiences for **Admin**, **Doctor**, and **Patient** users, with protected routes, JWT-based authentication, API-driven data, and a clean dashboard-based interface.

The project is structured using modern Angular practices such as standalone components, lazy-loaded routes, route guards, HTTP interceptors, and reusable shared services.

---

## 🎯 Purpose

This project demonstrates building a **scalable and production-ready Angular frontend** for real-world healthcare workflows, including authentication, booking systems, and payment integration.

---

## ✨ Features

* 🔐 Authentication & Authorization (JWT-based)
* 👥 Role-based dashboards (Admin / Doctor / Patient)
* 📅 Appointment booking system
* 🩺 Doctor listing and profiles
* 💳 Payment integration (Paymob)
* ⚡ Responsive UI design
* 🔄 API integration with backend
* 🚦 Route guards & protected routes

---

## 🧠 Key Concepts Applied

* Standalone Angular Components
* Lazy-loaded Routes
* Reactive Forms
* RxJS & State Handling
* HTTP Interceptors
* Route Guards
* Dependency Injection
* Environment-based API configuration

---

## 🛠 Tech Stack

* Angular
* TypeScript
* SCSS
* RxJS
* Angular Router
* Angular Material
* REST API Integration

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── services/
│   ├── features/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── doctor/
│   │   ├── landing/
│   │   └── patient/
│   ├── shared/
│   │   ├── layout/
│   │   └── models/
│   ├── app.config.ts
│   └── app.routes.ts
└── environments/
    └── environment.ts
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```
git clone https://github.com/mohamedfaresss/Riaya
cd Riaya
```

---

### 2. Install Dependencies

```
npm install
```

---

### 3. Configure the Backend API URL

Update:

```
src/environments/environment.ts
```

Example:

```ts
export const environment = {
  production: false,
  apiUrl: 'https://your-backend-api-url/api'
};
```

---

### 4. Run the Application

```
ng serve
```

Open:

```
http://localhost:4200
```

---

## 📚 API Testing

* Swagger (Backend)
* Postman
* Browser Dev Tools

---

## 🔗 Backend Repository

👉 https://github.com/mohamedfaresss/Riaya-Backend-

---

## 🌐 Future Improvements

* Add NgRx state management
* Improve UI/UX
* Add unit & integration tests
* Optimize performance
* Add PWA support
* Add localization (Arabic / English)

---

## 👨‍💻 Author

**Mohamed Gamal Fares**
Frontend & Backend Developer
https://www.linkedin.com/in/mohamed-gamal-fares/
