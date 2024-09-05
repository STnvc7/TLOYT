import { useContext, useEffect, useState, FC, ReactNode } from "react";
import {path, fs} from '@tauri-apps/api';

import "../App.css";
import { SettingContext  } from "./context.tsx";
import { TextButton, RemoveButton} from "./button.tsx";
import { ListElement } from "./list.tsx";

// export const Aggregation = ()=> {
//     const settingContext = useContext(SettingContext);
//     if (settingContext === undefined) return;
//     const info = settingContext.info;
//     const trialDataPath = path.join(info.manager_data_root, "trials");
    

//     return (
//         <div className="flex items-center justify-center">
//         </div>
//     )
// }

export const Aggregation = ()=> {
    const settingContext = useContext(SettingContext);
    if (settingContext === undefined) return;
    const info = settingContext.info;

    const fileEntry = 
    path.join(info.manager_data_root, "trials").then((trialDataPath) => {
        console.log(trialDataPath);
        return fs.readDir(trialDataPath)
    }).then((fileEntry) => {
        console.log(fileEntry);
        return fileEntry
    });

    switch (info.test_type) {
        case "Mos": {
            break;
        }
        case "Thurstone": {
            break;
        }
    }

    return (
        <div>
            集計結果
        </div>
    )
}

const aggregateMosScore = (trialDataPath: string)=> {

}