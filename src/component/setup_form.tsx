import { useContext, useState, FC, useEffect } from "react";
import { useForm, SubmitHandler, FormProvider, useFormContext } from "react-hook-form";
import { open } from '@tauri-apps/api/dialog';
import { basename } from '@tauri-apps/api/path';
import { overrideTailwindClasses } from "tailwind-override";

import "../App.css";
import { tauriGetSettings, tauriTestType, tauriAddTest, tauriEditTest } from '../tauri_commands.ts';
import { AppContext } from "./context.tsx";
import { TextButton, RemoveButton } from "./button.tsx";
import { ListElement } from "./list.tsx";

const inputStyle = "bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 ";
const labelStyle = "block text-sm font-medium text-gray-800 ";

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
export type SetupInfo = MosSetupInfo | ThurstoneSetupInfo;

// 各インターフェースのデフォルト値を設定=======================================================
export const getDefaultSetupValue= (testType: tauriTestType, info?: {[key: string]: any}) => {

  let defaultValues: SetupInfo = {name: "", author: "", description: "", participants: [], categories: [], time_limit: 5};

  if (info !== undefined) {
    defaultValues.name = info.name;
    defaultValues.author = info.author;
    defaultValues.description = info.description;
    defaultValues.participants = Object.keys(info.participants);
    defaultValues.categories = info.categories["names"].map((name: string, index: number) => 
      [name, info.categories["original_paths"][index]]
    );
    defaultValues.time_limit = info.time_limit;
  }
  
  switch (testType) {
    case "Mos": {
      const defaultNumRepeatValue = 2;
      defaultValues = {...defaultValues, num_repeat: (info === undefined ? defaultNumRepeatValue : info.num_repeat)};
      break;
    }
    case "Thurstone": {
      break;
    }
  }

  return defaultValues
}





//===========================================================================
interface SetupFormComponentProps {
  testType: tauriTestType;
  edit: boolean;
  defaultInfo?: {[key: string]: any};
  id?: string;
}
export const SetupForm: FC<SetupFormComponentProps> = ({testType, edit, defaultInfo, id})=> {
    const appContext = useContext(AppContext);
    if (appContext === undefined) return null;

    const defaultValues = getDefaultSetupValue(testType, defaultInfo);
    //react-hook-form --------------------------------
    const methods = useForm<SetupInfo>({
      defaultValues: defaultValues
    });
    const { register, handleSubmit } = methods;
    //--------------------------------

    //フォームのデータに空の要素が含まれているかどうか-------------------------------------
    const hasEmptyProperty= (data: SetupInfo): boolean => {
      for (let v of Object.values(data)){
        if (v === undefined || v === null) return true
        if (typeof v === 'string') if (v == "") return true
        if (typeof v === 'object') if (v.length == 0) return true
      }
      return false
    }
  
    //テスト作成ボタンのサブミットハンドラ--------------------------------------------------      
    const submitHandler: SubmitHandler<SetupInfo>= (data: SetupInfo) => {
      
      //バリデーション---------------------------
      if (hasEmptyProperty(data)) {
        alert('全ての要素を入力してください');
        return
      }

      let setupInfoJSON = JSON.stringify(data);
      console.log("send setup form:", data);
      //テストをバックエンドで作成-----------------------------------
      const result = edit? tauriEditTest(defaultValues.name, setupInfoJSON) : tauriAddTest(testType, setupInfoJSON);

      result.then(() => {       //作成したら情報を取得
        return tauriGetSettings()
      }).then((managers) => {                               //取得した情報からホームを更新
        appContext.setManagers(managers);
      }).catch((err) => {
        alert(err);
        console.error(err);
      });
    };

    //jsx--------------------------------------------------------------------------------------
    /*
    <テスト名>
    <作成者名>
    <テストの説明>
    <カテゴリの設定>
    <参加者リスト>
    <制限時間>
    <テストの種類による項目>
    */
    return (
      <FormProvider {...methods}>
        <form id={id} className="w-full flex flex-col space-y-4" onSubmit={handleSubmit(submitHandler)}>
            <div>
              <p className={labelStyle}>テスト名</p>
              <input type="text" className={overrideTailwindClasses(`${inputStyle} w-full ${edit ? "text-gray-300":"text-black"}`)} {...register("name")} disabled={edit}/>
            </div>
            <div>
              <p className={labelStyle}>作成者</p>
              <input type="text" className={overrideTailwindClasses(`${inputStyle} w-full`)} {...register("author")}/>
            </div>
            <div>
              <p className={labelStyle}>説明</p>
              <textarea className={overrideTailwindClasses(`${inputStyle} w-full`)} rows={6} {...register("description")}/>
            </div>
            <CategoryInput edit={edit}/>
            <ParticipantsInput edit={edit}/>
            <div>
              <p className={labelStyle}>制限時間</p>
              <div className="flex flex-row space-x-2 place-items-center">
                <input type="number" className={overrideTailwindClasses(`${inputStyle} w-1/3`)} 
                {...register("time_limit", {valueAsNumber: true})}/>
                <p>秒</p>
              </div>
            </div>
            <TestSpecificInput testType={testType}/>
        </form>
      </FormProvider>
    );
}

