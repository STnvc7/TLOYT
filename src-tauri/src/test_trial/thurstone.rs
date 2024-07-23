use crate::constants::{CATEGORIES_DIRNAME, TRIAL_DIRNAME};
use crate::test_manager::Categories;
use crate::test_trial::{TestTrial, TrialStatus};

use std::io::Write;
use std::path::PathBuf;
use std::{fs, fs::File};

use anyhow::{anyhow, Result};
use itertools::Itertools;
use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ABIndex {
    A,
    B,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ThurstoneScore {
    category_a: String,
    audio_file_path_a: PathBuf,
    category_b: String,
    audio_file_path_b: PathBuf,
    prefer_to: Option<String>,
}
impl ThurstoneScore {
    pub fn new(
        category_a: String,
        audio_file_path_a: PathBuf,
        category_b: String,
        audio_file_path_b: PathBuf,
    ) -> ThurstoneScore {
        ThurstoneScore {
            category_a: category_a,
            audio_file_path_a: audio_file_path_a,
            category_b: category_b,
            audio_file_path_b: audio_file_path_b,
            prefer_to: None,
        }
    }
    pub fn get_audio_file_path_a(&self) -> PathBuf {
        self.audio_file_path_a.clone()
    }
    pub fn get_audio_file_path_b(&self) -> PathBuf {
        self.audio_file_path_b.clone()
    }
    pub fn set_score(&mut self, ab_index: ABIndex) {
        let score = match ab_index {
            ABIndex::A => self.category_a.clone(),
            ABIndex::B => self.category_b.clone(),
        };
        self.prefer_to = Some(score);
    }
}

#[allow(unused_variables)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ThurstoneTrial {
    trial_data_root: PathBuf,
    examinee: String,
    score_list: Vec<ThurstoneScore>,
    current_idx: usize,
    a_b_index: ABIndex,
}

impl TestTrial for ThurstoneTrial {
    fn get_audio(&mut self) -> Result<PathBuf> {
        let audio_path = match self.a_b_index {
            ABIndex::A => {
                self.a_b_index = ABIndex::B;
                self.score_list[self.current_idx].get_audio_file_path_a()
            }
            ABIndex::B => {
                self.a_b_index = ABIndex::A;
                self.score_list[self.current_idx].get_audio_file_path_b()
            }
        };
        Ok(audio_path)
    }
    fn set_score(&mut self, score: Vec<isize>) -> Result<()> {
        let ab_score: ABIndex;
        match score[0] {
            0 => {
                ab_score = ABIndex::A;
            }
            1 => {
                ab_score = ABIndex::B;
            }
            _ => {
                return Err(anyhow!("Invalid score for ABThurstone Test"));
            }
        }

        self.score_list[self.current_idx].set_score(ab_score);
        Ok(())
    }
    fn to_next(&mut self) -> Result<TrialStatus> {
        let status = if self.score_list.len() > (self.current_idx + 1) {
            self.current_idx += 1;
            Ok(TrialStatus::Doing)
        } else if self.score_list.len() == (self.current_idx + 1) {
            Ok(TrialStatus::Done)
        } else {
            Err(anyhow!("Test had been ended"))
        };

        status
    }
    fn save_result(&self) -> Result<()> {
        let json_string = serde_json::to_string_pretty(&self.score_list)?;
        let path = self.trial_data_root.join(format!("{}.json", self.examinee));
        let mut file = File::create(&path)?;
        file.write_all(json_string.as_bytes())?;
        Ok(())
    }
}

impl ThurstoneTrial {
    pub fn generate(
        manager_data_root: PathBuf,
        examinee: String,
        categories: Categories,
    ) -> Result<ThurstoneTrial> {
        let trial_data_root = ThurstoneTrial::get_trial_data_root(manager_data_root.clone())?;
        let score_list = ThurstoneTrial::generate_score_list(manager_data_root, categories)?;

        Ok(ThurstoneTrial {
            trial_data_root: trial_data_root,
            examinee: examinee,
            score_list: score_list,
            current_idx: 0,
            a_b_index: ABIndex::A,
        })
    }

    fn generate_score_list(
        manager_data_root: PathBuf,
        categories: Categories,
    ) -> Result<Vec<ThurstoneScore>> {
        let mut file_list: Vec<ThurstoneScore> = Vec::new();
        let audio_filenames = categories.get_audio_filenames();
        let category_dir_root = manager_data_root.join(CATEGORIES_DIRNAME);

        for mut comb in categories.get_names().iter().combinations(2) {
            for filename in &audio_filenames {
                comb.shuffle(&mut rand::thread_rng());
                let category_a_name = comb[0];
                let category_b_name = comb[1];
                let category_a_path = category_dir_root.join(&category_a_name).join(&filename);
                let category_b_path = category_dir_root.join(&category_b_name).join(&filename);

                let score = ThurstoneScore::new(
                    category_a_name.to_string(),
                    category_a_path,
                    category_b_name.to_string(),
                    category_b_path,
                );

                file_list.push(score);
            }
        }
        file_list.shuffle(&mut rand::thread_rng());
        file_list.shuffle(&mut rand::thread_rng());
        file_list.shuffle(&mut rand::thread_rng());
        file_list.shuffle(&mut rand::thread_rng());

        Ok(file_list)
    }

    fn get_trial_data_root(manager_data_root: PathBuf) -> Result<PathBuf> {
        let trial_data_root = manager_data_root.join(TRIAL_DIRNAME);
        if trial_data_root.exists() == false {
            fs::create_dir_all(&trial_data_root)?;
        }
        return Ok(trial_data_root);
    }
}