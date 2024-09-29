import { fs } from "@tauri-apps/api"


interface ThurstoneScore {
    category_a: string;
    audio_file_path_a: string;
    category_b: string;
    audio_file_path_b: string;
    prefer_to: string;
}

// サーストン法の集計===============================================================
//==============================================================================
// 回答結果から得点表を作成
const analyzeDataThurstone = (parsedData: ThurstoneScore[]): Record<string, Record<string, number>> => {
    
    let resultData: Record<string, Record<string, number>> = {}
    for(let d of parsedData){
        const win = d.prefer_to
        const loose = d.prefer_to == d.category_a ? d.category_b : d.category_a

        if (!resultData[win]) {
          resultData[win] = {}; // winが存在しなければ初期化
        }

        if (!resultData[win][loose]) {
          resultData[win][loose] = 0; // looseが存在しなければ 0 に初期化
        }

        resultData[win][loose] += 1;
    }
    return resultData
}

//====================================================================
// 回答結果の得点表を参加者ごとに集計してまとめる
export const getResultTableThurstone= async(categories: string[], fileEntries: fs.FileEntry[]) => {

    let resultTable: Record<string, Record<string, number>> = {};

    // initialize resultTable
    categories.forEach(category_r => {
        let row: Record<string, number> = {}
        categories.forEach(category_c => {
            row[category_c] = 0;
        })

        resultTable[category_r] = row;
    })

    //result analysis-------------------------------------
    for(let entry of fileEntries){
        const jsonString = await fs.readTextFile(entry.path);
        const parsedData = JSON.parse(jsonString) as ThurstoneScore[];

        const analyzedData = analyzeDataThurstone(parsedData);
        for(let [win, values] of Object.entries(analyzedData)){
            for(let [loose, score] of Object.entries(values)) {
                resultTable[win][loose] += score;
            }
        }
    }
    return resultTable
}


export const getResultThurstone= (resultTable: Record<string, Record<string, number>>): Record<String, number> => {
    
}