// カテゴリの選択================================================================================
interface CategoryInputProps {
  edit: boolean
}
const CategoryInput: FC<CategoryInputProps> = ({edit})=> {
  const [categories, setCategories] = useState<[string, string][]>([]);
  const {setValue, getValues} = useFormContext();

  useEffect(() => {
    const defaultCategories = getValues("categories");
    updateCategories(defaultCategories);
  }, []);

  const updateCategories=(newCategories: [string, string][])=> {
    setCategories(newCategories);
    setValue('categories', newCategories);
  }

  //カテゴリの名前を変更---------------------------------------------------------
  const changeCategoryName= (index: number, newName: string)=> {
    const updatedCategories: [string, string][] = categories.map((category, i) => 
      i === index ? [newName, category[1]] : category
    );
    updateCategories(updatedCategories);
  }

  //カテゴリを削除---------------------------------------------------------------
  const removeCategory= (index: number)=> {
    const newCategories = categories.filter((_, i) => i !== index);
    updateCategories(newCategories);
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
    updateCategories([...categories, [name, path]]);
  }
  // jsx------------------------------------------------------------------------
  /*
  カテゴリ <選択ボタン>
  <追加されたカテゴリのリスト>
  ...
  <追加されたカテゴリのリスト>

  */
  return (
    <div>
      <div className="flex flex-row space-x-2 place-items-center">
        <p className={labelStyle}>カテゴリ</p>
        {edit ? (null) : 
        <TextButton text='選択' type='button' className="text-xs px-4 py-1 rounded-md" onClick={openDialoge}/>
        }
      </div>
      <div className="pt-4 flex flex-col space-y-1">
        {Object.entries(categories).map(([i, category]) => (
          <ListElement key={i}>
            <div>
              <p className="text-xs">{category[1]}</p>
              <div className="flex flex-row space-x-2 justify-between place-items-center">
                <input type="text" defaultValue={category[0]} className={overrideTailwindClasses(`${inputStyle} w-10/12 text-sm`)} 
                onChange={(e) => changeCategoryName(Number(i), e.target.value)} disabled={edit}/>
                <RemoveButton text='削除' className='w-2/12 text-xs px-4 py-1 rounded-md' type='button' 
                onClick={() => {removeCategory(Number(i))}} disabled={edit}/>
              </div>
            </div>
          </ListElement>))}    
      </div>
    </div>
  )
}

interface ParticipantsInputProps {
  edit: boolean;
}
// 参加者を追加するコンポーネント============================================================
const ParticipantsInput: FC<ParticipantsInputProps> =({edit})=> {
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<string>("");
  const { setValue, getValues } = useFormContext();

  useEffect(() => {
    const defaultParticipants = getValues("participants");
    updateParticipants(defaultParticipants);
  }, []);

  const updateParticipants=(newParticipants: string[]) => {
    setParticipants(newParticipants);
    setValue("participants", newParticipants);
  }

  // 参加者を削除--------------------------------------------------------------
  const removeParticipants= (index: number)=> {
    const newParticipants = participants.filter((_, i) => i !== index);
    updateParticipants(newParticipants);
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
    updateParticipants([...participants, currentParticipant]);
    setCurrentParticipant('');
  };

  //jsx----------------------------------------------------------------------
  /*
  <参加者名>  <削除ボタン>

  削除ボタン：編集モードではdisabled
  */
  return (
    <div>
      <p className={labelStyle}>実験参加者</p>
      {participants.length == 0 ? (null) : (
        <div className='py-2 flex flex-col space-y-1'>
          {Object.entries(participants).map(([i, participant]) => (
            <ListElement key={i}>
              <div key={i} className="w-full flex flex-row space-x-2 items-center justify-between">
                <p className='w-10/12 pl-2 text-sm'>{participant}</p>
                <RemoveButton text='削除' type='button' className="w-2/12 text-xs px-4 py-1 rounded-md" 
                onClick={() => removeParticipants(Number(i))} disabled={edit}/>
              </div>
            </ListElement>
          ))}
        </div>
      )}

      {edit ? (null) :
        <div className="mt-2 flex flex-row space-x-2 justify-between">
          <input type='text' value={currentParticipant} onChange={(e) => setCurrentParticipant(e.target.value)} 
           className={overrideTailwindClasses(`${inputStyle} w-10/12 text-sm`)}/>
          <TextButton text="追加" type='button' onClick={()=>addParticipant()} className="w-2/12 text-xs px-4 py-1 rounded-md" disabled={currentParticipant == ""}/>
        </div>
      }
    </div>
  )
}


//テストタイプに応じた設定========================================================
interface TestSpecificInputProps {
  testType: tauriTestType;
}
const TestSpecificInput: FC<TestSpecificInputProps> = ({testType}) => {
  switch(testType) {
    case "Mos": {
      return <MosSpecificInput/>
    }
    case "Thurstone":{
      return (null)
    }
  }
}

const MosSpecificInput=()=>{
  const { register } = useFormContext();
  return (
    <div>
      <p className={labelStyle}>繰り返し回数</p>
      <div className="flex flex-row space-x-2 place-items-center">
        <input type='number' defaultValue={Number(1)} className={overrideTailwindClasses(`${inputStyle} w-4/12`)} 
        {...register("num_repeat", {valueAsNumber: true})}/>
        <p>回</p>
      </div>
    </div>   
  )
}