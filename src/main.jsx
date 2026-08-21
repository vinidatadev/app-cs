import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import App from './App'
import Login from './pages/Login'
import Transacoes from './pages/Transacoes'
import Capacitacao from './pages/Capacitacao'
import Links from './pages/Links'
import AdminUsuarios from './pages/AdminUsuarios'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/organograma" replace />} />
          <Route path="/login" element={<Login />} />

          <Route path="/organograma" element={
            <ProtectedRoute modulo="organograma">
              <App />
            </ProtectedRoute>
          } />

          <Route path="/transacoes" element={
            <ProtectedRoute modulo="transacoes">
              <Transacoes />
            </ProtectedRoute>
          } />

          <Route path="/capacitacao" element={
            <ProtectedRoute modulo="capacitacao">
              <Capacitacao />
            </ProtectedRoute>
          } />

          <Route path="/links" element={
            <ProtectedRoute modulo="links">
              <Links />
            </ProtectedRoute>
          } />

          {/* Rota admin — ProtectedRoute sem modulo, só precisa estar logado;
              a própria página verifica isAdmin */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminUsuarios />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
