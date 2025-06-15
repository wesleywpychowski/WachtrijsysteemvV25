import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { Kiosk, Display, Admin } from './App.jsx'
import './index.css'

// Lees de omgevingsvariabele die we in Netlify instellen
const appMode = import.meta.env.VITE_APP_MODE;

let ComponentToRender;

// Deze 'Wrapper' component zorgt ervoor dat de losse pagina's (Kiosk, Display, Admin)
// altijd de volledige schermhoogte innemen, door de layout van de hoofd-app exact na te bootsen.
// Dit lost het probleem met de witte ruimte op Netlify definitief op.
const PageWrapper = ({ children }) => (
    <div className="h-screen font-sans flex flex-col">
        <main className="flex-1 overflow-hidden">
            {children}
        </main>
    </div>
);

// Bepaal welke pagina we moeten tonen op basis van de instelling in Netlify
switch (appMode) {
  case 'kiosk':
    ComponentToRender = <PageWrapper><Kiosk /></PageWrapper>;
    break;
  case 'display':
    ComponentToRender = <PageWrapper><Display /></PageWrapper>;
    break;
  case 'admin':
    ComponentToRender = <PageWrapper><Admin /></PageWrapper>;
    break;
  default:
    // Standaard tonen we de volledige app met navigatie (voor lokale ontwikkeling)
    ComponentToRender = <App />;
    break;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {ComponentToRender}
  </React.StrictMode>,
)
