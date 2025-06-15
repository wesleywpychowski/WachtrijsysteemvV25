import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { Kiosk, Display, Admin } from './App.jsx'
import './index.css'

// Lees de omgevingsvariabele die we in Netlify instellen
const appMode = import.meta.env.VITE_APP_MODE;

let ComponentToRender;

// Bepaal welke pagina we moeten tonen op basis van de instelling
switch (appMode) {
  case 'kiosk':
    ComponentToRender = Kiosk;
    break;
  case 'display':
    ComponentToRender = Display;
    break;
  case 'admin':
    ComponentToRender = Admin;
    break;
  default:
    // Standaard tonen we de volledige app met navigatie (voor lokale ontwikkeling)
    ComponentToRender = App;
    break;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ComponentToRender />
  </React.StrictMode>,
)
