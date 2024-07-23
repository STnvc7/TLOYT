use crate::constants::{TEST_LIST_FILENAME, TEST_MANAGER_DIRNAME, TEST_MANAGER_SETTING_FILENAME};
use crate::test_manager::TestManager;
use crate::test_manager::{thurstone::ThurstoneManager, mos::MosManager};
use crate::test_trial::TrialStatus;

use std::collections::HashMap;
use std::io::Write;
use std::path::PathBuf;
use std::{fs, fs::File};

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};

//テストの種類
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum TestType {
    Mos,
    Thurstone,
}

/*アプリケーションをコントロールするマネージャ===================================
初期化；init()
設定の読み込み：setup()
新しいテストの追加：add_new_test()
テストの開始：start_test()

*/
pub struct ApplicationManager {
    managers: HashMap<String, Box<dyn TestManager>>, //TestManagerのインスタンスを保持
    app_data_root: PathBuf,
    test_list: HashMap<String, TestType>,
    active_test_name: Option<String>,
}
#[allow(dead_code)]
impl ApplicationManager {
    /*本アプリケーションのセットアップ．-----------------------------------------
    初回起動時(テストのリストがない) => init()
    以前作成したテストがある場合 => load()
    この構造体自体を返す．
    */
    pub fn setup(app_data_root: PathBuf) -> Result<ApplicationManager> {
        let managers: HashMap<String, Box<dyn TestManager>>;
        let test_list: HashMap<String, TestType>;

        let test_list_path = app_data_root.join(TEST_LIST_FILENAME);
        if test_list_path.exists() {
            let json_string = fs::read_to_string(test_list_path)?;
            test_list = serde_json::from_str(&json_string)?;
            managers = ApplicationManager::load(&test_list, app_data_root.clone())?;
        } else {
            ApplicationManager::init(app_data_root.clone())?;
            test_list = HashMap::new();
            managers = HashMap::new();
        }

        Ok(ApplicationManager {
            managers: managers,
            app_data_root: app_data_root,
            test_list: test_list,
            active_test_name: None
        })
    }

    /*作成済みのテストのテストマネージャをインスタンス化------------------------------------
     */
    fn load(
        test_list: &HashMap<String, TestType>,
        app_data_root: PathBuf,
    ) -> Result<HashMap<String, Box<dyn TestManager>>> {
        let mut managers: HashMap<String, Box<dyn TestManager>> = HashMap::new();

        for (t_name, t_type) in test_list.iter() {
            let manager_json_path = app_data_root
                .join(TEST_MANAGER_DIRNAME)
                .join(&t_name)
                .join(TEST_MANAGER_SETTING_FILENAME);
            let manager =
                ApplicationManager::load_test_from_json(t_type.clone(), manager_json_path)?;
            managers.insert(t_name.clone(), manager);
        }
        return Ok(managers);
    }

    //-------------------------------------------------
    fn load_test_from_json(
        test_type: TestType,
        setting_json_path: PathBuf,
    ) -> Result<Box<dyn TestManager>> {
        match test_type {
            TestType::Mos => Ok(Box::new(MosManager::from_json(setting_json_path)?)),
            TestType::Thurstone => {
                Ok(Box::new(ThurstoneManager::from_json(setting_json_path)?))
            }
        }
    }

    //-------------------------------------------------
    fn init(app_data_root: PathBuf) -> Result<()> {
        let test_list_path = app_data_root.join(TEST_LIST_FILENAME);

        let test_list: HashMap<String, TestType> = HashMap::new();
        let json_string = serde_json::to_string_pretty(&test_list)?;
        let mut file = File::create(test_list_path)?;
        file.write_all(json_string.as_bytes())?;

        Ok(())
    }

