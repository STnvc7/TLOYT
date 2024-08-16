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
  if (appContext === undefined) return;
  const {managers, setManagers} = appContext;

  const location = useLocation();

  //作成されているテストをバックエンドから取得し，コンポーネントを作成---------
  const TestComponents = () => {
    if (managers === undefined) {
      return
    }
    let components = [];
    for (let [name, info] of Object.entries(managers)) {
      components.push(<TestComponent key={name} info={info}/>);
    }
    return (<div className="px-6 grid grid-cols-3 gap-5 justify-center">{components}</div>)
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
    <div className="overflow-auto">
      <div className="p-8 pb-10 flex flex-row justify-start items-center">
        <PiBeltDuotone size={30}/>
        <p className="px-3 pr-5 text-2xl text-bold text-black">TLOYT</p>
        <AddTestButton/>
      </div>
      {TestComponents()}
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
    <div className="p-6 bg-white rounded-xl shadow-lg flex-col flex">
      <div className="flex flex-row space-x-2 place-items-center">
        <SettingButton/>
        <p className="text-xl font-medium text-black">{props.info.name}</p>
      </div>
      <p className="pt-1 text-sm text-gray-500">{props.info.created_date.replaceAll('-', '/')}</p>
      <p className="pt-1 text-gray-500">{testTypeToString(props.info.test_type)}</p>
      <div className="pt-4 flex flex-row space-x-4">
        <OpenTestButton test={props.info.name}/>
        <AggregateButton/>
      </div>
    </div>
    );
};

