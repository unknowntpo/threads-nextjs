import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SignupPage from './pages/SignupPage.tsx'
import LoginPage from './pages/LoginPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<div><h1>Home Page</h1></div>} />
        <Route path="/feed" element={<div><h1>Feed Page</h1></div>} />
        <Route path="/dashboard" element={<div><h1>Dashboard Page</h1></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
