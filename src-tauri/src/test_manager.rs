pub mod ab_thurstone;
pub mod mos;

use crate::constants::AVAILABLE_AUDIO_FILE_EXTENTION;
use crate::test_manager::mos::MOSManager;
use crate::test_trial::TrialStatus;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/*===================================================
*/
#[allow(dead_code)]
pub trait TestManager {
    fn get_name(&self) -> String;
    fn launch_trial(&mut self, participant_name: String) -> Result<()>;
    fn get_audio(&mut self) -> Result<PathBuf>;
    fn set_score(&mut self, score: Vec<isize>) -> Result<TrialStatus>;
    fn close_trial(&mut self) -> Result<()>;
    fn delete_trial(&mut self, examinee: String) -> Result<()>;

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

//==================================================
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
    pub fn setup(categories: Vec<(String, PathBuf)>) -> Result<Categories> {
        let mut names: Vec<String> = Vec::new();
        let mut original_paths: Vec<PathBuf> = Vec::new();
        let mut filenames: Vec<String> = Vec::new();

        for category in categories {
            names.push(category.0.replace(" ", "_"));
            original_paths.push(category.1.clone());

            let _filenames = Categories::glob_audio_filenames(category.1)?;
            if filenames.len() == 0 {
                filenames = _filenames;
                continue;
            }
            if filenames != _filenames {
                return Err(anyhow!("The names of the audio files are not the same"));
            }
        }

        Ok(Categories::new(names, original_paths, filenames))
    }

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
    pub fn get_original_paths(&self) -> Vec<PathBuf> {
        self.original_paths.clone()
    }
    pub fn get_audio_filenames(&self) -> Vec<String> {
        self.filenames.clone()
    }
    pub fn get_name_path_iter(&self) -> impl Iterator<Item = (&String, &PathBuf)> {
        self.names.iter().zip(self.original_paths.iter())
    }
}
