# 🖥️ Riaya Frontend

A modern Angular frontend for **Riaya**, a healthcare management system that connects patients, doctors, and administrators in one role-based platform.

Riaya Frontend integrates with an **ASP.NET Core backend API** to support secure authentication, appointment booking, doctor management, and online payments through Paymob.

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

```id="7zx4qx"
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

```id="o84eoz"
git clone https://github.com/mohamedfaresss/Riaya
cd Riaya
```

---

### 2. Install Dependencies

```id="kg6n02"
npm install
```

---

### 3. Configure the Backend API URL

Update the API URL in:

```id="rnpbwt"
src/environments/environment.ts
```

Example:

```ts id="z6imdn"
export const environment = {
  production: false,
  apiUrl: 'https://your-backend-api-url/api'
};
```

> ⚠️ Do not commit private API URLs, secrets, or production credentials.

---

### 4. Run the Application

```id="3nt0yw"
ng serve
```

Open:

```id="d06n34"
http://localhost:4200
```

---

## 📚 API Testing

You can test the application using:

* Angular development server
* Swagger (from backend)
* Postman

---

## 🔗 Backend Connection

This frontend integrates with the backend API:

👉 https://github.com/mohamedfaresss/Riaya-Backend-

Make sure the backend is running before testing features.

---

## 🌐 Future Improvements

* Add state management (NgRx)
* Improve UI/UX design
* Add unit and integration tests
* Optimize performance
* Add PWA support
* Add localization (Arabic / English)
* Improve payment UI feedback

---

## 🌐 Live Demo (Optional)

Frontend:
https://your-frontend-url

Backend:
https://your-backend-url

---

## 👨‍💻 Author

**Mohamed Gamal Fares**
Frontend & Backend Developer
[LinkedIn](https://www.linkedin.com/in/mohamed-gamal-fares/)
