import { BrowserRouter, Route, Routes } from 'react-router-dom';
import "./App.css";
import {Home} from "./component/home.tsx";
import {AppProvider} from "./component/context.tsx";
import {TrialFromURL} from "./component/trial.tsx"

function App() {
  return (
    <div>
      <AppProvider>
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/trial/:test/:examinee' element={<TrialFromURL/>} />
      </Routes>
      </BrowserRouter>
      </AppProvider>
    </div>
  );
}

export default App;