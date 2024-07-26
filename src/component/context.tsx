import { createContext, useState, useEffect, useContext } from 'react';
import { invoke } from "@tauri-apps/api/tauri";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const [managers, setManagers] = useState(undefined);

  useEffect(() => {
    async function getTests() {
      try {
        const settings = await invoke("get_settings");
        let _managers = {};
        for (let setting of settings) {
        	let _obj = JSON.parse(setting);
        	let _name = _obj["name"];
        	_managers[_name] = _obj;
        }
        setManagers(_managers);
      } catch (error) {
        console.error(error);
      }
    }

    getTests();
  }, []);

  return (
    <AppContext.Provider value={managers}>
      {children}
    </AppContext.Provider>
  );
};

//===============================================================
export const TrialContext = createContext();

export const TrialProvider = ({children, test}) => {
  const managers = useContext(AppContext);

  const [testName, setTestName] = useState(test);
  const [examineeName, setExamineeName] = useState();
  const [info, setInfo] = useState(managers[test]);

  return (
    <TrialContext.Provider value={{testName, examineeName, setExamineeName, info}}>
      {children}
    </TrialContext.Provider>
  );
};