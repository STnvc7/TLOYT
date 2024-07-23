import { useContext } from "react";
import { IoSettingsSharp } from "react-icons/io5";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import { AppContext } from "./context.tsx";

const Home = () => {
  let managers = useContext(AppContext);

  const createTestComponents = () => {
    if (managers === undefined) {
      return
    }

    let components = [];
    for (let [i, manager] of managers.entries()) {
      components.push(<TestComponent key={i} name={manager.name} type={manager.type}/>);
    }
    return components;
  };

  return (
    <div className="p-4 flex flex-row justify-left space-x-8">
    {createTestComponents()}
    </div>
    );
};

const TestComponent = (props) => {

  const convertTestType = (test_type) => {
    switch (test_type) {
      case "MOS":
        return "平均オピニオン評価"
      case "Thurstone":
        return "一対比較法(サーストン法)"
      default:
        return test_type
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg flex-col space-y-2">
      <button className="
        transform transition-transform duration-500 hover:rotate-180">
      <IoSettingsSharp /></button>
      <p className="text-xl text-left font-medium text-black">{props.name}</p>
      <p className="text-left text-gray-400">{convertTestType(props.type)}</p>
      <div className="flex-row space-x-4">
        <button className="
          bg-blue-500 hover:bg-blue-700 transition duration-500
          text-white font-bold py-2 px-4 shadow-lg rounded">
        テストを受ける</button>
        <button className="
          bg-blue-500 hover:bg-blue-700 transition duration-500
          text-white font-bold py-2 px-4 shadow-lg rounded">
        集計</button>
      </div>
    </div>
    );
};

export default Home;