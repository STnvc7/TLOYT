import { useContext, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

import { IoSettingsSharp } from "react-icons/io5";
import { BsClipboard2Plus } from "react-icons/bs";
import { PiBeltDuotone } from "react-icons/pi";

import { invoke } from "@tauri-apps/api/tauri";

import "../App.css";
import { AppContext } from "./context.tsx";
import { TestComponentButton } from "./button.tsx";
import { convertTestType } from "./utils.ts";

//=======================================================================
export const Home = () => {
  let {managers, setManagers} = useContext(AppContext);
  const location = useLocation();

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

  useEffect(() => {
    if (location.pathname === '/') {
      getTestManagers().then((_managers) => {
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

//=======================================================================
const TestComponent = (props) => {
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

const OpenTestButton=(props)=>{
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