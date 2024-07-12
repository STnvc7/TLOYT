use crate::path_name::{CATEGORIES_DIRNAME, TEST_MANAGER_DIRNAME, TEST_MANAGER_SETTING_FILENAME};
use crate::test_core::{Category, Participant};
use crate::test_trial::{mos::MOSTrial, TestTrial};

use std::io::Write;
use std::path::{Path, PathBuf};
use std::{fs, fs::File};

use anyhow::{anyhow, Result};
use chrono::{Local, NaiveDate};
use serde::{Deserialize, Serialize};
use serde_json;

//===================================================
// struct that holds information necessary for test setup
// information is sent by the front end as serialized json and deserialized to this struct
#[derive(Serialize, Deserialize, Debug)]
struct SetupInfo {
    name: String,
    author: String,
    description: String,
    participants: Vec<String>,
    categories: Vec<(String, PathBuf)>,

    time_limit: usize,
    num_repeat: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MOSManager {
    manager_data_root: PathBuf,
    name: String,
    author: String,
    created_date: NaiveDate,
    description: String,

    categories: Vec<Category>,
    participants: Vec<Participant>,

    time_limit: usize,
    num_repeat: usize,

    active_trial: Option<MOSTrial>,
}

#[allow(dead_code)]
impl MOSManager {
    fn new(
        manager_data_root: PathBuf,
        name: String,
        author: String,
        created_date: NaiveDate,
        description: String,
        categories: Vec<Category>,
        participants: Vec<Participant>,
        time_limit: usize,
        num_repeat: usize,
    ) -> MOSManager {
        MOSManager {
            manager_data_root: manager_data_root,
            name: name,
            author: author,
            created_date: created_date,
            description: description,
            categories: categories,
            participants: participants,
            time_limit: time_limit,
            num_repeat: num_repeat,
            active_trial: None,
        }
    }

    /*============================================================================
    設定や音声ファイルを保持するディレクトリを返す
    */
    fn get_manager_data_root<S: AsRef<Path>>(
        app_data_root: PathBuf,
        test_name: S,
    ) -> Result<PathBuf> {
        let mut data_root = app_data_root.join(TEST_MANAGER_DIRNAME);
        data_root = data_root.join(test_name);
        if data_root.exists() == false {
            fs::create_dir_all(&data_root)?;
        }
        return Ok(data_root);
    }

    /*============================================================================
    設定のjsonファイルからこの構造体を作成して返す
    既に作成されているテストを呼び出すために使用される
    */
    pub fn from_json(path_to_test_config: PathBuf) -> Result<MOSManager> {
        let json_string = fs::read_to_string(path_to_test_config)?;
        let this_test: MOSManager = serde_json::from_str(&json_string)?;
        return Ok(this_test);
    }

    /*============================================================================
    フロントエンドから渡されたStringから個の構造体を作成
    新しくテストを作成する際に呼び出される
    */
    pub fn setup(
        app_data_root: PathBuf,
        json_string_from_frontend: String,
    ) -> Result<MOSManager> {
        let info: SetupInfo = serde_json::from_str(&json_string_from_frontend)?;
        let manager_data_root = MOSManager::get_manager_data_root(app_data_root, &info.name)?;
        let created_date = Local::now().date_naive();
        let participants = MOSManager::setup_participants(info.participants);
        let categories = MOSManager::setup_categories(info.categories)?;

        return Ok(MOSManager::new(
            manager_data_root,
            info.name,
            info.author,
            created_date,
            info.description,
            categories,
            participants,
            info.time_limit,
            info.num_repeat,
        ));
    }

    /*============================================================================
    MOSManager::setup内で呼び出す関数
    フロントエンドから設定された実験参加者をParticipan構造体のVecで初期化
    */
    pub fn setup_participants(participants: Vec<String>) -> Vec<Participant> {
        let mut new_participants: Vec<Participant> = Vec::new();
        for participant in participants {
            let _participant = Participant::new(participant);
            new_participants.push(_participant);
        }
        return new_participants;
    }

    /*============================================================================
    MOSManager::setup内で呼び出す関数
    フロントエンドから設定された各カテゴリをCategory構造体のVecで初期化
    */
    pub fn setup_categories(categories: Vec<(String, PathBuf)>) -> Result<Vec<Category>> {
        let mut new_categories: Vec<Category> = Vec::new();
        for category in categories {
            let _name = category.0.replace(" ", "_");
            let _path = category.1;
            let _category = Category::new(_name, _path)?;
            new_categories.push(_category);
        }
        return Ok(new_categories);
    }

    /*============================================================================
    テストを削除
    */
    pub fn delete(&self) {}

    /*============================================================================
    Trial(任意の実験参加者のテスト)を開始
    テストマネージャがテストを開始する時に呼び出される
    */
    pub fn launch_trial<S: AsRef<str>>(&mut self, participant_name: S) -> Result<()> {
        let new_trial = MOSTrial::generate(
            self.manager_data_root.clone(),
            participant_name.as_ref().to_string(),
            self.categories.clone(),
            self.num_repeat,
        )?;

        self.active_trial = Some(new_trial);
        return Ok(());
    }

    /*============================================================================
    次の問題の音声ファイルのパスを返す
    */
    pub fn get_question(&self) -> Result<PathBuf> {
        let path = match &self.active_trial {
            Some(trial) => trial.get_question(),
            None => {
                return Err(anyhow!("There is no active trial"));
            }
        };
        Ok(path)
    }

    /*============================================================================
    問題の回答を保存する
    */
    pub fn set_answer(&mut self, rate: Vec<isize>) -> Result<()> {
        match self.active_trial.as_mut() {
            Some(trial) => {
                trial.set_answer(rate);
            }
            None => {
                return Err(anyhow!("There is no active trial"));
            }
        }
        Ok(())
    }

    /*============================================================================
    トライアルを終了
    MOSTrail.closeで結果が保存される
    */
    pub fn close_trial(&mut self) -> Result<()> {
        match &self.active_trial {
            Some(trial) => trial.close()?,
            None => {
                return Err(anyhow!("There is no active trial"));
            }
        };
        self.active_trial = None;
        Ok(())
    }

    /*============================================================================
    選択したカテゴリのフォルダをManagerのディレクトリに保存
    */
    pub fn copy_categories(&self) -> Result<()> {
        let categories = &self.categories;
        for category in categories {
            let destination = self
                .manager_data_root
                .join(CATEGORIES_DIRNAME)
                .join(category.get_category_name());

            let mut options = fs_extra::dir::CopyOptions::new();
            options.copy_inside = true;
            options.skip_exist = true;
            fs_extra::dir::copy(category.get_original_path(), destination, &options)?;
        }
        Ok(())
    }

    /*============================================================================
    Managerの設定を保存
    */
    pub fn save_setting(&self) -> Result<()> {
        fs::create_dir_all(&self.manager_data_root)?;

        let json_path = self.manager_data_root.join(TEST_MANAGER_SETTING_FILENAME);

        let json_string = serde_json::to_string_pretty(&self)?;
        let mut file = File::create(json_path)?;
        file.write_all(json_string.as_bytes())?;
        Ok(())
    }
}
