import { useContext, useEffect, FC } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

import { IoSettingsSharp } from "react-icons/io5";
import { BsClipboard2Plus } from "react-icons/bs";
import { PiBeltDuotone } from "react-icons/pi";

import "../App.css";
import { tauriGetSettings } from './tauri_commands.ts';
import { AppContext } from "./context.tsx";
import { TestComponentButton } from "./button.tsx";

//=======================================================================
export const Home = () => {
  const context = useContext(AppContext);
  if (context === undefined){
    return <div>Loading...</div>;
  }
  const {managers, setManagers} = context;

  const location = useLocation();

  //作成されているテストをバックエンドから取得し，コンポーネントを作成---------
  const createTestComponents = () => {
    if (managers === undefined) {
      return
    }
    let components = [];
    for (let [name, info] of Object.entries(managers)) {
      components.push(<TestComponent key={name} name={name} info={info}/>);
    }
    return components;
  };

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
    <div>
      <div className="p-8 pb-10 flex flex-row justify-start items-center">
        <PiBeltDuotone size={30}/>
        <p className="px-3 pr-5 text-2xl text-bold text-black">TLOYT</p>
        <AddTestButton/>
      </div>
      <div className="px-6 flex flex-row justify-left space-x-8">
        {createTestComponents()}
      </div>
    </div>
    );
};

/*=======================================================================
テスト選択画面の要素
*/
export const convertTestType = (test_type: string) : string => {
  switch (test_type) {
    case "Mos":
      return "平均オピニオン評価"
    case "Thurstone":
      return "一対比較法(サーストン法)"
    default:
      return test_type
  }
}
interface TestComponentProps {
  name: string;
  info: {[key: string]: any};
}
const TestComponent: FC<TestComponentProps> = (props) => {
  // jsx---------------------------------------------------------------
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg flex-col flex space-y-2">
      <SettingButton/>
      <p className="text-xl text-left font-medium text-black">{props.name}</p>
      <p className="text-left text-gray-400">{convertTestType(props.info.test_type)}</p>
      <div className="pt-3 flex-row space-x-4">
        <OpenTestButton test={props.name}/>
        <AggregateButton/>
      </div>
    </div>
    );
};

//=======================================================================
const AddTestButton=()=>{
  // jsx---------------------------------------------------------------
  return(
    <button>
      <BsClipboard2Plus size={30} className="
        text-gray-500 hover:text-blue-500 transition duration-300"/>
    </button>
  );
};

//=======================================================================
const SettingButton=()=>{
  // jsx---------------------------------------------------------------
  return (
      <button>
      <IoSettingsSharp className="
        transform transition-transform duration-500 hover:rotate-180"/>
      </button>
  );
};

//テスト選択ボタン=======================================================
interface OpenTestButtonProps{
  test: string;
}
const OpenTestButton: FC<OpenTestButtonProps> =(props)=>{
  const navigate = useNavigate();
  const openTrial=()=> {
    navigate(`/trial/${props.test}`);
  }
  // jsx---------------------------------------------------------------
  return (
    <TestComponentButton text="テストを受ける" type='button' onClick={openTrial}/>
  );
}

const AggregateButton=()=>{
  // jsx---------------------------------------------------------------
  return (
    <TestComponentButton text="集計" type='button'/>
  );
}