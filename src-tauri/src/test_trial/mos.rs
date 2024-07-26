use crate::constants::{CATEGORIES_DIRNAME, TRIAL_DIRNAME};
use crate::test_manager::Categories;
use crate::test_trial::{ScoreType, TestTrial, TrialStatus};

use std::io::Write;
use std::path::PathBuf;
use std::{fs, fs::File};

use anyhow::{anyhow, Result};
use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MosScore {
    category: String,
    score_type: ScoreType,
    audio_file_path: PathBuf,
    score: Option<isize>,
}
impl MosScore {
    pub fn new(category: String, score_type: ScoreType, audio_file_path: PathBuf) -> MosScore {
        MosScore {
            category: category,
            score_type: score_type,
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
pub struct MosTrial {
    trial_data_root: PathBuf,
    examinee: String,
    score_list: Vec<MosScore>,
    current_idx: usize,
}

impl TestTrial for MosTrial {
    fn get_audio(&mut self) -> Result<Vec<PathBuf>> {
        let audio_path = self.score_list[self.current_idx].get_audio_file_path();
        Ok(vec![audio_path])
    }
    fn set_score(&mut self, score: Vec<isize>) -> Result<()> {
        self.score_list[self.current_idx].set_score(score[0]);
        Ok(())
    }
    fn to_next(&mut self) -> Result<TrialStatus> {
        if self.score_list.len() > (self.current_idx + 1) {
            self.current_idx += 1;
            return Ok(TrialStatus::Doing);
        } else if self.score_list.len() == (self.current_idx + 1) {
            return Ok(TrialStatus::Done);
        } else {
            return Err(anyhow!("Test had been ended"));
        }
    }
    fn save_result(&self) -> Result<()> {
        let json_string = serde_json::to_string_pretty(&self.score_list)?;
        let path = self.trial_data_root.join(format!("{}.json", self.examinee));
        let mut file = File::create(&path)?;
        file.write_all(json_string.as_bytes())?;
        Ok(())
    }
}

impl MosTrial {
    pub fn generate(
        manager_data_root: PathBuf,
        examinee: String,
        categories: Categories,
        num_repeat: usize,
    ) -> Result<MosTrial> {
        let trial_data_root = MosTrial::get_trial_data_root(manager_data_root.clone())?;
        let score_list = MosTrial::generate_score_list(manager_data_root, categories, num_repeat)?;

        Ok(MosTrial {
            trial_data_root: trial_data_root,
            examinee: examinee,
            score_list: score_list,
            current_idx: 0,
        })
    }

    fn generate_score_list(
        manager_data_root: PathBuf,
        categories: Categories,
        num_repeat: usize,
    ) -> Result<Vec<MosScore>> {
        let mut dummy_list: Vec<MosScore> = Vec::new();
        let mut file_list: Vec<MosScore> = Vec::new();

        let category_names = categories.get_names();
        let audio_filenames = categories.get_audio_filenames();

        for name in category_names {
            let category_dir = manager_data_root.join(CATEGORIES_DIRNAME).join(&name);

            let dummy_file = &audio_filenames.choose(&mut rand::thread_rng()).unwrap();
            let dummy_file_path = category_dir.join(dummy_file);
            let dummy = MosScore::new(name.clone(), ScoreType::Dummy, dummy_file_path);
            dummy_list.push(dummy);

            for _ in 0..num_repeat {
                for filename in &audio_filenames {
                    let audio_file_path = category_dir.join(filename);
                    let score = MosScore::new(name.clone(), ScoreType::Valid, audio_file_path);
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
