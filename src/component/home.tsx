import { useContext, useEffect, useState, FC, ReactNode } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import { IoSettingsSharp } from "react-icons/io5";
import { BsClipboard2Plus } from "react-icons/bs";
import { PiBeltDuotone } from "react-icons/pi";

import "../App.css";
import { tauriGetSettings, tauriTestType, testTypeToString, tauriAddTest } from './tauri_commands.ts';
import { AppContext } from "./context.tsx";
import { TestComponentButton, RemoveButton } from "./button.tsx";

import { open } from '@tauri-apps/api/dialog';
import { basename } from '@tauri-apps/api/path';

//=======================================================================
export const Home = () => {
  const appContext = useContext(AppContext);
  if (appContext === undefined){
    return <div>Loading...</div>;
  }
  const {managers, setManagers} = appContext;

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
      <p className="text-left text-gray-400">{testTypeToString(props.info.test_type)}</p>
      <div className="pt-3 flex-row space-x-4">
        <OpenTestButton test={props.name}/>
        <AggregateButton/>
      </div>
    </div>
    );
};

//=======================================================================
const AddTestButton=()=>{
  const [clicked, setClicked] = useState<boolean>(false);

  //テストを作成するメソッド-----------------------------------------------
  const createNewTest = async(testType: tauriTestType, jsonString: string) => {
    const appContext = useContext(AppContext);
    if (appContext === undefined) return null;

    //テストをバックエンドで作成-----------------------------------
    tauriAddTest(testType, jsonString).then(() => {       //作成したら情報を取得
      return tauriGetSettings()
    }).then((managers) => {                               //取得した情報からホームを更新
      appContext.setManagers(managers);
      setClicked(false);
    }).catch((err) => console.error(err));
  }
  // jsx---------------------------------------------------------------
  return(
    <div>
      <button onClick={() => setClicked(true)}>
        <BsClipboard2Plus size={30} className="
          text-gray-500 hover:text-blue-500 transition duration-300"/>
      </button>
      <AddTestModal/>
      {/* {clicked? <AddTestModal onEnd={createNewTest}/>:null} */}
    </div>
  );
};

// 各テストのセットアップに必要な情報のインターフェース======================
interface SetupInfoBase {
  name: string;
  author: string;
  description: string;
  participants: string[];
  categories: [string, string][];
  time_limit: number;
}
// MOS
interface MosSetupInfo extends SetupInfoBase {
  num_repeat: number;
}
interface ThurstoneSetupInfo extends SetupInfoBase {
}
type SetupInfo = MosSetupInfo | ThurstoneSetupInfo;

