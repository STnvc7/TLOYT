import { useContext, useEffect, useState, FC } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { PiBeltDuotone } from "react-icons/pi";
import { Dialog, DialogPanel } from '@headlessui/react'

import "../App.css";
import { tauriGetSettings, tauriTestType, testTypeToString } from '../tauri_commands.ts';
import { AppContext } from "./context.tsx";
import { TextButton } from "./button.tsx";
import { ListElement } from "./list.tsx";
import { SetupForm } from "./setup_form.tsx";
import { Setting } from "./setting.tsx";

//=======================================================================
export const Home = () => {
  const location = useLocation();
  const appContext = useContext(AppContext);
  if (appContext === undefined) return;
  const {managers, setManagers} = appContext;

  //他のページから戻ってきた場合にマネージャを更新する--------------------
  useEffect(() => {
    if (location.pathname === '/') {
      tauriGetSettings().then((_managers) => {
        setManagers(_managers);
      });
    }
  }, [location]);

  // jsx---------------------------------------------------------------
  return (
    <div className="overflow-auto">
      <div className="m-8 flex flex-row justify-start items-center">
        <PiBeltDuotone size={30}/>
        <p className="px-3 pr-5 text-2xl text-bold text-black">TLOYT</p>
        <AddTestButton/>
      </div>
      <div className="m-6 grid grid-cols-3 gap-5 justify-center">
        {managers===undefined ? (null):(Object.entries(managers).map(([name, info]) => (
          <TestComponent key={name} info={info}/>
        )))}
      </div>
    </div>
    );
};

/*=======================================================================
テスト選択画面の要素
*/
interface TestComponentProps {
  info: {[key: string]: any};
}
const TestComponent: FC<TestComponentProps> = (props) => {
  // jsx---------------------------------------------------------------
  return (
    <div className="px-6 py-4 bg-white rounded-xl shadow-lg flex-col flex">
      <p className="mb-2 text-xl font-medium text-black">{props.info.name}</p>
      <div className="flex flex-col space-y-1">
        <ListElement>
          <p className="my-0.5 text-sm text-gray-500">{testTypeToString(props.info.test_type)}</p>
        </ListElement>
        <ListElement>
          <p className="my-0.5 text-sm text-gray-500">作成日: {props.info.created_date.replaceAll('-', '/')}</p>
        </ListElement>
      </div>
      <div className="pt-4 flex flex-row space-x-2">
        <OpenTestButton test={props.info.name}/>
        <SettingButton info={props.info}/>
      </div>
    </div>
    );
};


//テスト作成のボタン============================================================
const AddTestButton =()=>{
  const appContext = useContext(AppContext);
  if (appContext === undefined) return null;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [testType, setTestType] = useState<tauriTestType>("Mos");

  //テストタイプのセレクタ-------------------------------------------------------
  const TestTypeSelector=()=> {
    return (
      <div className="text-lg">
        <select value={testType} onChange={(e)=> setTestType(e.target.value as tauriTestType)}>
          <option key="Mos" value="Mos" >平均オピニオン評価 (MOS)</option>
          <option key="Thurstone" value="Thurstone">一対比較法 (サーストン法)</option>
        </select>
      </div>
    )
  }
  
  //モーダルウィンドウを閉じる------------------------------------
  const closeModal=() => {
    setTestType("Mos");
    setIsOpen(false);
  }

  // jsx--------------------------------------------------------------------------
  return (
    <div>
      <TextButton text="テスト作成" type='button' onClick={()=>setIsOpen(true)} className="py-2 px-2 font-bold"/>

      {/* モーダルウィンドウ------------------------------------------------ */}
      <Dialog open={isOpen} as="div" className="relative z-10 focus:outline-none" onClose={()=>{closeModal();}}>
        <div className='fixed inset-0 z-40 bg-[rgb(0_0_0/0.6)] flex justify-center'>
          <div className="w-5/6 my-5 p-8 bg-white rounded-lg overflow-auto">
            <DialogPanel>
              <div className='flex flex-row justify-between place-items-center pb-2 mb-4 border-b-4'>
                <TestTypeSelector/>
                <TextButton text='作成' type='submit' className="py-2 px-4 font-bold" form="setup"/>
              </div>
              <SetupForm testType={testType} edit={false} id="setup"/>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};


interface SettingButtonProps {
  info: {[key: string]: any};
}
//=======================================================================
const SettingButton: FC<SettingButtonProps> =({info})=>{
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const closeModal= ()=> {
    setIsOpen(false);
  }

  const SettingModal= ()=> {
    return (
      <Dialog open={isOpen} as='div' onClose={()=>{closeModal()}}>
        <div className='fixed inset-0 z-40 bg-[rgb(0_0_0/0.6)] flex justify-center'>
          <div className="w-5/6 my-5 bg-white rounded-lg">
            <DialogPanel className="h-full rounded-lg">
              <Setting testName={info.name}/>           
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    )
  }
  // jsx---------------------------------------------------------------
  return (
    <>
      <TextButton text="管理" onClick={()=>{setIsOpen(true);}} className="px-3 text-gray-600 hover:bg-gray-600 hover:text-white font-bold"/>
      <SettingModal/>
    </>
  );
};



//テスト選択ボタン=======================================================
interface OpenTestButtonProps{
  test: string;
}
const OpenTestButton: FC<OpenTestButtonProps> =(props)=>{
  const navigate = useNavigate();
  const openTrial=()=> {
    navigate(`/trial/${props.test}/undefined`);
  }
  // jsx---------------------------------------------------------------
  return (
    <TextButton text="テストを受ける" type='button' onClick={openTrial} className="py-2 px-4 font-bold"/>
  );
}