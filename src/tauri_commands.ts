import { invoke } from "@tauri-apps/api/tauri";

export type tauriTestType = "Mos" | "Thurstone";

export const testTypeToString = (testType: tauriTestType): string => {
  switch (testType) {
    case "Mos":
      return "平均オピニオン評価";
    case "Thurstone":
      return "一対比較法(サーストン法)";
  }
};

//テストマネージャをバックエンドから取得する関数================================
export const tauriGetSettings = (): Promise<{ [key: string]: any }> => {
  return invoke<string[]>("get_settings")
    .then((settings) => {
      let managers: { [key: string]: any } = {};
      for (let setting of settings) {
        let _obj = JSON.parse(setting);
        let _name = _obj["name"];
        managers[_name] = _obj;
      }
      return managers; // `managers` オブジェクトを返す
    })
    .catch((err) => {
      console.error(err);
      throw err; // エラーを再スロー
    });
};

export const tauriAddTest = async (
  testType: tauriTestType,
  jsonString: string
): Promise<void> => {
  return invoke("add_test", { test_type: testType, json_string: jsonString })
    .then(() => {})
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriEditTest = async (
  testName: string,
  jsonString: string
): Promise<void> => {
  return invoke("edit_test", { test_name: testName, json_string: jsonString })
    .then(() => {})
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriDeleteTest = async (testName: string): Promise<void> => {
  return invoke("delete_test", { test_name: testName })
    .then(() => {})
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriStartTest = async (
  testName: string,
  examineeName: string
): Promise<void> => {
  return invoke("start_test", { test_name: testName, examinee: examineeName })
    .then(() => {})
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriGetAudio = (): Promise<string[]> => {
  return invoke<string[]>("get_audio")
    .then((paths) => {
      return paths;
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriSetScore = (score: string[]): Promise<string> => {
  return invoke<string>("set_score", { score: score })
    .then((status) => {
      return status;
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriCloseTest = async (examineeName: string): Promise<void> => {
  return invoke("close_test", { examinee: examineeName })
    .then(() => {})
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriDeleteTrial = async (
  testName: string,
  examineeName: string
): Promise<void> => {
  return invoke("delete_trial", { test_name: testName, examinee: examineeName })
    .then(() => {})
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriStartPreview = async (testName: string): Promise<void> => {
  return invoke("start_preview", { test_name: testName })
    .then(() => {})
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export const tauriClosePreview = async (): Promise<void> => {
  return invoke("close_preview")
    .then(() => {})
    .catch((err) => {
      console.error(err);
      throw err;
    });
};
