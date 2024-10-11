import {fs} from '@tauri-apps/api';
import * as math from 'mathjs';


// JSONのテスト結果ファイルのインターフェース==========================
interface MosScore {
    category: string;
    score_type: "Valid" | "Dummy";
    audio_file_path: string;
    score: number,
}


// MOSの集計=====================================================================
//==============================================================================
// 回答結果から得点表を作成
const analyzeDataMos =(parsedData: MosScore[]): Record<string, number[]> => {

    let resultData: Record<string, number[]> = {};
    for(let d of parsedData as MosScore[]){
        if(! resultData[d.category]){
            resultData[d.category] = [d.score];
        }
        else{
            resultData[d.category] = [...resultData[d.category], d.score];
        }
    }
    return resultData
}

//==============================================================================
// 回答結果から得点表を作成
export const getResultTableMos = async (categories: string[], fileEntries: fs.FileEntry[]) => {

    let resultTable: Record<string, number[]> = {};

    // initialize resultTable
    categories.forEach(category => {
        resultTable[category] = [];
    })

    // result analysis---------------------------
    for(let entry of fileEntries){
        const jsonString = await fs.readTextFile(entry.path);
        const parsedData = JSON.parse(jsonString) as MosScore[];
        const analyzedData = analyzeDataMos(parsedData);
        for(let [category, scores] of Object.entries(analyzedData)){
            resultTable[category] = [...resultTable[category], ...scores]
        }
    }

    return resultTable
}

// 最終的な結果を計算==========================================================
export interface MosResultProperty {
    mean: number;
    std: number;
    stdErr: number;
}
export const getResultMos= (resultTable: Record<string, number[]>): Record<string, MosResultProperty> => {

    let result: Record<string, MosResultProperty>= {};
    for (let [category, scoreList] of Object.entries(resultTable)){
        const numData = scoreList.length;
        const mean = math.mean(scoreList);
        const std = math.std(scoreList, "unbiased") as number;
        const stdErr = std / (math.sqrt(numData) as number);

        const _score: MosResultProperty = {mean: mean, std: std, stdErr: stdErr};
        result[category] = _score;
    }

    return result
}