    //-------------------------------------------------
    pub fn add_test(&mut self, test_type: TestType, json_string: String) -> Result<()> {
        let new_manager: Box<dyn TestManager> = match test_type {
            TestType::Mos => Box::new(MosManager::setup(self.app_data_root.clone(), json_string)?),
            TestType::Thurstone => Box::new(ThurstoneManager::setup(
                self.app_data_root.clone(),
                json_string,
            )?),
        };

        let new_test_name = new_manager.get_name();
        if self.managers.contains_key(&new_test_name) {
            return Err(anyhow!("This test name has been used"));
        }

        new_manager.copy_categories()?;
        new_manager.save_setting()?;

        self.managers.insert(new_test_name.clone(), new_manager);
        self.test_list.insert(new_test_name, test_type);
        self.save_test_list()?;
        Ok(())
    }

    pub fn delete_test(&mut self, test_name: String) -> Result<()> {
        let test_data_dir = self
            .app_data_root
            .join(TEST_MANAGER_DIRNAME)
            .join(&test_name);
        if test_data_dir.exists() == false {
            return Err(anyhow!(format!("There is no test named {}", test_name)));
        }
        fs::remove_dir_all(test_data_dir)?;

        self.test_list.remove(&test_name);
        self.managers.remove(&test_name);
        self.save_test_list()?;
        Ok(())
    }

    pub fn delete_trial(&mut self, test_name: String, examinee: String) -> Result<()> {
        self.managers
            .get_mut(&test_name)
            .unwrap()
            .delete_trial(examinee)?;
        Ok(())
    }

    //-------------------------------------------------
    fn save_test_list(&self) -> Result<()> {
        let test_list_path = self.app_data_root.join(TEST_LIST_FILENAME);
        let json_string = serde_json::to_string_pretty(&self.test_list)?;
        let mut file = File::create(test_list_path)?;
        file.write_all(json_string.as_bytes())?;
        Ok(())
    }

    //-------------------------------------------------
    pub fn start_test(&mut self, test_name: String, examinee: String) -> Result<()> {
        self.managers
            .get_mut(&test_name)
            .unwrap()
            .launch_trial(examinee)?;
        self.active_test_name = Some(test_name);

        Ok(())
    }

    //-------------------------------------------------
    pub fn close_test(&mut self, examinee: String) -> Result<()> {
        let test_name = self.active_test_name.as_mut().unwrap().clone();
        self.managers
            .get_mut(&test_name)
            .unwrap()
            .close_trial(examinee)?;
        Ok(())
    }

    pub fn start_preview(&mut self, test_name: String) -> Result<()> {
        self.managers
            .get_mut(&test_name)
            .unwrap()
            .launch_preview()?;
        Ok(())
    }

    pub fn close_preview(&mut self) -> Result<()> {
        let test_name = self.active_test_name.as_mut().unwrap().clone();
        self.managers.get_mut(&test_name).unwrap().close_preview()?;
        Ok(())
    }

    pub fn edit_test(&mut self, test_name: String, json_string: String) -> Result<()> {
        self.managers
            .get_mut(&test_name)
            .unwrap()
            .edit(json_string)?;
        Ok(())
    }

    //-------------------------------------------------
    pub fn get_audio(&mut self) -> Result<PathBuf> {
        let test_name = self.active_test_name.as_mut().unwrap().clone();
        let audio_path = self.managers.get_mut(&test_name).unwrap().get_audio()?;
        Ok(audio_path)
    }

    //-------------------------------------------------
    pub fn set_score(&mut self, score: Vec<isize>) -> Result<TrialStatus> {
        let test_name = self.active_test_name.as_mut().unwrap().clone();
        let status = self
            .managers
            .get_mut(&test_name)
            .unwrap()
            .set_score(score)?;
        Ok(status)
    }

    pub fn get_settings(&self) -> Result<Vec<(TestType, String)>> {
        let mut settings: Vec<(TestType, String)> = Vec::new();
        for (_name, _type) in self.test_list.iter() {
            let setting = self.managers.get(_name).unwrap().get_setting()?;
            settings.push((_type.clone(), setting));
        }
        Ok(settings)
    }
}
