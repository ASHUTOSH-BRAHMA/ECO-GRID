import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'react-toastify/ReactToastify.css';
import { AuthProvider } from './Context/AuthContext.jsx'
import { WalletProvider } from './Context/WalletContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </AuthProvider>
  </StrictMode>,
)
