import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import Home from "./home.tsx";
import {AppProvider} from "./context.tsx";

function App() {

  return (
    <div>
      <h1 className="p-3 text-3xl text-bold text-black text-center">TLOYT</h1>
      <AppProvider>
        <Home/>
      </AppProvider>
    </div>
  );
}

export default App;
