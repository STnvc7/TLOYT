use crate::constants::{CATEGORIES_DIRNAME, TEST_MANAGER_DIRNAME, TEST_MANAGER_SETTING_FILENAME};
use crate::test_manager::{TestManager, ParticipantStatus, Category};
// use crate::test_trial::{ab_thurstone::ABThurstoneTrial, TestTrial, TrialStatus};

use std::collections::HashMap;
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
pub struct ABThurstoneManager {
    manager_data_root: PathBuf,
    name: String,
    author: String,
    created_date: NaiveDate,
    description: String,

    categories: Vec<Category>,
    participants: HashMap<String, ParticipantStatus>,

    time_limit: usize,
    num_repeat: usize,

    active_trial: Option<MOSTrial>,
}

#[allow(dead_code)]
impl TestManager for ABThurstoneManager {
    fn get_name(&self) -> String {
        self.name.clone()
    }
    fn delete(&self) {}

    fn launch_trial(&mut self, participant_name: String) -> Result<()> {
        if self.active_trial.is_some() {
            return Err(anyhow!("There is other active trial"));
        }
        let new_trial = ABThrustoneTrial::generate(
            self.manager_data_root.clone(),
            participant_name,
            self.categories.clone(),
            self.num_repeat,
        )?;

        self.active_trial = Some(new_trial);
        Ok(())
    }
    fn get_audio(&self) -> Result<PathBuf> {
        let path = match &self.active_trial {
            Some(trial) => trial.get_audio(),
            None => {
                return Err(anyhow!("There is no active trial"));
            }
        };
        Ok(path)
    }
    fn set_answer(&mut self, rate: Vec<isize>) -> Result<TrialStatus> {
        match self.active_trial.as_mut() {
            Some(trial) => {
                trial.set_answer(rate);
                let status = trial.to_next();
                return Ok(status)
            }
            None => {
                return Err(anyhow!("There is no active trial"));
            }
        }
    }
    fn close_trial(&mut self) -> Result<()> {
        let examinee: String;
        match &self.active_trial {
            Some(trial) => {
                examinee = trial.get_examinee();
                trial.close()?;
            }
            None => {
                return Err(anyhow!("There is no active trial"));
            }
        };

        *self.participants.get_mut(&examinee).unwrap() = ParticipantStatus::Done;
        self.active_trial = None;
        Ok(())
    }

    fn copy_categories(&self) -> Result<()> {
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

    fn save_setting(&self) -> Result<()> {
        let json_path = self.manager_data_root.join(TEST_MANAGER_SETTING_FILENAME);

        let json_string = serde_json::to_string_pretty(&self)?;
        let mut file = File::create(json_path)?;
        file.write_all(json_string.as_bytes())?;
        Ok(())
    }
}

impl ABThurstoneManager {
    fn new(
        manager_data_root: PathBuf,
        name: String,
        author: String,
        created_date: NaiveDate,
        description: String,
        categories: Vec<Category>,
        participants: HashMap<String, ParticipantStatus>,
        time_limit: usize,
        num_repeat: usize,
    ) -> ABThurstoneManager {
        ABThurstoneManager {
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

    pub fn from_json<P: AsRef<Path>>(path_to_test_config: P) -> Result<ABThurstoneManager> {
        let json_string = fs::read_to_string(path_to_test_config.as_ref())?;
        let this_test: ABThurstoneManager = serde_json::from_str(&json_string)?;
        return Ok(this_test);
    }

    pub fn setup<P: AsRef<Path>, S: AsRef<str>>(
        app_data_root: P,
        json_string: S,
    ) -> Result<ABThurstoneManager> {
        let info: SetupInfo = serde_json::from_str(json_string.as_ref())?;
        let manager_data_root =
            ABThurstoneManager::get_manager_data_root(app_data_root.as_ref(), &info.name)?;
        let created_date = Local::now().date_naive();
        let participants = ABThursstoneManager::setup_participants(info.participants);
        let categories = ABThurstoneManager::setup_categories(info.categories)?;

        return Ok(ABThurstoneManager::new(
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

    fn get_manager_data_root<P: AsRef<Path>, S: AsRef<str>>(
        app_data_root: P,
        test_name: S,
    ) -> Result<PathBuf> {
        let mut data_root = app_data_root
            .as_ref()
            .to_path_buf()
            .join(TEST_MANAGER_DIRNAME);
        data_root = data_root.join(test_name.as_ref());
        if data_root.exists() == false {
            fs::create_dir_all(&data_root)?;
        }
        return Ok(data_root);
    }
    fn setup_participants(participants: Vec<String>) -> HashMap<String, ParticipantStatus> {
        let mut new_participants: HashMap<String, ParticipantStatus> = HashMap::new();
        for participant in participants {
            new_participants.insert(participant, ParticipantStatus::Yet);
        }
        return new_participants;
    }
    fn setup_categories(categories: Vec<(String, PathBuf)>) -> Result<Vec<Category>> {
        let mut new_categories: Vec<Category> = Vec::new();
        for category in categories {
            let _name = category.0.replace(" ", "_");
            let _path = category.1;
            let _category = Category::new(_name, _path)?;
            new_categories.push(_category);
        }
        return Ok(new_categories);
    }
}