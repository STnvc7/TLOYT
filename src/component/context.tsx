import { createContext, useState, useEffect, useContext } from 'react';
import { invoke } from "@tauri-apps/api/tauri";

export const getTestManagers= async() => {
  let managers = {};
  await invoke("get_settings").then((settings) => {
    for (let setting of settings) {
      let _obj = JSON.parse(setting);
      let _name = _obj["name"];
      managers[_name] = _obj;
    }
  }).catch((err) => {
    console.log(err);
  });

  return managers
}

export const AppContext = createContext();
export const AppProvider = ({ children }) => {
  const [managers, setManagers] = useState(undefined);

  useEffect(() => {
      getTestManagers().then((_managers) => {
        setManagers(_managers);
      });
  }, []);

  return (
    <AppContext.Provider value={{managers, setManagers}}>
      {children}
    </AppContext.Provider>
  );
};

//===============================================================
export const TrialContext = createContext();
export enum TrialStatus {
  Ready,
  Doing,
  Finished
}
export const TrialProvider = ({children, test}) => {
  const {managers, setManagers} = useContext(AppContext);

  const [testName, setTestName] = useState(test);
  const [examineeName, setExamineeName] = useState();
  const [info, setInfo] = useState(managers[test]);
  const [status, setStatus] = useState<TrialStatus>(TrialStatus.Ready);
  const context = {testName, examineeName, setExamineeName, info, status, setStatus}

  return (
    <TrialContext.Provider value={context}>
      {children}
    </TrialContext.Provider>
  );
};