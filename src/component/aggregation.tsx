import { useContext, ReactNode, useState, useEffect, FC } from "react";
import {path, fs} from '@tauri-apps/api';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, CartesianGrid } from "recharts";


import "../App.css";
import { SettingContext  } from "./context.tsx";
import { tauriTestType } from "../tauri_commands.ts"
import { MosResultProperty, getResultTableMos, getResultMos } from "./calc_aggregation/mos.ts";
import { getResultTableThurstone, getResultThurstone } from "./calc_aggregation/thurstone.ts";



//=============================================================================
interface MosResultTableProps {
    result: Record<string, MosResultProperty>
}
const MosResultTable: FC<MosResultTableProps> =({result}) => {

    return (
        <table className="w-full">
            <thead>
                <tr>
                    <th className="py-2 w-1/4 border">カテゴリ</th>
                    <th className="py-2 w-1/4 border">平均</th>
                    <th className="py-2 w-1/4 border">標準偏差</th>
                    <th className="py-2 w-1/4 border">標準誤差</th>
                </tr>
            </thead>

            <tbody>
                {Object.entries(result).map(([category, data], index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="py-2 px-2 text-left border">{category}</td>
                  <td className="py-2 text-center border">{data.mean.toFixed(3)}</td>
                  <td className="py-2 text-center border">{data.std.toFixed(3)}</td>
                  <td className="py-2 text-center border">{data.stdErr.toFixed(3)}</td>
                </tr>
                ))}
            </tbody>

        </table>
    )
}

interface MosResultGraphProps {
    result: Record<string, MosResultProperty>
}
const MosResultGraph: FC<MosResultGraphProps> = ({result}) => {

    const graphData = Object.entries(result).map(([category, data]) => (
        {name: category, score: data.mean}
    ));

    return (
        <ResponsiveContainer width="100%" height={250}>
        <BarChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 5]}/>
            <Bar dataKey="score" fill="#8884d8" />
        </BarChart>
        </ResponsiveContainer>
    )
}


//==============================================================================
interface ThurstoneResultGraphProps {
    resultTable: Record<string, Record<string, number>>;
}
const ThurstoneResultGraph: FC<ThurstoneResultGraphProps> = ({resultTable}) => {

}


interface ResultComponentProps{
    testType: tauriTestType;
    fileEntries : fs.FileEntry[];
    categories: string[];
}
const ResultCompornent: FC<ResultComponentProps> = ({testType, fileEntries, categories}) => {

    const [graph, setGraph] = useState<ReactNode>(null);
    const [table, setTable] = useState<ReactNode>(null);

    useEffect(() => {
        if (fileEntries.length == 0) {
            return
        }

        const fetchResult=async() => {
            switch(testType) {
                case "Mos": {
                    const resultTable = await getResultTableMos(categories, fileEntries);
                    const result = await getResultMos(resultTable);
                    setTable(<MosResultTable result={result}/>)
                    setGraph(<MosResultGraph result={result}/>)
                    break;
                }
                case "Thurstone": {
                    const resultTable = await getResultTableThurstone(categories, fileEntries);
                    const result = getResultThurstone(resultTable);
                    break;
                }
            }
        };

        fetchResult();
    }, [fileEntries]);

    return (
        <div className="flex flex-col space-y-8 justify-center">
            {table}
            {graph}
        </div>
    )
};

// 集計結果を表示するコンポーネント==========================================
export const Aggregation = ()=> {
    const settingContext = useContext(SettingContext);
    if (settingContext === undefined) return null;
    const info = settingContext.info;

    const [fileEntries, setFileEntries] = useState<fs.FileEntry[]>([])
    const categories = info.categories.names;

    useEffect(()=> {
        const fetchFileEntries= async() => {
            try{
                const _trialDataPath= await path.join(info.manager_data_root, "trials");
                const _fileEntries = await fs.readDir(_trialDataPath);
                setFileEntries(_fileEntries)
            }
            catch (e){
                console.error(e);
            }
        }

        fetchFileEntries();
        
    }, [])

    return (
        <div>
            <ResultCompornent testType={info.test_type} fileEntries={fileEntries} categories={categories} />
        </div>
    )
}