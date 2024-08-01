import { invoke } from "@tauri-apps/api/tauri";

//テストマネージャをバックエンドから取得する関数================================
export const tauriGetSettings = async (): Promise<{ [key: string]: any }> => {
    let managers: { [key: string]: any } = {};
    try {
      const settings = await invoke<string[]>("get_settings");
      for (let setting of settings) {
        let _obj = JSON.parse(setting);
        let _name = _obj["name"];
        managers[_name] = _obj;
      }
    } catch (err) {
      console.error(err);
    }
  
    return managers;
};

export const tauriGetAudio = async (): Promise<string[]> => {
    try {
        const paths = await invoke<string[]>("get_audio");
        return paths;
    } catch (err) {
        console.error(err);
        return []; // エラーが発生した場合、空の配列を返す
    }
};

export const tauriSetScore = async (score: string[]): Promise<string> => {
    try {
        const status = await invoke<string>('set_score', {score: score});
        return status
    } catch (err) {
        console.error(err);
        return ""
    }
}

export const tauriCloseTest = async (examineeName: string): Promise<void> => {
    try {
        await invoke('close_test', {examinee: examineeName});
    } catch (err) {
        console.error(err);
    }
}