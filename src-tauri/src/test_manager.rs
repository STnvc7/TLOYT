pub mod mos;

use crate::test_manager::mos::MOSManager;
use crate::constants::AVAILABLE_AUDIO_FILE_EXTENTION;
use crate::test_trial::TrialStatus;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

//===================================================
// struct that implement this trait behave as TestManager
// TestManager controls(launch and close) each Trial
#[allow(dead_code)]
pub trait TestManager {
    fn get_name(&self) -> String;
    fn delete(&self);
    fn launch_trial(&mut self, participant_name: String) -> Result<()>;
    fn get_audio(&self) -> Result<PathBuf>;
    fn set_score(&mut self, score: Vec<isize>) -> Result<TrialStatus>;
    fn close_trial(&mut self) -> Result<()>;

    //====================================================================
    fn copy_categories(&self) -> Result<()>;
    fn save_setting(&self) -> Result<()>;
}


//===================================================
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ParticipantStatus {
    Yet,
    Done,
}


//===================================================
// this struct is made for member of struct that implement TestManager trait.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Category {
    category: String,
    original_path: PathBuf,
    audio_files: Vec<PathBuf>,
}
#[allow(dead_code)]
impl Category {
    pub fn new(category: String, path: PathBuf) -> Result<Self> {
        let mut audio_files: Vec<PathBuf> = Vec::new();
        let entries = fs::read_dir(&path)?;
        for entry in entries {
            let file_path = entry?.path();
            let file_name = file_path.file_name().unwrap().to_string_lossy().into_owned();
            let period_splitted_name: Vec<&str> = file_name.split('.').collect();

            //有効な拡張子を持つファイルかどうか
            for extention in AVAILABLE_AUDIO_FILE_EXTENTION{
                if extention == *period_splitted_name.last().unwrap() {
                    audio_files.push(PathBuf::from(file_name));
                    break
                }
            }
        }

        return Ok(Category {
            category: category,
            original_path: path,
            audio_files: audio_files,
        });
    }
    pub fn get_category_name(&self) -> String {
        self.category.clone()
    }
    pub fn get_original_path(&self) -> PathBuf {
        self.original_path.clone()
    }
    pub fn get_audio_files(&self) -> Vec<PathBuf> {
        self.audio_files.clone()
    }
}
