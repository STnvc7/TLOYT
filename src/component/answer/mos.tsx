import { useContext, useState, useEffect, ReactNode, FC } from 'react';
import { PiSpeakerHighFill } from "react-icons/pi";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Howl } from 'howler';

import { TrialContext } from "../context.tsx";
import { AnswerState, ProgressBar } from "./answer.tsx";
import { tauriGetAudio, tauriSetScore } from '../../tauri_commands.ts';


// MOSテストの回答ページ====================================================
interface MosAnswerProps {
	onClose: () => void;
}
export const MosAnswer: FC<MosAnswerProps>=(props)=>{
	const trialContext = useContext(TrialContext);
	if (trialContext === undefined){
		return null
	}

	const [state, setState] = useState<AnswerState>(AnswerState.Preparing);
	const [count, setCount] = useState<number>(1);
	const [selectedScore, setSelectedScore] = useState<number>(3); //3 -> 普通
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
		await tauriSetScore([String(selectedScore)]).then((resultStatus) => {
			switch (resultStatus) {
            //テスト継続 => カウントアップしてPreparingに戻る----------
			case "Doing":
				setCount((prevCount) => prevCount + 1);
				setSelectedScore(3);
				setState(AnswerState.Preparing);
				break;
            //テスト終了 => 終了処理----------------------------------
			case "Done":
				props.onClose();
				return;
			}
		}).catch((err) => console.error(err));
	};

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
			(<div key={i} className="flex flex-col items-center w-1/5">
				<input type='radio' name='score' value={i+1}
				checked={i+1===selectedScore} onChange={() => setSelectedScore(i+1)} />
				<label htmlFor={String(i)} className="text-center">{label}</label>
			</div>)
    	l.push(elem);


		}
		return l
	}

	// jsx---------------------------------------------------------------
	return (
	    <div className="flex flex-col">
            {/* 何問目かの表示&再生中のアイコン------------------------ */}
	    	<div className="mb-10 pb-2 flex flex-row justify-start items-center border-b-2 border-gray-300">
		    	<p className="pr-8 text-3xl">{count}.</p>
		    	<PiSpeakerHighFill  size={30} className=
		    	{state == AnswerState.AudioPlaying ? 
		    	"animate-pulse text-blue-700" : "opacity-0"}/>
	    	</div>

	        {/* 回答フォーム------------------------------------------ */}
	        <div className="px-4 py-10 mb-9">
		        <form id="score_form" method="Post" 
		        className="w-full self-center flex flex-row justify-around">
		            {getInput()}
		        </form>
	        </div>
	        
	        {/* 回答時間のプログレスバー------------------------------ */}
		    <ProgressBar timeLimit={trialContext.info.time_limit} state={state}
		    onEnd={() => setState(AnswerState.Finished)}/>

	    </div>
	);
};