import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './contexto/AuthContexto';
import './index.css';

const contenedor = document.getElementById('root');

if (contenedor === null) {
  throw new Error('No se encontró el contenedor principal de la aplicación.');
}

ReactDOM.createRoot(contenedor).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
