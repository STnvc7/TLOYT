import { useContext, useState, FC, ReactNode } from "react";
import { useNavigate } from 'react-router-dom';
import { Radio, RadioGroup } from '@headlessui/react'

import "../App.css";
import { tauriGetSettings, tauriDeleteTest, tauriEditTest, 
  tauriDeleteTrial, tauriStartPreview, tauriClosePreview } from '../tauri_commands.ts';
import { AppContext, SettingContext, SettingProvider, TrialProvider } from "./context.tsx";
import { TextButton, RemoveButton} from "./button.tsx";
import { ListElement } from "./list.tsx";
import { SetupForm, getDefaultSetupValue } from "./setup_form.tsx";
import { Aggregation } from "./aggretate.tsx";
import { Answer } from "./answer.tsx";

import { confirm } from '@tauri-apps/api/dialog';

type MenuType = "edit" | "participants" | "aggregate" | "preview";
const menuList: Record<MenuType, string> = {"edit": "テストの編集", "participants": "実験参加者", 
                                            "aggregate": "集計", "preview":"プレビュー"}
interface SettingProps {
    testName: string;
}
let selectedMenu: MenuType = "edit";    //再レンダリングで設定項目が変更されないようにグローバル変数化
export const Setting: FC<SettingProps> = ({testName})=> {

    const [menu, setMenu] = useState<MenuType>(selectedMenu);

    const onChange = (value: MenuType) => {
        setMenu(value);
        selectedMenu = value;
    }

    return (
      <div className='flex flex-row h-full rounded-lg'>
          <div className="w-1/4 h-full bg-gray-200 p-3">
          <RadioGroup value={menu} onChange={onChange} className='grid grid-cols-1'>
          {Object.entries(menuList).map(([value, label])=>(
              <Radio key={value} value={value} className="group flex flex-row space-x-2 items-center">
              <ListElement invisible={menu!==value}>
              <p className="w-full cursor-pointer px-2 py-1 rounded-lg group-data-[checked]:bg-gray-300 transition ease-in-out duration-300">
                  {label}
              </p>
              </ListElement>
              </Radio>               
          ))}
          </RadioGroup>
          </div>
          <div className="w-3/4 h-full overflow-auto">
              <SettingPanel menu={menu} testName={testName}/>
          </div>
      </div>
    )
}

interface SettingPanelProps {
    menu: MenuType;
    testName: string;
  }
const SettingPanel: FC<SettingPanelProps> = ({menu, testName}) => {
  let elem: ReactNode;
  switch(menu) {
    case "edit": {
      elem = <EditPanel/>
      break;
    }
    case "participants": {
      elem = <ParticipantsPanel/>
      break;
    }
    case "aggregate": {
      elem = <Aggregation/>
      break; 
    }
    case "preview": {
      elem = <PreviewPanel/>
      break;
    }
  }

  return (
      <SettingProvider testName={testName}>
          <div className="p-6 flex flex-col">
              {elem}
          </div>
      </SettingProvider>
  )
}
  
  
const EditPanel = () => {
  const appContext = useContext(AppContext);
  if(appContext===undefined) return;

  const settingContext = useContext(SettingContext);
  if (settingContext === undefined) return;
  const info = settingContext.info;

  const removeButtonHandler = async ()=> {
    const isOk = await confirm("テストを削除してもよろしいですか？");
    if (isOk == false) return;

    tauriDeleteTest(info.name).then(() => {
      return tauriGetSettings()
    }).then((managers) => {                               //取得した情報からホームを更新
      appContext.setManagers(managers);
    }).catch((err) => {
      alert(err);
      console.error(err);
    });
  }
  return (
    <div className="flex flex-col space-y-12">
      <SetupForm testType={info.test_type} edit defaultInfo={info} id="edit"/>
      <div className="flex flex-row space-x-4 justify-around border-t-4 pt-8">
        <TextButton type="submit" text='保存' form="edit" className="w-1/3 py-2 px-4 font-bold"/>
        <RemoveButton text='テストを削除' className="w-1/3 py-2 px-4 font-bold" onClick={removeButtonHandler}/>
      </div>
    </div>
  )
};

const ParticipantsPanel= () => {
  
  const appContext = useContext(AppContext);
  if (appContext === undefined) return;
  const settingContext = useContext(SettingContext);
  if (settingContext === undefined) return;
  const info = settingContext.info;

  const [currentParticipant, setCurrentParticipant] = useState<string>("");

  const addParticipant = ()=>{
    let setupInfo = getDefaultSetupValue(info.test_type, info);
    setupInfo.participants = [...setupInfo.participants, currentParticipant]
    const jsonString = JSON.stringify(setupInfo);

    tauriEditTest(info.name, jsonString).then(() => {       //作成したら情報を取得
      return tauriGetSettings()
    }).then((managers) => {                               //取得した情報からホームを更新
        appContext.setManagers(managers);
    }).catch((err) => {
        alert(err);
        console.error(err);
    });
  }

  return (
    <div>
      {(Object.entries(info.participants) as [string, "Done"|"Yet"][]).map(([name, status]) => (
        <div key={name} className="border-b-2 border-dashed">
          <Participant participantName={name} participantStatus={status}/>
        </div>
      ))}
      
      <div className="mt-2 flex flex-row space-x-2 justify-between">
        <input type='text' className="w-10/12 text-sm bg-gray-50 border border-gray-300 rounded-lg px-2 py-1"
        onChange={(e) => {setCurrentParticipant(e.target.value)}}/>
        <TextButton text="追加" type='button' className="w-2/12 text-sm p-2 rounded-md" onClick={addParticipant}
        disabled={currentParticipant === ""}/>
      </div>
    </div> 
  )
}

