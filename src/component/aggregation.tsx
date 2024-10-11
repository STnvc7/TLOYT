import { useContext, ReactNode, useState, useEffect, FC } from "react";
import {path, fs} from '@tauri-apps/api';
import { ResponsiveContainer, XAxis, YAxis,CartesianGrid, Cell, LabelList } from "recharts";
import { BarChart, Bar, ScatterChart, Scatter } from "recharts";

import "../App.css";
import { ListElement } from "./list.tsx";
import { SettingContext  } from "./context.tsx";
import { tauriTestType } from "../tauri_commands.ts"
import { MosResultProperty, getResultTableMos, getResultMos } from "../calc_aggregation/mos.ts";
import { getResultTableThurstone, getResultThurstone } from "../calc_aggregation/thurstone.ts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', 'red', 'pink'];

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
        {category: category, score: data.mean}
    ));

    return (
        <ResponsiveContainer width="90%" height={250}>
        <BarChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category"/>
            <YAxis domain={[0, 5]}/>
            <Bar dataKey="score" fill="#8884d8">
                {graphData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
        </BarChart>
        </ResponsiveContainer>
    )
}


//==============================================================================
interface ThurstoneResultTableProps {
    resultTable: Record<string, Record<string, number>>;
    result: Record<string, number>;
}
const ThurstoneResultTable: FC<ThurstoneResultTableProps> = ({resultTable, result}) => {
    return (
        <div className="w-10/12 flex flex-col space-y-6 justify-center">
            <div className="flex flex-col space-y-2">
                <ListElement>得点表</ListElement>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="py-2 w-1/4 border"></th>
                            {Object.keys(resultTable).map(category => (
                                <th key={category} className="py-2 w-1/4 border">{category}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>

                        {Object.entries(resultTable).map(([category_row, scoreList])=> (
                        <tr key={category_row} className="hover:bg-gray-100">
                          <td className="py-2 text-center font-bold border">{category_row}</td>
                          {Object.entries(scoreList).map(([_, score]) => (
                              <td className="py-2 text-center border">{score}</td>
                              ))}
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col space-y-2">
                <ListElement>尺度値</ListElement>
                <table>
                    <tbody>
                        {Object.entries(result).map(([category, score]) => (
                            <tr className="hover:bg-gray-100">
                                <td className="py-2 text-center border">{category}</td>
                                <td className="py-2 text-center border">{score.toFixed(3)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}


interface ThurstoneResultGraphProps {
    result: Record<string, number>;
}
const ThurstoneResultGraph: FC<ThurstoneResultGraphProps> = ({result}) => {
    

    const graphData = Object.entries(result).map(([category, value]) => (
        {category: category, score: value, y: 0}
    ));

    return (
        <ResponsiveContainer width="90%" height={100}>
        <ScatterChart data={graphData}>
            <XAxis type="number"dataKey="score"/>
            <YAxis type="number" dataKey="y" hide={true} />
            <Scatter data={graphData} shape="circle" size={100}>
               <LabelList dataKey="category" position="top" />
                {graphData.map((data, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Scatter>
        </ScatterChart>
        </ResponsiveContainer>
    )
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
                    setTable(<ThurstoneResultTable resultTable={resultTable} result={result}/>)
                    setGraph(<ThurstoneResultGraph result={result}/>)
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

    const [fileEntries, setFileEntries] = useState<fs.FileEntry[]>([]);
    const [examinees, setExaminees] = useState<string[]>([]);
    const categories = info.categories.names;

    useEffect(()=> {
        const fetchFileEntries= async() => {
            try{
                const _trialDataPath= await path.join(info.manager_data_root, "trials");
                const _fileEntries = await fs.readDir(_trialDataPath);
                const _fileNamesOptional = _fileEntries.map(fileEntry => (fileEntry.name));
                const _fileNames = _fileNamesOptional.filter((fileName):fileName is string => fileName !== undefined);
                const _examinees = _fileNames.map(fileName => (fileName.split('.')[0]));

                setExaminees(_examinees);
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
            <p className="text-xl font-bold mb-2 pb-1 border-b-2">集計結果</p>
            <p className="mb-4">回答者: {examinees.length}名 ({examinees.join(", ")})</p>
            <ResultCompornent testType={info.test_type} fileEntries={fileEntries} categories={categories} />
        </div>
    )
}