import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import PredictionForm from './components/PredictionForm';
import './App.css'

function App() {
  return (
    <div className="app">
      <header>
        <h1>Prédiction de Prix des Magasins</h1>
      </header>
      <main>
        <PredictionForm />
      </main>
    </div>
  );
}

export default App
