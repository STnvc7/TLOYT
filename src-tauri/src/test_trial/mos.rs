use crate::constants::TRIAL_DIRNAME;
use crate::test_manager::Category;
use crate::test_trial::{TestTrial, TrialStatus};

use std::io::Write;
use std::path::PathBuf;
use std::{fs, fs::File};

use anyhow::Result;
use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum TargetType {
    Valid,
    Dummy,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MOSScore {
    category: String,
    target_type: TargetType,
    audio_file_path: PathBuf,
    score: Option<isize>,
}
impl MOSScore {
    pub fn new(category: String, target_type: TargetType, audio_file_path: PathBuf) -> MOSScore {
        MOSScore {
            category: category,
            target_type: target_type,
            audio_file_path: audio_file_path,
            score: None,
        }
    }
    pub fn get_audio_file_path(&self) -> PathBuf {
        self.audio_file_path.clone()
    }
    pub fn set_score(&mut self, score: isize) {
        self.score = Some(score);
    }
}

#[allow(unused_variables)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MOSTrial {
    trial_data_root: PathBuf,
    examinee: String,
    score_list: Vec<MOSScore>,
    current_idx: usize,
}

impl TestTrial for MOSTrial {
    fn get_examinee(&self) -> String {
        self.examinee.clone()
    }
    fn get_audio(&self) -> PathBuf {
        self.score_list[self.current_idx].get_audio_file_path()
    }
    fn set_score(&mut self, score: Vec<isize>) {
        self.score_list[self.current_idx].set_score(score[0]);
    }
    fn to_next(&mut self) -> TrialStatus {
        if self.score_list.len() > (self.current_idx + 1) {
            self.current_idx += 1;
            return TrialStatus::Doing;
        } else {
            return TrialStatus::Done;
        }
    }
    fn close(&self) -> Result<()> {
        let json_string = serde_json::to_string_pretty(&self)?;
        let path = self.trial_data_root.join(format!("{}.json", self.examinee));
        let mut file = File::create(&path)?;
        file.write_all(json_string.as_bytes())?;
        Ok(())
    }
}

impl MOSTrial {
    pub fn generate(
        manager_data_root: PathBuf,
        examinee: String,
        categories: Vec<Category>,
        num_repeat: usize,
    ) -> Result<MOSTrial> {
        let trial_data_root = MOSTrial::get_trial_data_root(manager_data_root.clone())?;
        let score_list =
            MOSTrial::generate_score_list(trial_data_root.clone(), categories, num_repeat)?;

        Ok(MOSTrial {
            trial_data_root: trial_data_root,
            examinee: examinee,
            score_list: score_list,
            current_idx: 0,
        })
    }

    fn generate_score_list(
        trial_data_root: PathBuf,
        categories: Vec<Category>,
        num_repeat: usize,
    ) -> Result<Vec<MOSScore>> {
        let mut dummy_list: Vec<MOSScore> = Vec::new();
        let mut file_list: Vec<MOSScore> = Vec::new();

        for category in &categories {
            let category_name = category.get_category_name();
            let category_dir = trial_data_root.join(&category_name);

            let audio_files = category.get_audio_files();

            let dummy_file = &audio_files.choose(&mut rand::thread_rng()).unwrap();
            let dummy_file_path = category_dir.join(dummy_file);
            let dummy = MOSScore::new(category_name.clone(), TargetType::Dummy, dummy_file_path);
            dummy_list.push(dummy);

            for _ in 0..num_repeat {
                for audio_file in &audio_files {
                    let audio_file_path = category_dir.join(audio_file);
                    let score =
                        MOSScore::new(category_name.clone(), TargetType::Valid, audio_file_path);
                    file_list.push(score);
                }
            }
        }

        file_list.shuffle(&mut rand::thread_rng());
        file_list.shuffle(&mut rand::thread_rng());
        file_list.shuffle(&mut rand::thread_rng());
        file_list.shuffle(&mut rand::thread_rng());

        let score_list = [dummy_list, file_list].concat();

        Ok(score_list)
    }

    fn get_trial_data_root(manager_data_root: PathBuf) -> Result<PathBuf> {
        let trial_data_root = manager_data_root.join(TRIAL_DIRNAME);
        if trial_data_root.exists() == false {
            fs::create_dir_all(&trial_data_root)?;
        }
        return Ok(trial_data_root);
    }
}
