import { useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoIosArrowRoundBack } from "react-icons/io";

import { invoke, convertFileSrc } from "@tauri-apps/api/tauri";
import { Howl, Howler } from 'howler';

import "../App.css";
import { AppContext, TrialContext, TrialProvider } from "./context.tsx";
import { TestComponentButton } from "./button.tsx";
import { convertTestType } from "./utils.ts";


//トライアルを生成するコンポーネント=================================================
export const Trial=(): ReactNode => {
	const {test} = useParams();
	return (
		<TrialProvider test={test}>
			<TrialComponent/>
		</TrialProvider>
	);
};


//トライアル==================================================================
const TrialComponent=(): ReactNode =>{
	// jsx---------------------------------------------------------------
	return (
		<div className="flex h-screen">
			<div className="flex w-2/5 bg-gray-100 p-6">
        <TestAbstract/>
	    </div>
	    <div className="flex w-3/5 p-6 justify-center items-center">
				<Answer/>
			</div>
		</div>
	);
};


//テストの概要を表示するコンポーネント==============================================
const TestAbstract=(): ReactNode =>{
	const {testName, examineeName, setExamineeName, info} = useContext(TrialContext);
	const [isBegan, setIsBegan] = useState<boolean>(false);

	//テストが始まったら戻るボタンを消すためにisBeganを設定
	useEffect(()=>{
		if(examineeName != undefined) setIsBegan(true);
	}, [examineeName]);

	// jsx---------------------------------------------------------------
	return (
		<div className="overflow-auto">
			{isBegan ? (null) : (<BackToHomeButton/>)}
			<p className="text-xl text-left font-medium text-black">{testName}</p>
			<p className="text-left text-gray-400 pb-6">{convertTestType(info.test_type)}</p>
			<p className="break-all">{info.description}</p>
		</div>
	);
};

// ホームに戻る矢印のボタン======================================================
const BackToHomeButton=(): ReactNode =>{
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

//実際に回答をおこなうコンポーネント================================================
//最初の画面で受験者を選択し，テストを開始する
const Answer=(): ReactNode=>{
	const {testName, examineeName, setExamineeName, info} = useContext(TrialContext);
	const [isBegan, setIsBegan] = useState<boolean>(false);

	useEffect(()=>{
		if(examineeName != undefined) setIsBegan(true);
	}, [examineeName]);

	// jsx---------------------------------------------------------------
	return (
		<div className="w-full justify-center">
			{isBegan ? (<Score/>):(<ReadyTrial/>)}
		</div>
	);
};

// 受験者を選択するコンポーネント=================================================
const ReadyTrial=(): ReactNode=>{
	const {testName, examineeName, setExamineeName, info} = useContext(TrialContext);
	const [selectedExaminee, setSelectedExaminee] = useState<string>();
	const [option, setOption] = useState<ReactNode[]>();

	// 受験者を選択するセレクタのオプションとなるReactNodeのリストを生成---------------
	useEffect(()=>{
		let l: ReactNode[] = [<option key="" value="">受験者を選択</option>]
		for (let [name, status] of Object.entries(info.participants)) {
			if (status!='Done') l.push(<option key={name} value={name}>{name}</option>);
		}
		setOption(l);
	}, []);

	const handleSelectChange = (event) => {
	    setSelectedExaminee(event.target.value);
	};

	// テストを開始する----------------------------------------------------
	const startTrial= async ()=>{
	    if (selectedExaminee) {
	      await invoke("start_test", {test_name: testName, examinee: selectedExaminee })
	      .catch(err => console.error("Error invoking start_test:", err));
	      setExamineeName(selectedExaminee);
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
			  {option}
			</select>
			<TestComponentButton text="テストを開始" onClick={startTrial}/>
		</div>
	);
};

// 回答欄のコンポーネント========================================================
const Score=(): ReactNode =>{
	const {testName, examineeName, setExamineeName, info} = useContext(TrialContext);
	// jsx---------------------------------------------------------------
	return (
		<div>
		<MosScore/>
		</div>
	);
};

// 回答コンポーネントの状態を示す列挙型============================================
enum ScoreState{
	Preparing,
	Ready,
	AudioPlaying,
	Answering
}


// MOSテストの回答ページ====================================================
const MosScore=(): ReactNode=>{
	const {testName, examineeName, setExamineeName, info} = useContext(TrialContext);
	const [state, setState] = useState<ScoreState>(ScoreState.Ready);
	const [count, setCount] = useState<number>(0);
	const [sound, setSound] = useState<Howl>();

	// 音声ファイルをバックエンドから取得してくる-----------------------------
	const getAudio= async ()=>{
		await invoke('get_audio').then((paths) => {
			const path = paths[0]
	    const _sound = new Howl({
	      src: [convertFileSrc(path)],
	      onend: () => { setState(ScoreState.Answering); }
	    });
	    _sound.play();
	    setSound(_sound);
			setState(ScoreState.AudioPlaying);
		}).catch((err) => console.error(err));
	};

	// stateが変更されたときの処理----------------------------------
	useEffect(()=>{
		switch (state) {
			case ScoreState.Ready:
				getAudio();
				break;
			default:
				break;
		}
	}, [state]);

	// 回答のラジオボタンの要素を作成--------------------------------------------
	const getInput=(): ReactNode[] =>{
		const label_list: string[] = ["非常に悪い", "悪い", "普通", "良い", "非常に良い"];
		let l: ReactNode[] = [];

		for (let [i, label] of label_list.entries()){
			const elem = 	
			(<div key={i} className="p-1 w-1/6 flex flex-col items-center">
        <input type='radio' name='score' value={i+1 as string} defaultChecked={i==2}/>
        <label htmlFor={i} className="text-center text-sm">{label}</label>
    	</div>)
    	l.push(elem);
		}
		return l
	}

	// jsx---------------------------------------------------------------
	return (
	    <div className="flex flex-col space-y-4 items-center">
	      <form id="score_form" method="Post" className="flex flex-row space-x-4 justify-center">
	      	{getInput()}
	      </form>
	    	<div className="w-2/3">
			    <ProgressBar time_limit={info.time_limit} state={state} onEnd={setState}/>
		    </div>
	    </div>
	);
};


// 制限時間のプログレスバー=======================================================
const ProgressBar = (props): ReactNode => {
  const [progress, setProgress] = useState(0);
  const interval: number = 100;
  const time_limit: number = props.time_limit * 1000;
  const delta: number = 100 * interval / time_limit;

  useEffect(() => {
  	if (props.state != ScoreState.Answering) return;

    const intervalId = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(intervalId);
          return 100;
        }
        return prevProgress + delta;
      });
    }, interval);

    // クリーンアップ関数でタイマーをクリア
    return () => {
    	clearInterval(intervalId);
    	props.onEnd(ScoreState.Preparing);
    }
  }, [props.state]);

  return (
  	<div className='relative h-2 w-full'>
	    <div className="absolute top-0 left-0 h-full w-full rounded-lg bg-gray-300"></div>
	    <div className="absolute top-0 left-0 h-full rounded-lg bg-blue-500 
	    	transition-all ease-in-out"
	      style={{ width: `${progress}%` }}
	    ></div>
    </div>
  );
};