//=======================================================================
const AddTestButton=()=>{
  const [clicked, setClicked] = useState<boolean>(false);

  // jsx---------------------------------------------------------------
  return(
    <div>
      <button onClick={() => setClicked(true)}>
        <BsClipboard2Plus size={30} className="
          text-gray-500 hover:text-blue-500 transition duration-300"/>
      </button>
      {clicked? <AddTestModal closeModal={() => {setClicked(false)}}/>:null}
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
  closeModal: () => void;
}
const AddTestModal: FC<AddTestModalProps> =(props)=>{
  const appContext = useContext(AppContext);
  if (appContext === undefined) return null;

  const [testType, setTestType] = useState<tauriTestType>("Mos");
  const [categories, setCategories] = useState<[string, string][]>([]);
  const [participants, setParticipants] = useState<string[]>([]);

  const [currentParticipant, setCurrentParticipant] = useState<string>('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SetupInfo>();

  const inputStyle = "w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-2 py-1";
  const labelStyle = "block text-sm font-medium text-gray-900";

  // カテゴリの選択----------------------------------------------------------------------------------------
  const categoryInput= ()=> {
    //追加したカテゴリのリストを表示-------------------------------------------------
    const categoryList= ()=> {
      let l: ReactNode[] = [];
      for (let [i, category] of Object.entries(categories)) {
        l.push((
          <div key={i} className="border-l-2 border-blue-500 pl-2">
            <p className="text-xs">{category[1]}</p>
            <div className="flex flex-row space-x-2 justify-between place-items-center">
              <input type="text" defaultValue={category[0]} className={inputStyle + ' w-10/12 text-sm'} 
              onChange={(e) => changeCategoryName(Number(i), e.target.value)}/>
              <RemoveButton text='削除' className='w-2/12 text-sm' type='button' 
              onClick={() => {removeCategory(Number(i))}}/>
            </div>
          </div>
        ))
      }
      return <div className="pt-2 flex flex-col space-y-0.5">{l}</div>
    }

    // StateとReact hook formに値をセット------------------------------------------------
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
          <TestComponentButton text='選択' type='button' className="text-sm px-1"
            onClick={openDialoge}/>
        </div>
        {categoryList()}
      </div>
    )
  }

  // 参加者を追加するコンポーネント--------------------------------------------------------
  const participantsInput =()=> {
    //追加された参加者のリストを表示するReact Node---------------------------------
    const getParticipantsList =(): ReactNode=> {
      if (participants === undefined) return null
      let l: ReactNode[] = []
      for (let [i, participant] of Object.entries(participants)){
        l.push(
          <div key={i} className="flex flex-row space-x-2 place-items-center justify-between border-l-2 border-blue-500">
            <p className='w-10/12 pl-2 text-sm '>{participant}</p>
            <RemoveButton text='削除' type='button' className="w-2/12 text-sm" 
            onClick={() => removeParticipants(Number(i))}/>
          </div>
        )
      }
      return (<div className='py-2 flex flex-col space-y-0.5'>{l}</div>)
    };

    // StateとReact hook formに値をセット------------------------------------------------
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
        {participants.length == 0 ? (null) : (getParticipantsList())}
        <div className="flex flex-row space-x-2 justify-between">
          <input type='text' value={currentParticipant} onChange={(e) => setCurrentParticipant(e.target.value)} 
          className={inputStyle + " w-10/12"}/>
          <TestComponentButton text="追加" type='button' onClick={()=>addParticipant()} className="w-2/12 text-sm"/>
        </div>
      </div>
    )
  }

  // フォームを作るコンポーネント-----------------------------------------------------------------
  const FormComponent = (testWiseElement: ReactNode|null) => {
    return (
      <form id="setup" className="w-full flex flex-row space-x-4" onSubmit={handleSubmit(createNewTest)}>
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
        {/* 右側-------------------------------------------------------------- */}
        <div className="w-1/2  flex flex-col space-y-4">
          {categoryInput()}
          {participantsInput()}
          <div>
            <p className={labelStyle}>制限時間</p>
            <div className="flex flex-row space-x-2 place-items-center">
              <input type="number" defaultValue={Number(5)} className={inputStyle+ ' w-4/12'} 
              {...register("time_limit", {required: true, valueAsNumber: true})}/>
              <p className='w-2/12'>秒</p>
            </div>
          </div>
          {testWiseElement}
        </div>
      </form>
    );
  };

  //テストタイプに応じてセットアップフォームを作成---------------------------
  const createForm = (): ReactNode => {
    switch(testType) {
      case "Mos": {
        const elem = (
          <div>
            <p className={labelStyle}>繰り返し回数</p>
            <input type='number' defaultValue={Number(1)} className={inputStyle+ ' w-4/12'} 
            {...register("num_repeat", {required: true, valueAsNumber: true})}/>
          </div>        
        )
        return FormComponent(elem)
      }
      case "Thurstone":{
        return FormComponent(null)
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

    //テスト作成ボタンのサブミットハンドラ--------------------------------------------------      
    const createNewTest: SubmitHandler<SetupInfo>= (data: SetupInfo) => {

      let setupInfoJSON: string = "";
      switch(testType){
        case "Mos":{
          const setupInfo: MosSetupInfo = data as MosSetupInfo;
          console.log(setupInfo);
          setupInfoJSON = JSON.stringify(setupInfo);
          break;
        }
        case "Thurstone":{
          const setupInfo: ThurstoneSetupInfo = data as ThurstoneSetupInfo;
          setupInfoJSON = JSON.stringify(setupInfo);
          break;
        }
      }
      //テストをバックエンドで作成-----------------------------------
      tauriAddTest(testType, setupInfoJSON).then(() => {       //作成したら情報を取得
        return tauriGetSettings()
      }).then((managers) => {                               //取得した情報からホームを更新
        appContext.setManagers(managers);
      }).catch((err) => console.error(err));

      props.closeModal();
    };

  //jsx--------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-40 bg-[rgb(0_0_0/0.6)] flex justify-center">
      <div className="w-5/6 my-5 bg-white p-5 rounded-lg overflow-auto">
        <div className='flex flex-row justify-between place-items-center pb-4 border-b-4'>
          <TestTypeSelector/>
          <div className="flex flex-row space-x-2">
          <RemoveButton text='戻る' className="py-2 px-4 font-bold border-2" onClick={()=>{props.closeModal()}}/>
          <TestComponentButton text='作成' type='submit' className="py-2 px-4 font-bold" form="setup"/>
          </div>
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