interface ParticipantProps{
  participantName: string;
  participantStatus: "Done" | "Yet";
}
const Participant: FC<ParticipantProps> =({participantName, participantStatus})=> {
  const navigate = useNavigate();

  const appContext = useContext(AppContext);
  if (appContext === undefined ) return;

  const settingContext = useContext(SettingContext);
  if (settingContext === undefined) return;
  const info = settingContext.info;

  //テストを開始---------------------------------------------------
  const openTest = ()=> {
    navigate(`/trial/${info.name}/${participantName}`);
  }

//参加者を削除---------------------------------------------------
  const deleteParticipant= async () => {
    const isOk = await confirm(`${participantName}を削除します．よろしいですか？`)
    if (isOk == false) return;

    let setupInfo = getDefaultSetupValue(info.test_type, info);
    setupInfo.participants = setupInfo.participants.filter((key) => key != participantName);
    const jsonString = JSON.stringify(setupInfo);

    tauriEditTest(info.name, jsonString).then(() => {       //作成したら情報を取得
        return tauriGetSettings()
    }).then((managers) => {                               //取得した情報からホームを更新
        appContext.setManagers(managers);
    }).catch((err) => {
        alert(err);
        console.error(err);
    });
  }

  //テストの結果を削除------------------------------------------------------
  const delteTrial = async ()=> {
    const isOk = await confirm(`${participantName}のテストの結果を削除します．よろしいですか？`)
    if (isOk == false) return;

    tauriDeleteTrial(info.name, participantName).then(() => {       //作成したら情報を取得
      return tauriGetSettings()
    }).then((managers) => {                               //取得した情報からホームを更新
      appContext.setManagers(managers);
    }).catch((err) => {
      alert(err);
      console.error(err);
    });
  }

  //-----------------------------------------------------------------
  const ParticipantInfo =()=> {
    let statusLabel: ReactNode;
    let actionButton: ReactNode;

    switch(participantStatus){
      case "Yet": {
        statusLabel = <div className="rounded-lg p-2 text-xs text-white bg-[#FF7777] flex items-center justify-center">未受験</div>
        actionButton = <TextButton text="テストを受ける" className="text-sm p-2 w-full" onClick={openTest}/>
        break;
      }
      case "Done": {
        statusLabel = <div className="rounded-lg p-2 text-xs text-white bg-[#399918] flex items-center justify-center">受験済</div>
        actionButton = <RemoveButton text="結果を削除" className="w-full text-sm p-2" onClick={delteTrial}/>
        break;
      }
    }

    return (
      <div className="w-3/5 flex flex-row space-x-2 items-center justify-end">
        <div className="flex items-center justify-center">
          {statusLabel}
        </div>
        <div className="w-32">
          {actionButton}
        </div>
        <RemoveButton text="削除" className="text-sm p-2" disabled={participantStatus == "Done" ? true : false} onClick={deleteParticipant}/>
      </div>
    )
  }

  return (
    <div className="py-2 flex flex-row items-center">
      <p className="w-2/5">{participantName}</p>
      <ParticipantInfo/>
    </div>
  )
}


const PreviewPanel =()=> {
  const settingContext = useContext(SettingContext);
  if (settingContext === undefined) return;
  const info = settingContext.info;

  const [isStart, setIsStart] = useState<boolean>(false);
  
  const startPreview =()=> {
    setIsStart(true)
    tauriStartPreview(info.name).then(() => {
      console.log("start preview")
    }).catch((e) => console.error(e));
  }

  const closePreview =async()=> {
    setIsStart(false)
    tauriClosePreview().then(() => {
      console.log("close preview")
    }).catch((e) => console.error(e));
  }
  
  const Preview=()=> {
    return (
      <TrialProvider test={info.name} examinee={""}>
        <Answer preview={true}/>
      </TrialProvider>
    )
  }
  return (
    <div className="flex flex-col">
      <div className="flex flex-row space-x-2 mb-6">
        <TextButton text="プレビューを開始" className="py-2 px-4 font-bold" type='button'
        onClick={startPreview} disabled={isStart===true}/>
        <RemoveButton text="プレビューを終了" className="py-2 px-4 font-bold" type='button'
        onClick={closePreview} disabled={isStart===false}/>

      </div>
      <div className="p-2">
        {isStart ? <Preview/> : (null)}
      </div>

    </div>
  )
}