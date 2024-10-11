import { useContext, useState, useEffect, ReactNode, FC } from 'react';

import { tauriCloseTest, tauriClosePreview } from '../../tauri_commands.ts';
import { TrialContext, TrialStatus } from "../context.tsx";

import { MosAnswer } from "./mos.tsx";
import { ThurstoneAnswer } from "./thurstone.tsx";

// 回答コンポーネントの状態を示す列挙型============================================
export enum AnswerState{
	Preparing,
	Ready,
	AudioPlaying,
	Answering,
	Finished
}

// 回答欄のコンポーネント========================================================
interface AnswerProps {
	preview?: boolean;
}
export const Answer: FC<AnswerProps> =({preview}) =>{
	const trialContext = useContext(TrialContext);
	if (trialContext === undefined){
		return null
	}

	const closeTrial= async() =>{
		if (trialContext.examineeName === undefined){
			return
		}
		tauriCloseTest(trialContext.examineeName).then(() => {
			trialContext.setStatus(TrialStatus.Finished);
		}).catch((err) => console.error(err));
	}
	
	const closePreview = async() => {
		tauriClosePreview().then(() => {
		  console.log("プレビューを終了")
		}).catch((e) => console.error(e));
	}

	
	const onClose = preview === true ? closePreview : closeTrial;

	const scoreMap: {[key: string]: ReactNode} = {
		"Mos": <MosAnswer onClose={onClose}/>,
		"Thurstone": <ThurstoneAnswer onClose={onClose}/>
	}
	// jsx---------------------------------------------------------------
	return (
		<div className="justify-center items-center">
			{scoreMap[trialContext.info.test_type]}
		</div>
	);
};




// 制限時間のプログレスバー=======================================================
interface ProgressBarProps {
	timeLimit: number;
	state: AnswerState;
	onEnd: ()=>void;
}
export const ProgressBar: FC<ProgressBarProps> = ({timeLimit, state, onEnd}) => {
  const [progress, setProgress] = useState(0);
  const interval: number = 100;
  const timeLimitMS: number = timeLimit * 1000;
  const delta: number = 100 * interval / timeLimitMS;

  useEffect(() => {
  	if (state != AnswerState.Answering) return;

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
  }, [state]);

  useEffect(() => {
	  if (progress === 100) {
    	setProgress(0);
    	onEnd();
    }
  }, [progress]);

  return (
  	<div className="w-full h-32 py-2 px-4 self-center">
    	<p className="my-4">回答時間</p>

			<div className='relative h-2 w-full'>
			  <div className="absolute top-0 left-0 h-full w-full rounded-lg bg-gray-300"/>
			  <div className="absolute top-0 left-0 h-full rounded-lg bg-blue-500 transition-all ease-in-out"
			    style={{ width: `${progress}%` }}/>

			  <div className="pt-2 w-full flex flex-row justify-between">
			    <p>0 秒</p>
			    <p>{timeLimitMS / 2000} 秒</p>
			    <p>{timeLimitMS / 1000} 秒</p>
			  </div>
			</div>
		</div>
  );
};