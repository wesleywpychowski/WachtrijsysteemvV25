import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Zorg dat dit naar uw App.jsx verwijst
import './index.css'     // Dit is voor de styling (Tailwind CSS)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)