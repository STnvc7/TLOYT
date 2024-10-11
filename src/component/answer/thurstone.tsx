import { useContext, useState, useEffect, FC } from 'react';
import { PiSpeakerHighFill } from "react-icons/pi";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Howl } from 'howler';
import {Radio, RadioGroup} from '@headlessui/react';

import { TrialContext } from "../context.tsx";
import { AnswerState, ProgressBar } from "./answer.tsx";
import { tauriGetAudio, tauriSetScore } from '../../tauri_commands.ts';


interface ThurstoneAnswerProps {
	onClose: ()=> void;
}
// サーストン法の回答ページ====================================================
export const ThurstoneAnswer: FC<ThurstoneAnswerProps> =(props)=>{
	const trialContext = useContext(TrialContext);
	if (trialContext === undefined){
		return null
	}
	const [state, setState] = useState<AnswerState>(AnswerState.Preparing);
	const [count, setCount] = useState<number>(1);
	const [selectedScore, setSelectedScore] = useState<'A'|'B'>('A');
	const [sound, setSound] = useState<Howl[]>([]);
	const [ABIndex, setABIndex] = useState<'A'|'B'>('A');  //再生中(再生予定)の音声がABのどちらか

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
	      onend: () => { setTimeout(()=>{setState(AnswerState.Answering); setABIndex("A");}, 2000);}
	    });
	    setSound([sound_a, sound_b]);
		}).catch((err) => console.error(err));
	};

    // スコアを保存-------------------------------------------------------------
	const setScore= async() => {
		await tauriSetScore([String(selectedScore)]).then((resultStatus) => {
			if (resultStatus === "Doing"){
				setCount((prevCount) => prevCount + 1);
				setSelectedScore('A');
				setState(AnswerState.Preparing);		
			}
			else if (resultStatus === "Done"){
				props.onClose();
			}
		}).catch((err) => console.error(err));
	};

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
        {/* 何問目かの表示------------------------------------- */}
	    	<div className="mb-10 pb-2 items-center border-b-2 border-gray-300">
		    	<p className="text-3xl">{count}.</p>
	    	</div>

         	{/* 回答フォーム--------------------------------------- */}
	      	<RadioGroup value={selectedScore} onChange={setSelectedScore}
				className="w-full mb-10 self-center flex flex-row justify-around">
          		{/* Aの回答部分-------------------------------- */}
				<div key="A" className="flex flex-col items-center space-y-2">
						{/* 再生中はスピーカーアイコンを表示 */}
					<PiSpeakerHighFill  size={30} className=
			    		{(state == AnswerState.AudioPlaying) && ABIndex=="A" ? 
			    		"animate-pulse text-blue-700" : "opacity-0"}/>
					<Radio value='A' className="px-8 py-4 rounded-lg cursor-pointer text-center text-2xl bg-gray-50 data-[checked]:bg-blue-500 data-[checked]:text-white">A</Radio>
    			</div>

          			{/* Bの回答部分-------------------------------- */}
				<div key="B" className="flex flex-col items-center space-y-2">
						{/* 再生中はスピーカーアイコンを表示 */}
					<PiSpeakerHighFill  size={30} className=
				    	{(state == AnswerState.AudioPlaying) && ABIndex=="B" ? 
				    	"animate-pulse text-blue-700" : "opacity-0"}/>
					<Radio value='B' className="px-8 py-4 rounded-lg cursor-pointer text-center text-2xl bg-gray-50 data-[checked]:bg-blue-500 data-[checked]:text-white">B</Radio>
    			</div>
	      	</RadioGroup>

        	{/* 回答時間のプログレスバー -------------------------------------- */}
		    <ProgressBar timeLimit={trialContext.info.time_limit} state={state}
		    onEnd={() => setState(AnswerState.Finished)}/>
	    </div>
	);
};