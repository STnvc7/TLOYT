use crate::app::TestType;
use crate::constants::{
    CATEGORIES_DIRNAME, TEST_MANAGER_DIRNAME, TEST_MANAGER_SETTING_FILENAME, TRIAL_DIRNAME,
};
use crate::error::ApplicationError;
use crate::test_manager::{Categories, ParticipantStatus, TestManager};
use crate::test_trial::{mos::MosTrial, TestTrial, TrialStatus};

use std::collections::{HashMap, HashSet};
use std::io::Write;
use std::path::PathBuf;
use std::{fs, fs::File};

use anyhow::{anyhow, Result};
use chrono::{Local, NaiveDate};
use log::{error, info};
use serde::{Deserialize, Serialize};
use serde_json;

/*テストのセットアップのための情報を保持する構造体==========================================
フロントエンドとの情報共有をこの構造体をシリアライズした文字列を通しておこなう
*/
#[derive(Serialize, Deserialize, Debug, Clone)]
struct SetupInfo {
    name: String,
    author: String,
    description: String,
    participants: Vec<String>,
    categories: Vec<(String, PathBuf)>,

    time_limit: usize,
    num_repeat: usize,
}

// Mosテストのテストマネージャ================================================
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MosManager {
    manager_data_root: PathBuf,
    name: String,
    test_type: TestType,
    author: String,
    created_date: NaiveDate,
    modified_date: NaiveDate,
    description: String,
    categories: Categories,
    participants: HashMap<String, ParticipantStatus>,
    time_limit: usize,
    num_repeat: usize,
    active_trial: Option<MosTrial>,
}

#[allow(dead_code)]
impl TestManager for MosManager {
    fn get_name(&self) -> String {
        self.name.clone()
    }

    // 新しいトライアルを生成------------------------------------------------------
    fn launch_trial(&mut self, examinee: String) -> Result<()> {
        // 参加者のリストの中に，受験者の名前がないとエラー
        if self.participants.contains_key(&examinee) == false {
            error!("there is no participant: {}", &examinee);
            return Err(anyhow!(ApplicationError::UnregisteredParticipantError(
                examinee,
                self.name.clone()
            )));
        }
        //　受験者が既にテストを受けていたらエラー
        if let Some(ParticipantStatus::Done) = self.participants.get(&examinee) {
            error!("this participant has already taken test: {}", examinee);
            return Err(anyhow!(ApplicationError::AlreadyTakenTrialError(examinee)));
        }

        let new_trial = MosTrial::generate(
            self.manager_data_root.clone(),
            examinee,
            self.categories.clone(),
            self.num_repeat,
        )?;

        self.active_trial = Some(new_trial);
        Ok(())
    }

    //トライアルを終了させる-------------------------------------------------
    fn close_trial(&mut self, examinee: String) -> Result<()> {
        // トライアルの結果を保存
        if let Some(trial) = &self.active_trial {
            trial.save_result()?;
        }

        *self.participants.get_mut(&examinee).unwrap() = ParticipantStatus::Done;
        self.active_trial = None;
        self.save_setting()?;
        info!(
            "trial finished: test: {}, examinee: {}",
            self.name, examinee
        );
        Ok(())
    }

    // トライアルの結果を削除------------------------------------------------
    fn delete_trial(&mut self, examinee: String) -> Result<()> {
        let trial_json_path = self
            .manager_data_root
            .join(TRIAL_DIRNAME)
            .join(format!("{}.json", examinee));

        // 削除するデータがそもそも無い場合はエラー
        if trial_json_path.exists() == false {
            error!("there is no trial data: {:?}", &trial_json_path);
            return Err(anyhow!(ApplicationError::TrialDataNotFoundError(
                trial_json_path
            )));
        }

        fs::remove_file(&trial_json_path)?; //ファイルを削除
        info!("trial data removed: {:?}", trial_json_path);
        *self.participants.get_mut(&examinee).unwrap() = ParticipantStatus::Yet; // 受験者のステータスを更新
        self.save_setting()?;
        Ok(())
    }

    // テストのプレビューを開始-------------------------------------------------
    fn launch_preview(&mut self) -> Result<()> {
        // 受験者の名前を設定せずにトライアルを生成
        let preview_trial = MosTrial::generate(
            self.manager_data_root.clone(),
            String::new(),
            self.categories.clone(),
            self.num_repeat,
        )?;

        self.active_trial = Some(preview_trial);
        Ok(())
    }

    // テストのプレビューを終了--------------------------------------------------
    fn close_preview(&mut self) -> Result<()> {
        // 結果は保存しない
        self.active_trial = None;
        Ok(())
    }

    // マネージャの情報を編集---------------------------------------------------
    fn edit(&mut self, json_string: String) -> Result<()> {
        let info: SetupInfo = serde_json::from_str(&json_string)?;
        info!("test edit: {:?}", info.clone());

        self.name = info.name;
        self.author = info.author;
        self.modified_date = Local::now().date_naive();
        self.description = info.description;
        self.categories = Categories::setup(info.categories)?;
        self.edit_participants(info.participants);
        self.time_limit = info.time_limit;
        self.num_repeat = info.num_repeat;
        self.save_setting()?;
        Ok(())
    }

