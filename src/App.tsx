import { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import TestComponentWrapper from "./component/test_component";
import {AppProvider} from "./context.tsx";

function App() {


  return (
    <div>
      <h1 className="p-3 text-3xl text-bold text-black text-center">TLOYT</h1>
      <AppProvider>
        <TestComponentWrapper/>
      </AppProvider>
    </div>
  );
}

export default App;
