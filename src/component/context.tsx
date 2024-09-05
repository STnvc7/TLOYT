import {createContext, useState, useEffect, useContext, 
        ReactNode, FC, Dispatch, SetStateAction} from 'react';
import { tauriGetSettings } from '../tauri_commands.ts';

///アプリケーション全体の情報を保管するコンテクスト===============================================--
//テストマネージャのリストを保管
//型定義---------------------------------------------------------------
export interface AppContextType {
  managers: { [key: string]: any } | undefined;
  setManagers: Dispatch<SetStateAction<{ [key: string]: any } | undefined>>;
}
interface AppProviderProps {
  children: ReactNode;
}
//------------------------------------------------------------------------
export const AppContext = createContext<AppContextType|undefined>(undefined);
export const AppProvider: FC<AppProviderProps> = ({ children }) => {
  const [managers, setManagers] = useState<{[key: string]: any}|undefined>(undefined);
  useEffect(() => {
      tauriGetSettings().then((_managers) => {
        setManagers(_managers);
      });
  }, []);

  return (
    <AppContext.Provider value={{managers, setManagers}}>
      {children}
    </AppContext.Provider>
  );
};

//トライアルの情報を保管するコンテクスト=============================================
//トライアルの状態を表す列挙型----------------------------------
export enum TrialStatus {
  Ready,  // スタート前 => 受験者選択画面
  Doing,  // テスト中
  Finished  //テスト終了
}
//型定義-------------------------------------------------------
interface TrialContextType {
  testName: string;
  examineeName: string|undefined;
  setExamineeName: Dispatch<SetStateAction<string|undefined>>;
  info: {[key: string]: any};
  status: TrialStatus;
  setStatus: Dispatch<SetStateAction<TrialStatus>>;
}
interface TrialProviderProps {
  children: ReactNode;
  test: string;
  examinee?: string;
}
//-------------------------------------------------------------------------
export const TrialContext = createContext<TrialContextType|undefined>(undefined);
export const TrialProvider: FC<TrialProviderProps> = ({children, test, examinee }) => {
  const app_context = useContext(AppContext);

  const managers = app_context?.managers || {};
  const [testName] = useState<string>(test);
  const [examineeName, setExamineeName] = useState<string|undefined>(examinee);
  const [info] = useState(managers[test]);
  const [status, setStatus] = useState<TrialStatus>(TrialStatus.Ready);
  const context = {testName, examineeName, setExamineeName, info, status, setStatus}

  return (
    <TrialContext.Provider value={context}>
      {children}
    </TrialContext.Provider>
  );
};


interface SettingContextType {
  info: {[key: string]: any};
  setInfo: Dispatch<SetStateAction<{[key: string]: any}>>;
}
interface SettingProviderProps {
  children: ReactNode;
  testName: string;
}
//-------------------------------------------------------------------------
export const SettingContext = createContext<SettingContextType|undefined>(undefined);
export const SettingProvider: FC<SettingProviderProps> = ({children, testName }) => {

  const appContext = useContext(AppContext);
  if (appContext === undefined) return;
  if (appContext.managers === undefined) return;

  const [info, setInfo] = useState(appContext.managers[testName]);
  const context = {info, setInfo};

  return (
    <SettingContext.Provider value={context}>
      {children}
    </SettingContext.Provider>
  );
};