    // テスト音声のファイルパスを返す------------------------------------------------
    fn get_audio(&mut self) -> Result<Vec<PathBuf>> {
        let path = self.active_trial.as_mut().unwrap().get_audio()?;
        Ok(path)
    }

    // 評価結果を格納--------------------------------------------------------
    fn set_score(&mut self, score: Vec<String>) -> Result<TrialStatus> {
        let trial = self.active_trial.as_mut().unwrap();
        trial.set_score(score)?;
        let status = trial.to_next()?;
        Ok(status)
    }

    // セットアップ時にカテゴリのフォルダをアプリケーションデータのフォルダにコピー-----------------
    fn copy_categories(&self) -> Result<()> {
        for (_name, _path) in self.categories.get_name_path_iter() {
            let destination = self.manager_data_root.join(CATEGORIES_DIRNAME).join(_name);

            let mut options = fs_extra::dir::CopyOptions::new();
            options.copy_inside = true;
            options.skip_exist = true;
            fs_extra::dir::copy(&_path, &destination, &options)?;
            info!("directory copied: from {:?} to {:?}", _path, destination);
        }
        info!("all category copied successfully");
        Ok(())
    }

    // マネージャの設定を保存-------------------------------------------------------
    fn save_setting(&self) -> Result<()> {
        let json_path = self.manager_data_root.join(TEST_MANAGER_SETTING_FILENAME);

        let json_string = serde_json::to_string_pretty(&self)?;
        let mut file = File::create(&json_path)?;
        file.write_all(json_string.as_bytes())?;
        info!(
            "save setting successfully: {:?}\ndata: {}",
            json_path, json_string
        );
        Ok(())
    }

    fn get_setting(&self) -> Result<String> {
        let json_string = serde_json::to_string_pretty(&self)?;
        Ok(json_string)
    }
}

impl MosManager {
    // jsonファイルをデシリアライズして構造体を生成------------------------------------------
    pub fn from_json(path_to_test_config: PathBuf) -> Result<MosManager> {
        // ファイルがなければエラー
        if path_to_test_config.exists() == false {
            return Err(anyhow!(ApplicationError::TestDataNotFoundError(
                path_to_test_config
            )));
        }
        let json_string = fs::read_to_string(path_to_test_config)?;
        let this_test: MosManager = serde_json::from_str(&json_string)?;
        return Ok(this_test);
    }

    // フロントエンドから送られたセットアップ情報から構造体を構成------------------------------
    pub fn setup(app_data_root: PathBuf, json_string: String) -> Result<MosManager> {
        let info: SetupInfo = serde_json::from_str(&json_string)?;
        let manager_data_root =
            MosManager::get_manager_data_root(app_data_root, info.name.clone())?;
        let categories = Categories::setup(info.categories)?;

        return Ok(MosManager {
            manager_data_root: manager_data_root,
            name: info.name,
            test_type: TestType::Mos,
            author: info.author,
            created_date: Local::now().date_naive(),
            modified_date: Local::now().date_naive(),
            description: info.description,
            categories: categories,
            participants: MosManager::setup_participants(info.participants),
            time_limit: info.time_limit,
            num_repeat: info.num_repeat,
            active_trial: None,
        });
    }

    // マネージャの情報を保存するディレクトリを返す-------------------------------------------
    fn get_manager_data_root(app_data_root: PathBuf, test_name: String) -> Result<PathBuf> {
        let data_root = app_data_root.join(TEST_MANAGER_DIRNAME).join(test_name);
        if data_root.exists() == false {
            fs::create_dir_all(&data_root)?;
        }
        return Ok(data_root);
    }

    // 受験者の情報をセットアップ--------------------------------------------------------
    fn setup_participants(participants: Vec<String>) -> HashMap<String, ParticipantStatus> {
        let mut new_participants: HashMap<String, ParticipantStatus> = HashMap::new();
        for participant in participants {
            let _participant = participant.replace(" ", "_");
            new_participants.insert(_participant, ParticipantStatus::Yet);
        }
        return new_participants;
    }

    // editメソッドの中で呼び出される．受験者の削除と追加をおこなう---------------
    fn edit_participants(&mut self, participants: Vec<String>) {
        let old: HashSet<_> = self.participants.clone().keys().cloned().collect();
        let new: HashSet<_> = participants.iter().cloned().collect();

        // HashSetで削除された要素と追加された要素を抽出
        let added: Vec<String> = new.difference(&old).cloned().collect();
        let removed: Vec<String> = old.difference(&new).cloned().collect();

        for p in removed {
            self.participants.remove(&p);
        }
        for p in added {
            self.participants.insert(p, ParticipantStatus::Yet);
        }
    }
}
