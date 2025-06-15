import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Deze code importeert alleen de componenten die we nodig hebben
import Kiosk from './App.jsx'; 
import Display from './App.jsx';
import Admin from './App.jsx';

// Lees de omgevingsvariabele die we in Netlify instellen
const appMode = import.meta.env.VITE_APP_MODE;

let ComponentToRender;

// Bepaal welke pagina we moeten tonen op basis van de instelling
switch (appMode) {
  case 'kiosk':
    ComponentToRender = App; // De 'App' exporteert nu Kiosk
    break;
  case 'display':
    ComponentToRender = App; // De 'App' exporteert nu Display
    break;
  case 'admin':
    ComponentToRender = App; // De 'App' exporteert nu Admin
    break;
  default:
    // Standaard tonen we de volledige app met navigatie
    ComponentToRender = App;
    break;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ComponentToRender />
  </React.StrictMode>,
)