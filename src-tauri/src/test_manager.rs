pub mod mos;
pub mod thurstone;

use crate::constants::AVAILABLE_AUDIO_FILE_EXTENTION;
use crate::error::ApplicationError;
use crate::test_trial::TrialStatus;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// 各テスト手法の共通の振る舞いを規定するトレイト====================================
#[allow(dead_code)]
pub trait TestManager: Send + Sync {
    fn get_name(&self) -> String;
    //----------------------------------------------------------------
    fn launch_trial(&mut self, examinee: String) -> Result<()>;
    fn close_trial(&mut self, examinee: String) -> Result<()>;
    fn delete_trial(&mut self, examinee: String) -> Result<()>;
    fn launch_preview(&mut self) -> Result<()>;
    fn close_preview(&mut self) -> Result<()>;
    fn edit(&mut self, json_string: String) -> Result<()>;
    fn get_audio(&mut self) -> Result<Vec<PathBuf>>;
    fn set_score(&mut self, score: Vec<String>) -> Result<TrialStatus>;
    //----------------------------------------------------------------
    fn copy_categories(&self) -> Result<()>;
    fn save_setting(&self) -> Result<()>;
    //----------------------------------------------------------------
    fn get_setting(&self) -> Result<String>;
}

//実験参加者の状態を表す列挙型================================================
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ParticipantStatus {
    Yet,  //未受験
    Done, //受験済み
}

// テストの比較対象のカテゴリを操作する構造体========================================
// 注意：カテゴリ内の音声ファイルの名前はカテゴリ間で同じものとする必要あり．
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Categories {
    names: Vec<String>,
    original_paths: Vec<PathBuf>,
    filenames: Vec<String>,
}
impl Categories {
    fn new(names: Vec<String>, original_paths: Vec<PathBuf>, filenames: Vec<String>) -> Categories {
        Categories {
            names: names,
            original_paths: original_paths,
            filenames: filenames,
        }
    }

    // 構造体を構成------------------------------------------------------------
    pub fn setup(categories: Vec<(String, PathBuf)>) -> Result<Categories> {
        let mut names: Vec<String> = Vec::new();
        let mut original_paths: Vec<PathBuf> = Vec::new();
        let mut filenames: Vec<String> = Vec::new();

        for (i, category) in categories.iter().enumerate() {
            names.push(category.0.replace(" ", "_")); // カテゴリ名の空白をアンダーバーに置換
            original_paths.push(category.1.clone());

            let _filenames = Categories::glob_audio_filenames(category.1.clone())?; // 音声ファイルを取得
                                                                                    // ループの最初の時はシンプルに格納
            if i == 0 {
                filenames = _filenames;
                continue;
            }

            // カテゴリ内の音声ファイルのリストが異なる場合はエラー
            if filenames != _filenames {
                return Err(anyhow!(ApplicationError::InvalidCategoriesError(
                    "each category has different filename".to_string()
                )));
            }
        }

        Ok(Categories::new(names, original_paths, filenames))
    }

    // 有効な拡張子をもつ音声ファイルを取得---------------------------------------------
    fn glob_audio_filenames(path: PathBuf) -> Result<Vec<String>> {
        let mut filenames: Vec<String> = Vec::new();
        let entries = fs::read_dir(&path)?;
        for entry in entries {
            let file_path = entry?.path();
            let file_name = file_path
                .file_name()
                .unwrap()
                .to_string_lossy()
                .into_owned();
            let period_splitted_name: Vec<&str> = file_name.split('.').collect();

            //有効な拡張子を持つファイルかどうか
            for extention in AVAILABLE_AUDIO_FILE_EXTENTION {
                if extention == *period_splitted_name.last().unwrap() {
                    filenames.push(file_name);
                    break;
                }
            }
        }
        filenames.sort();
        Ok(filenames)
    }

    pub fn get_names(&self) -> Vec<String> {
        self.names.clone()
    }
    pub fn get_audio_filenames(&self) -> Vec<String> {
        self.filenames.clone()
    }
    pub fn get_name_path_iter(&self) -> impl Iterator<Item = (&String, &PathBuf)> {
        self.names.iter().zip(self.original_paths.iter())
    }
}
