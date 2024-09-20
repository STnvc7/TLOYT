import { useContext, useEffect, useState, FC, ReactNode } from "react";
import {path, fs} from '@tauri-apps/api';

import "../App.css";
import { SettingContext  } from "./context.tsx";
import { tauriTestType } from "../tauri_commands.ts";

// JSONのテスト結果ファイルのインターフェース==========================
type ScoreType = "Valid" | "Dummy"; 
interface MosScore {
    category: string;
    score_type: ScoreType;
    audio_file_path: string;
    score: number,
}


interface ThurstoneScore {
    category_a: string;
    audio_file_path_a: string;
    category_b: string;
    audio_file_path_b: string;
    prefer_to: string;
}

type TestScore = MosScore | ThurstoneScore;

//=====================================================================

//==================================================================================
const readTrialDir = (manager_data_root: string): Promise<fs.FileEntry []> => {
    
    // テストマネージャのtrialsディレクトリにある回答結果ファイルのパスをFileEntryのリストで取得
    return path.join(manager_data_root, "trials").then((trialDataPath) => {
        return fs.readDir(trialDataPath)
    }).then((fileEntry) => {
        return fileEntry
    }).catch((e) => {throw e});
}


const parseJSON = (examinee: string, testType: tauriTestType, jsonString: string):  TestScore[] => {
    switch (testType) {
        case "Mos": {
            const parsedData = JSON.parse(jsonString) as MosScore[];
            let resultData = {}
            for(let d of parsedData){
                
            }
            return parsedData
        }
        case "Thurstone": {
            return JSON.parse(jsonString) as ThurstoneScore[]
        }
    }
}
const getResultTable = async (testType: tauriTestType, fileEntry: fs.FileEntry[]) => {

    for(let entry of fileEntry){
        const jsonString = await fs.readTextFile(entry.path);
        const examinee = await path.basename(entry.path, ".json");
        const parsedData = parseJSON(examinee, testType, jsonString);
        console.log(examinee, parsedData);
    }
}

export const Aggregation = ()=> {
    const settingContext = useContext(SettingContext);
    if (settingContext === undefined) return;
    const info = settingContext.info;

    readTrialDir(info.manager_data_root).then((fileEntry) => {
        getResultTable(info.test_type, fileEntry);
    })

    return (
        <div>
            集計結果
        </div>
    )
}