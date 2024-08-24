import { BrowserRouter, Route, Routes } from 'react-router-dom';
import "./App.css";
import {Home} from "./component/home.tsx";
import {AppProvider} from "./component/context.tsx";
import {Trial} from "./component/trial.tsx"

function App() {
  return (
    <div>
      <AppProvider>
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/trial/:test' element={<Trial/>} />
      </Routes>
      </BrowserRouter>
      </AppProvider>
    </div>
  );
}

export default App;