import { useContext, useState, ReactNode, ChangeEvent, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoIosArrowRoundBack } from "react-icons/io";
import { invoke } from "@tauri-apps/api/tauri";

import "../App.css";
import { TrialContext, TrialProvider, TrialStatus } from "./context.tsx";
import { TextButton } from "./button.tsx";
import { Answer } from './answer.tsx';
import { testTypeToString, tauriStartTest } from '../tauri_commands.ts';
import { MarkdownRenderer } from './markdown.tsx';


/*==============================================================
## TrialProvider----------------------------
トライアルにおける情報を保存するTrialContextの母体
TrialContextのメンバ
- testName（テスト名）
- examineeeName（受験者）, setExamineeName
- info（テスト自体の情報(時間制限などを見るため)
- status（テストの進行状態 Ready, Doing, Finishedのどれか）, setStatus
*/
export const TrialFromURL=() => {
	const {test, examinee} = useParams(); //URLからテスト名を取得
	if (test === undefined || examinee === undefined) {
		return null
	}
	return (
		<Trial test={test} examinee={examinee}/>
	);
};

interface TrialProps {
	test: string;
	examinee: string;
}
export const Trial: FC<TrialProps> = ({test, examinee})=> {
	return (
		<TrialProvider test={test} examinee={examinee}>
			<TrialComponent/>
		</TrialProvider>
	);	
}


/*==================================================================
テスト画面のコンポーネント．画面を横に分けて左側にテストの概要を表示，右側で回答
*/
const TrialComponent=() =>{
	// jsx---------------------------------------------------------------
	return (
		<div className="flex h-screen">
			<div className="flex w-2/5 bg-gray-100 p-6">
				<TestAbstract/>
			</div>
			<div className="flex w-3/5 p-8 items-center">
				<AnswerComponent/>
			</div>
		</div>
	);
};


/*=======================================================================
テスト名，テストの種類，テストの説明を表示する
テストが始まっていなければ，戻るボタンを表示しておく
*/
const TestAbstract=() =>{
	const trialContext = useContext(TrialContext);
	if (trialContext === undefined){
		return null
	}

	// jsx---------------------------------------------------------------
	return (
		<div className="overflow-auto flex flex-col">
			{trialContext.status!=TrialStatus.Doing ? (<BackToHomeButton/>) : (null)}
			<p className="text-xl text-left font-medium text-black">{trialContext.testName}</p>
			<p className="text-left text-gray-400 pb-5 border-b-2">{testTypeToString(trialContext.info.test_type)}</p>
			<div className="pt-5 prose">
				<MarkdownRenderer>{trialContext.info.description}</MarkdownRenderer>
			</div>
		</div>
	);
};

// ホームに戻る矢印のボタン======================================================
const BackToHomeButton=()=>{
  const navigate = useNavigate();
  const backToHome=()=>{
    navigate('/');
  }
  // jsx---------------------------------------------------------------
  return (
      <button className="pb-6 text-blue-500 transform duration-500 hover:text-blue-700">
      <IoIosArrowRoundBack size={30} onClick={backToHome}/>
      </button>
  );
}

/*===================================================================
回答欄のコンポーネント
テストが始まっていない		-> 受験者の選択画面を表示
テスト中							-> 回答欄を表示
テストが終了					-> 協力ありがとうございましたの画面
*/
const AnswerComponent=()=>{
	const trialContext = useContext(TrialContext);
	if (trialContext === undefined){
		return null;
	}

	const elem = () => {
		switch (trialContext.status) {
		case TrialStatus.Ready:
			return <ReadyTrial/>
		case TrialStatus.Doing:
			return <Answer/>
		case TrialStatus.Finished:
			return (
				<div className="text-center text-bold text-lg">
					ご協力ありがとうございました。
				</div>
			)
		} 
	}

	// jsx---------------------------------------------------------------
	return (
		<div className="w-full">
			{elem()}
		</div>
	);
};

/*=======================================================================
受験者を選択するコンポーネント
セレクタから受験者を選択し，テスト開始ボタンが押されるとテストが開始される
*/
const ReadyTrial=()=>{
	const trialContext = useContext(TrialContext);
	if (trialContext === undefined) return;

	const defaultExaminee = trialContext.examineeName !== undefined ? trialContext.examineeName : "undefined";
	const [selectedExaminee, setSelectedExaminee] = useState<string>(defaultExaminee);

	// 受験者を選択するセレクタのオプションとなるReactNodeのリストを生成---------------
	const getParticipantOption = ()=>{
		let l: ReactNode[] = [<option key="" value="undefined">受験者を選択</option>]
		for (let [name, status] of Object.entries(trialContext.info.participants)) {
			if (status!='Done') l.push(<option key={name} value={name}>{name}</option>);
		}
		return l
	};

	const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
	    setSelectedExaminee(event.target.value);
	};

	// テストを開始する----------------------------------------------------
	const startTrial= async ()=>{
	    if (selectedExaminee !== "undefined") {
			await invoke("start_test", {test_name: trialContext.testName, examinee: selectedExaminee })
			.catch(err => console.error("Error invoking start_test:", err));
			tauriStartTest(trialContext.testName, selectedExaminee).then(() => {
				trialContext.setExamineeName(selectedExaminee);
				trialContext.setStatus(TrialStatus.Doing);
			}).catch((e) => {
				alert(e);
			});
	    } else {
	      alert("受験者を選択してください");
	    }
	}

	// jsx---------------------------------------------------------------
	return (
		<div className="flex flex-row space-x-8 justify-center">
			<select name="examinee" id="examinee-select"
			onChange={handleSelectChange} value={selectedExaminee}
			className="px-3 border-2 rounded-lg">
			  {getParticipantOption()}
			</select>
			<TextButton text="テストを開始"  className="py-2 px-4 font-bold" onClick={startTrial}/>
		</div>
	);
};