//テスト作成のモーダルウィンドウ============================================================
interface AddTestModalProps {
  createTest: (testType: tauriTestType, jsonString: string) => void;
}
const AddTestModal: FC<AddTestModalProps> =()=>{
  const [testType, setTestType] = useState<tauriTestType>("Mos");
  const [categories, setCategories] = useState<[string, string][]>([]);
  const [participants, setParticipants] = useState<string[]>([]);

  const [currentParticipant, setCurrentParticipant] = useState<string>('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SetupInfo>();

  const inputStyle = "w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-2 py-1";
  const labelStyle = "block text-sm font-medium text-gray-900";

  // カテゴリの選択----------------------------------------------------------------------------------------
  const categoryInput= ()=> {
    //追加したカテゴリのリストを表示-------------------------------------------------
    const categoryList= ()=> {
      let l: ReactNode[] = [];
      for (let [i, category] of Object.entries(categories)) {
        l.push((
          <div key={i}>
            <p className="text-xs">{category[1]}</p>
            <div className="flex flex-row space-x-2 justify-between">
              <input type="text" defaultValue={category[0]} className={inputStyle + ' w-10/12 text-sm'} 
              onChange={(e) => changeCategoryName(Number(i), e.target.value)}/>
              <RemoveButton text='削除' className='w-2/12 text-sm' type='button' 
              onClick={() => {removeCategory(Number(i))}}/>
            </div>
          </div>
        ))
      }
      return l
    }

    const setCategoriesForm= (newCategories: [string, string][])=> {
      setCategories(newCategories);
      setValue("categories", newCategories);
    }

    //カテゴリの名前を変更---------------------------------------------------------
    const changeCategoryName= (index: number, newName: string)=> {
      const updatedCategories: [string, string][] = categories.map((category, i) => 
        i === index ? [newName, category[1]] : category
      );
      setCategoriesForm(updatedCategories);
    }

    //カテゴリを削除---------------------------------------------------------------
    const removeCategory= (index: number)=> {
      const newCategories = categories.filter((_, i) => i !== index);
      setCategoriesForm(newCategories);
    }
    //ファイルダイアログを開く----------------------------------------------------
    const openDialoge= async() => {
      const path = await open({directory: true})
      if (typeof(path) !== 'string' ) return;
      if (path === '') return;
      if (categories.some(([_name, _path]) => _path.includes(path) )){
        alert('カテゴリが重複しています');
        return
      }
      const name = await basename(path);
      setCategoriesForm([...categories, [name, path]]);
    }
    // jsx------------------------------------------------------------------------
    return (
      <div>
        <div className="flex flex-row space-x-2">
          <p className={labelStyle}>カテゴリ</p>
          <TestComponentButton text='選択' className="text-sm px-1"
            onClick={openDialoge}/>
        </div>
        {categoryList()}
      </div>
    )
  }

  // 参加者を追加するコンポーネント--------------------------------------------------------
  const participantsInput =()=> {
    //追加された参加者のリストを表示するReact Node---------------------------------
    const getParticipantsList =() => {
      if (participants === undefined) return null
      let l: ReactNode[] = []
      for (let [i, participant] of Object.entries(participants)){
        l.push(
          <div key={i} className="flex flex-row space-x-4 place-items-center justify-between">
            <li>{participant}</li>
            <RemoveButton text='削除' type='button' className="w-2/12 text-sm" 
            onClick={() => removeParticipants(Number(i))}/>
          </div>
        )
      }
      return l
    };
    const setParticipantsForm= (newParticipants: string[])=> {
      setParticipants(newParticipants);
      setValue("participants", newParticipants);
    }
    // 参加者を削除--------------------------------------------------------------
    const removeParticipants= (index: number)=> {
      const newParticipants = participants.filter((_, i) => i !== index);
      setParticipantsForm(newParticipants);
    }

    //参加者を追加-------------------------------------------------------------
    const addParticipant=() => {
      if (currentParticipant === '') {
        alert('参加者を入力してください')
        return
      }
      if (participants.includes(currentParticipant)){
        alert('参加者名が重複しています');
        return
      }
      setParticipantsForm([...participants, currentParticipant]);
      setCurrentParticipant('');
    };

    //jsx----------------------------------------------------------------------
    return (
      <div>
        <p className={labelStyle}>実験参加者</p>
        {participants.length == 0 ? (null) : (<div className="pb-2"> {getParticipantsList()} </div>)}
        <div className="flex flex-row space-x-2 justify-between">
          <input type='text' value={currentParticipant} onChange={(e) => setCurrentParticipant(e.target.value)} 
          className={inputStyle + " w-10/12"}/>
          <TestComponentButton text="追加" type='button' onClick={()=>addParticipant()} className="w-2/12 text-sm"/>
        </div>
      </div>
    )
  }

  // フォームを作るコンポーネント-----------------------------------------------------------------
  const FormComponent = (testWiseElement: ReactNode) => {
    return (
      <form id="setup" className="w-full flex flex-row space-x-4" onSubmit={handleSubmit(onSubmit)}>
        {/* 左側--------------------------------------------------------------- */}
        <div className="w-1/2 flex flex-col space-y-4">
          <div>
            <p className={labelStyle}>テスト名</p>
            <input type="text" className={inputStyle} {...register("name", { required: true })}/>
          </div>
          <div>
            <p className={labelStyle}>作成者</p>
            <input type="text" className={inputStyle} {...register("author", { required: true })}/>
          </div>
          <div>
            <p className={labelStyle}>説明</p>
            <textarea className={inputStyle} rows={6} {...register("description", { required: true })}/>
          </div>
        </div>
        <div className="w-1/2  flex flex-col space-y-4">
          {categoryInput()}
          {participantsInput()}
          {testWiseElement}
        </div>
      </form>
    );
  };

  //
    const onSubmit: SubmitHandler<SetupInfo> = (data)=> {
      console.log(data);
    };

  //テストタイプに応じてセットアップフォームを作成---------------------------
  const createForm = (): ReactNode => {
    switch(testType) {
      case "Mos": {
        const elem = (
          <div>
            <p className={labelStyle}>繰り返し回数</p>
            <input type='number' defaultValue={1} className={inputStyle}/>
          </div>        
        )
        return FormComponent(elem)
      }

      case "Thurstone":{
        return FormComponent(<></>)
      }
    }
  }

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

  //jsx--------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-40 bg-[rgb(0_0_0/0.6)] flex justify-center">
      <div className="w-5/6 my-5 bg-white p-5 rounded-lg overflow-auto">
        <div className='flex flex-row justify-between place-items-center pb-4 border-b-4'>
          <TestTypeSelector/>
          <TestComponentButton text='作成' type='submit' className="py-2 px-4 font-bold" form="setup"/>
        </div>
        <div className='pt-6'>
          {createForm()}
        </div>
      </div>
    </div>
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
    <TestComponentButton text="テストを受ける" type='button' onClick={openTrial} className="py-2 px-4 font-bold"/>
  );
}

const AggregateButton=()=>{
  // jsx---------------------------------------------------------------
  return (
    <TestComponentButton text="集計" type='button' className="py-2 px-4 font-bold"/>
  );
}