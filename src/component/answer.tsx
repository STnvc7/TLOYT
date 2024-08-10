import { useContext, useState, useEffect, ReactNode, FC } from 'react';
import { PiSpeakerHighFill } from "react-icons/pi";

import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Howl } from 'howler';

import { tauriGetAudio, tauriSetScore, tauriCloseTest } from './tauri_commands.ts';
import { TrialContext, TrialStatus } from "./context.tsx";

// 回答欄のコンポーネント========================================================
export const Answer=() =>{
	const context = useContext(TrialContext);
	if (context === undefined){
		return null
	}

	const scoreMap: {[key in string]: ReactNode} = {
		"Mos": <MosAnswer/>,
		"Thurstone": <ThurstoneAnswer/>
	}
	// jsx---------------------------------------------------------------
	return (
		<div className="justify-center items-center">
			{scoreMap[context.info.test_type]}
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
const MosAnswer=()=>{
	const context = useContext(TrialContext);
	if (context === undefined){
		return null
	}

	const [state, setState] = useState<AnswerState>(AnswerState.Preparing);
	const [count, setCount] = useState<number>(1);
	const [selectedScore, setSelectedScore] = useState<number>(0);
	const [sound, setSound] = useState<Howl|undefined>(undefined);

	// 音声ファイルをバックエンドから取得してくる-----------------------------
	const getSound= async() => {
        await tauriGetAudio().then((paths) => {
            const path = paths[0];
            const _sound = new Howl({
                src: convertFileSrc(path),
                onend: () => { setState(AnswerState.Answering);} //再生終了したらAnsweringに移行
            });
	    setSound(_sound);
		}).catch((err) => console.error(err));
	};

    // スコア保存--------------------------------------------------------------
	const setScore= async() => {
		await tauriSetScore([String(selectedScore)]).then((result_status) => {
			switch (result_status) {
            //テスト継続 => カウントアップしてPreparingに戻る----------
			case "Doing":
				setCount((prevCount) => prevCount + 1);
				setState(AnswerState.Preparing);
				break;
            //テスト終了 => 終了処理----------------------------------
			case "Done":
				closeTrial();
				break;
			}
		}).catch((err) => console.error(err));
	};

    // テストの終了処理----------------------------------------------------------
	const closeTrial= async() =>{
        if (context.examineeName === undefined){
            return
        }
		await tauriCloseTest(context.examineeName).then(() => {
			context.setStatus(TrialStatus.Finished);
		}).catch((err) => console.error(err));
	}

	// stateが変更されたときの処理---------------------------------------------
	useEffect(()=>{
		switch (state) {
			case AnswerState.Preparing:
				getSound().then(()=> setState(AnswerState.Ready));
				break;
			case AnswerState.Ready:
				if(sound !== undefined){
					sound.play();
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

	// 回答のラジオボタンの要素を作成--------------------------------------------
	const getInput=(): ReactNode[] =>{
		const label_list: string[] = ["非常に悪い", "悪い", "普通", "良い", "非常に良い"];

		let l: ReactNode[] = [];
		for (let [i, label] of label_list.entries()){
			const elem = 	
			(<div key={i} className="flex flex-col items-center">
				<input type='radio' name='score' value={i+1}
				defaultChecked={i===2} onChange={() => setSelectedScore(i+1)} />
				<label htmlFor={String(i)} className="text-center">{label}</label>
			</div>)
    	l.push(elem);
		}
		return l
	}

	// jsx---------------------------------------------------------------
	return (
	    <div>
            {/* 受験者の名前表示-------------------------------------- */}
	    	<div className="pb-8 text-large text-gray-500">
	    		受験者：{context.examineeName}
	    	</div>
            {/* 何問目かの表示&再生中のアイコン------------------------ */}
	    	<div className="pb-8 flex flex-row justify-start items-center">
		    	<p className="pr-8 text-3xl">{count}.</p>
		    	<PiSpeakerHighFill  size={30} className=
		    	{state == AnswerState.AudioPlaying ? 
		    	"animate-pulse text-blue-700" : "opacity-0"}/>
	    	</div>
            {/* 回答フォーム------------------------------------------ */}
            <form id="score_form" method="Post" 
                className="w-full pb-12 self-center flex flex-row justify-around">
                {getInput()}
            </form>
            {/* 回答時間のプログレスバー------------------------------ */}
			<div className="w-full self-center">
	    		<p className="py-4">回答時間</p>
			    <ProgressBar time_limit={context.info.time_limit} state={state}
			    onEnd={() => setState(AnswerState.Finished)}/>
		    </div>
	    </div>
	);
};


// サーストン法の回答ページ====================================================
const ThurstoneAnswer=()=>{
	const context = useContext(TrialContext);
	if (context === undefined){
		return null
	}
	const [state, setState] = useState<AnswerState>(AnswerState.Preparing);
	const [count, setCount] = useState<number>(1);
	const [selectedScore, setSelectedScore] = useState<string>("0");
	const [sound, setSound] = useState<Howl[]>([]);
	const [ABIndex, setABIndex] = useState<string>('A');  //再生中(再生予定)の音声がABのどちらか

	// 音声ファイルをバックエンドから取得してくる-----------------------------
	const getSound= async() => {
		await tauriGetAudio().then((paths) => {
	    const sound_a = new Howl({
	      src: convertFileSrc(paths[0]),
          // 再生終了したらReadyに戻して2秒間隔をあける
	      onend: () => { setTimeout(()=>{setState(AnswerState.Ready); setABIndex("B");}, 2000);}
	    });
	    const sound_b = new Howl({
	      src: convertFileSrc(paths[1]),
          // 再生終了したらAnsweringに移行
	      onend: () => { setState(AnswerState.Answering); setABIndex("A");}
	    });
	    setSound([sound_a, sound_b]);
		}).catch((err) => console.error(err));
	};

    // スコアを保存-------------------------------------------------------------
	const setScore= async() => {
		await tauriSetScore([String(selectedScore)]).then((result_status) => {
			if (result_status === "Doing"){
				setCount((prevCount) => prevCount + 1);
				setState(AnswerState.Preparing);		
			}
			else if (result_status === "Done"){
				closeTrial();
			}
		}).catch((err) => console.error(err));
	};

    // テストの終了処理----------------------------------------------------------
	const closeTrial= async() =>{
        if (context.examineeName === undefined) {
            return
        }
		await tauriCloseTest(context.examineeName).then(() => {
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
            {/* 受験者の名前表示----------------------------------- */}
	    	<div className="pb-8 text-large text-gray-500">
	    		受験者：{context.examineeName}
	    	</div>
            {/* 何問目かの表示------------------------------------- */}
	    	<div className="flex flex-row justify-start items-center">
		    	<p className="text-3xl">{count}.</p>
	    	</div>
            {/* 回答フォーム--------------------------------------- */}
	        <form   id="score_form" method="Post" 
	                className="w-full pb-6 self-center flex flex-row justify-around">
                {/* Aの回答部分-------------------------------- */}
				<div key="A" className="flex flex-col items-center space-y-4">
					{/* 再生中はスピーカーアイコンを表示 */}
					<PiSpeakerHighFill  size={30} className=
			    	{(state == AnswerState.AudioPlaying) && ABIndex=="A" ? 
			    	"animate-pulse text-blue-700" : "opacity-0"}/>
        		    <input type='radio' name='scoreA' value="A" onChange={()=>setSelectedScore("A")} defaultChecked/>
        		    <label htmlFor="A" className="text-center text-2xl">A</label>
    			</div>
                {/* Bの回答部分-------------------------------- */}
				<div key="B" className="flex flex-col items-center space-y-4">
					{/* 再生中はスピーカーアイコンを表示 */}
					<PiSpeakerHighFill  size={30} className=
			    	{(state == AnswerState.AudioPlaying) && ABIndex=="B" ? 
			    	"animate-pulse text-blue-700" : "opacity-0"}/>
        		    <input type='radio' name='scoreB' value="B" onChange={()=>setSelectedScore("B")} />
        		    <label htmlFor="B" className="text-center text-2xl">B</label>
    			</div>
	        </form>
            {/* 回答時間のプログレスバー -------------------------------------- */}
	    	<div className="w-full self-center">
	    		<p className="py-4">回答時間</p>
			    <ProgressBar time_limit={context.info.time_limit} state={state}
			    onEnd={() => setState(AnswerState.Finished)}/>
		    </div>
	    </div>
	);
};


// 制限時間のプログレスバー=======================================================
interface ProgressBarProps {
	time_limit: number;
	state: AnswerState;
	onEnd: ()=>void;
}
const ProgressBar: FC<ProgressBarProps> = (props) => {
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
    return () => { clearInterval(intervalId); }
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