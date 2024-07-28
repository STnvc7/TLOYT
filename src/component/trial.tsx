import { useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoIosArrowRoundBack } from "react-icons/io";
import { PiSpeakerHighFill } from "react-icons/pi";

import { invoke, convertFileSrc } from "@tauri-apps/api/tauri";
import { appDataDir, join } from '@tauri-apps/api/path';
import { Howl, Howler } from 'howler';

import "../App.css";
import { AppContext, TrialContext, TrialProvider, TrialStatus } from "./context.tsx";
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
			<div className="flex w-2/5 bg-gray-100 p-8">
        <TestAbstract/>
	    </div>
	    <div className="flex w-3/5 p-8 items-center">
				<Answer/>
			</div>
		</div>
	);
};


//テストの概要を表示するコンポーネント==============================================
const TestAbstract=(): ReactNode =>{
	const context = useContext(TrialContext);
	// jsx---------------------------------------------------------------
	return (
		<div className="overflow-auto">
			{context.status!=TrialStatus.Doing ? (<BackToHomeButton/>) : (null)}
			<p className="text-xl text-left font-medium text-black">{context.testName}</p>
			<p className="text-left text-gray-400 pb-6">{convertTestType(context.info.test_type)}</p>
			<p className="break-all">{context.info.description}</p>
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
	const context = useContext(TrialContext);

	const elem = () => {
		switch (context.status) {
		case TrialStatus.Ready:
			return <ReadyTrial/>
		case TrialStatus.Doing:
			return <Score/>
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

// 受験者を選択するコンポーネント=================================================
const ReadyTrial=(): ReactNode=>{
	const context = useContext(TrialContext);
	const [selectedExaminee, setSelectedExaminee] = useState<string>();
	const [option, setOption] = useState<ReactNode[]>();

	// 受験者を選択するセレクタのオプションとなるReactNodeのリストを生成---------------
	useEffect(()=>{
		let l: ReactNode[] = [<option key="" value="">受験者を選択</option>]
		for (let [name, status] of Object.entries(context.info.participants)) {
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
	      await invoke("start_test", {test_name: context.testName, examinee: selectedExaminee })
	      .catch(err => console.error("Error invoking start_test:", err));
	      context.setExamineeName(selectedExaminee);
	      context.setStatus(TrialStatus.Doing);
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
	const context = useContext(TrialContext);

	const switchScore= ()=> {
		switch (context.info.test_type) {
		case "Mos":
			return <MosScore/>
		case "Thurstone":
			return <ThurstoneScore/>
		default:
			return null
		}
	}
	// jsx---------------------------------------------------------------
	return (
		<div className="justify-center items-center">
			{switchScore()}
		</div>
	);
};

// 回答コンポーネントの状態を示す列挙型============================================
enum AnswerState{
	Preparing,
	Ready,
	AudioPlaying,
	Answering,
	Finished
}

// MOSテストの回答ページ====================================================
const MosScore=(): ReactNode=>{
	const context = useContext(TrialContext);
	const [state, setState] = useState<AnswerState>(AnswerState.Preparing);
	const [count, setCount] = useState<number>(1);
	const [selectedScore, setSelectedScore] = useState<number>(0);
	const [sound, setSound] = useState<Howl|null>(null);

	// 音声ファイルをバックエンドから取得してくる-----------------------------
	const getSound= async() => {
		await invoke('get_audio').then((paths) => {
			const path = paths[0];
	    const _sound = new Howl({
	      src: convertFileSrc(path),
	      onend: () => { setState(AnswerState.Answering);}
	    });
	    setSound(_sound);
		}).catch((err) => console.error(err));
	};

	const setScore= async() => {
		await invoke('set_score', {score: [String(selectedScore)]}).then((result_status) => {
			switch (result_status) {
			case "Doing":
				setCount((prevCount) => prevCount + 1);
				setState(AnswerState.Preparing);
				break;
			case "Done":
				closeTrial();
				break;
			}
		}).catch((err) => console.error(err));
	};

	const closeTrial= async() =>{
		await invoke('close_test', {examinee: context.examineeName}).then(() => {
			context.setStatus(TrialStatus.Finished);
		}).catch((err) => console.error(err));
	}

	// stateが変更されたときの処理----------------------------------
	useEffect(()=>{
		switch (state) {
			case AnswerState.Preparing:
				getSound().then(()=> setState(AnswerState.Ready));
				break;
			case AnswerState.Ready:
				sound.play();
				setState(AnswerState.AudioPlaying);
				break;
			case AnswerState.Finished:
				setScore();
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
			(<div key={i} className="flex flex-col items-center">
        <input type='radio' name='score' value={i+1}
        defaultChecked={i===2} onChange={() => setSelectedScore(i+1)} />
        <label htmlFor={i} className="text-center">{label}</label>
    	</div>)
    	l.push(elem);
		}
		return l
	}

	// jsx---------------------------------------------------------------
	return (
	    <div>
	    	<div className="pb-8 text-large text-gray-500">
	    		受験者：{context.examineeName}
	    	</div>
	    	<div className="pb-8 flex flex-row justify-start items-center">
		    	<p className="pr-8 text-3xl">{count}.</p>
		    	<PiSpeakerHighFill  size={30} className=
		    	{state == AnswerState.AudioPlaying ? 
		    	"animate-pulse text-blue-700" : "opacity-0"}/>
	    	</div>
	      <form id="score_form" method="Post" 
	      className="w-full pb-12 self-center flex flex-row justify-around">
	      	{getInput()}
	      </form>
				<div className="w-full self-center border-t-2">
	    		<p className="py-4">回答時間</p>
			    <ProgressBar time_limit={context.info.time_limit} state={state}
			    onEnd={() => setState(AnswerState.Finished)}/>
		    </div>
	    </div>
	);
};


// サーストン法の回答ページ====================================================
const ThurstoneScore=(): ReactNode=>{
	const context = useContext(TrialContext);
	const [state, setState] = useState<AnswerState>(AnswerState.Preparing);
	const [count, setCount] = useState<number>(1);
	const [selectedScore, setSelectedScore] = useState<string>("0");
	const [sound, setSound] = useState<Howl[]>([]);
	const [ABIndex, setABIndex] = useState<string>('A');

	// 音声ファイルをバックエンドから取得してくる-----------------------------
	const getSound= async() => {
		await invoke('get_audio').then((paths) => {
	    const sound_a = new Howl({
	      src: convertFileSrc(paths[0]),
	      onend: () => { setTimeout(()=>{setState(AnswerState.Ready); setABIndex("B");}, 2000);}
	    });
	    const sound_b = new Howl({
	      src: convertFileSrc(paths[1]),
	      onend: () => { setState(AnswerState.Answering); setABIndex("A");}
	    });
	    setSound([sound_a, sound_b]);
		}).catch((err) => console.error(err));
	};

	const setScore= async() => {
		await invoke('set_score', {score: [String(selectedScore)]}).then((result_status) => {
			if (result_status === "Doing"){
				setCount((prevCount) => prevCount + 1);
				setState(AnswerState.Preparing);		
			}
			else if (result_status === "Done"){
				closeTrial();
			}
		}).catch((err) => console.error(err));
	};

	const closeTrial= async() =>{
		await invoke('close_test', {examinee: context.examineeName}).then(() => {
			context.setStatus(TrialStatus.Finished);
		}).catch((err) => console.error(err));
	}

	// stateが変更されたときの処理----------------------------------
	useEffect(()=>{
		switch (state) {
			case AnswerState.Preparing:
				getSound().then(()=> setState(AnswerState.Ready));
				break;
			case AnswerState.Ready:
				if (ABIndex === "A") {
					sound[0].play();
					setState(AnswerState.AudioPlaying);
				}
				else if (ABIndex === "B"){
					sound[1].play();
					setState(AnswerState.AudioPlaying);
				}
				break;
			case AnswerState.Finished:
				setScore();
				break;
			default:
				break;
		}
	}, [state]);

	// jsx---------------------------------------------------------------
	return (
	    <div>
	    	<div className="pb-8 text-large text-gray-500">
	    		受験者：{context.examineeName}
	    	</div>
	    	<div className="flex flex-row justify-start items-center">
		    	<p className="text-3xl">{count}.</p>
	    	</div>
	      <form id="score_form" method="Post" 
	      className="w-full pb-6 self-center flex flex-row justify-around">
					<div key="A" className="flex flex-col items-center space-y-4">
						<PiSpeakerHighFill  size={30} className=
			    	{(state == AnswerState.AudioPlaying) && ABIndex=="A" ? 
			    	"animate-pulse text-blue-700" : "opacity-0"}/>
        		<input type='radio' name='score' value="0" onChange={()=>setSelectedScore("0")} defaultChecked/>
        		<label htmlFor="A" className="text-center text-2xl">A</label>
    			</div>
					<div key="B" className="flex flex-col items-center space-y-4">
						<PiSpeakerHighFill  size={30} className=
			    	{(state == AnswerState.AudioPlaying) && ABIndex=="B" ? 
			    	"animate-pulse text-blue-700" : "opacity-0"}/>
        		<input type='radio' name='score' value="1" onChange={()=>setSelectedScore("1")} />
        		<label htmlFor="B" className="text-center text-2xl">B</label>
    			</div>
	      </form>
	    	<div className="w-full self-center border-t-2">
	    		<p className="py-4">回答時間</p>
			    <ProgressBar time_limit={context.info.time_limit} state={state}
			    onEnd={() => setState(AnswerState.Finished)}/>
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
  	if (props.state != AnswerState.Answering) return;

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
    }
  }, [props.state]);

  useEffect(() => {
	  if (progress === 100) {
    	setProgress(0);
    	props.onEnd();
    }
  }, [progress]);

  return (
  	<div className='relative h-2 w-full'>
	    <div className="absolute top-0 left-0 h-full w-full rounded-lg bg-gray-300"></div>
	    <div className="absolute top-0 left-0 h-full rounded-lg bg-blue-500 
	    	transition-all ease-in-out"
	      style={{ width: `${progress}%` }}
	    ></div>
	    <div className="pt-2 w-full flex flex-row justify-between">
		    <p>0 秒</p>
		    <p>{time_limit / 2000} 秒</p>
		    <p>{time_limit / 1000} 秒</p>
		  </div>
    </div>
  );
};