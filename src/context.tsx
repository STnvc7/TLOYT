import { createContext, useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/tauri";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const [managers, setManagers] = useState(undefined);

  useEffect(() => {
    async function getTests() {
      try {
        const settings = await invoke("get_settings");
        let _managers = [];
        for (let setting of settings) {
        	let _type = setting[0];
        	let _obj = JSON.parse(setting[1]);
        	let _name = _obj["name"];
        	_managers.push({name: _name, type: _type, info: _obj});
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