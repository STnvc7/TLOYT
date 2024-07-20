use crate::constants::{
    CATEGORIES_DIRNAME, TEST_MANAGER_DIRNAME, TEST_MANAGER_SETTING_FILENAME, TRIAL_DIRNAME,
};
use crate::test_manager::{Categories, ParticipantStatus, TestManager};
use crate::test_trial::{ab_thurstone::ABThurstoneTrial, TestTrial, TrialStatus};

use std::collections::{HashMap, HashSet};
use std::io::Write;
use std::path::PathBuf;
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
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ABThurstoneManager {
    manager_data_root: PathBuf,
    name: String,
    author: String,
    created_date: NaiveDate,
    modified_date: NaiveDate,
    description: String,

    categories: Categories,
    participants: HashMap<String, ParticipantStatus>,

    time_limit: usize,

    active_trial: Option<ABThurstoneTrial>,
}

#[allow(dead_code)]
impl TestManager for ABThurstoneManager {
    fn get_name(&self) -> String {
        self.name.clone()
    }

    fn launch_trial(&mut self, examinee: String) -> Result<()> {
        if self.participants.contains_key(&examinee) == false {
            return Err(anyhow!("That participant is not registered"));
        }
        match *self.participants.get(&examinee).unwrap() {
            ParticipantStatus::Done => {
                return Err(anyhow!("This participant has already taken the test"));
            }
            _ => {}
        }

        let new_trial = ABThurstoneTrial::generate(
            self.manager_data_root.clone(),
            examinee,
            self.categories.clone(),
        )?;

        self.active_trial = Some(new_trial);
        Ok(())
    }

    fn close_trial(&mut self, examinee: String) -> Result<()> {
        if let Some(trial) = &self.active_trial {
            trial.save_result()?;
        }

        *self.participants.get_mut(&examinee).unwrap() = ParticipantStatus::Done;
        self.active_trial = None;
        self.save_setting()?;
        Ok(())
    }

    fn delete_trial(&mut self, examinee: String) -> Result<()> {
        let trial_json_path = self
            .manager_data_root
            .join(TRIAL_DIRNAME)
            .join(format!("{}.json", examinee));
        fs::remove_file(trial_json_path)?;
        *self.participants.get_mut(&examinee).unwrap() = ParticipantStatus::Yet;
        self.save_setting()?;
        Ok(())
    }

    fn launch_preview(&mut self) -> Result<()> {
        let preview_trial = ABThurstoneTrial::generate(
            self.manager_data_root.clone(),
            String::new(),
            self.categories.clone(),
        )?;

        self.active_trial = Some(preview_trial);
        Ok(())
    }

    fn close_preview(&mut self) -> Result<()> {
        self.active_trial = None;
        Ok(())
    }

    fn edit(&mut self, json_string: String) -> Result<()> {
        let info: SetupInfo = serde_json::from_str(&json_string)?;
        self.name = info.name;
        self.author = info.author;
        self.modified_date = Local::now().date_naive();
        self.description = info.description;
        self.categories = Categories::setup(info.categories)?;
        self.edit_participants(info.participants);
        self.time_limit = info.time_limit;
        self.save_setting()?;
        Ok(())
    }

    fn get_audio(&mut self) -> Result<PathBuf> {
        let path = self.active_trial.as_mut().unwrap().get_audio()?;
        Ok(path.to_path_buf())
    }

    fn set_score(&mut self, score: Vec<isize>) -> Result<TrialStatus> {
        let trial = self.active_trial.as_mut().unwrap();
        trial.set_score(score)?;
        let status = trial.to_next()?;
        Ok(status)
    }

    fn copy_categories(&self) -> Result<()> {
        for (_name, _path) in self.categories.get_name_path_iter() {
            let destination = self.manager_data_root.join(CATEGORIES_DIRNAME).join(_name);

            let mut options = fs_extra::dir::CopyOptions::new();
            options.copy_inside = true;
            options.skip_exist = true;
            fs_extra::dir::copy(_path, destination, &options)?;
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

    fn get_setup_info(&self) -> Result<String> {
        let info = SetupInfo {
            name: self.name.clone(),
            author: self.author.clone(),
            description: self.description.clone(),
            participants: self.participants.keys().cloned().collect(),
            categories: self
                .categories
                .get_name_path_iter()
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect(),
            time_limit: self.time_limit,
        };
        let json_string = serde_json::to_string_pretty(&info)?;
        Ok(json_string)
    }
}

impl ABThurstoneManager {
    fn new(
        manager_data_root: PathBuf,
        name: String,
        author: String,
        created_date: NaiveDate,
        modified_date: NaiveDate,
        description: String,
        categories: Categories,
        participants: HashMap<String, ParticipantStatus>,
        time_limit: usize,
    ) -> ABThurstoneManager {
        ABThurstoneManager {
            manager_data_root: manager_data_root,
            name: name,
            author: author,
            created_date: created_date,
            modified_date: modified_date,
            description: description,
            categories: categories,
            participants: participants,
            time_limit: time_limit,
            active_trial: None,
        }
    }

    pub fn from_json(path_to_test_config: PathBuf) -> Result<ABThurstoneManager> {
        let json_string = fs::read_to_string(path_to_test_config)?;
        let this_test: ABThurstoneManager = serde_json::from_str(&json_string)?;
        return Ok(this_test);
    }

    pub fn setup(app_data_root: PathBuf, json_string: String) -> Result<ABThurstoneManager> {
        let info: SetupInfo = serde_json::from_str(&json_string)?;
        let manager_data_root =
            ABThurstoneManager::get_manager_data_root(app_data_root, info.name.clone())?;
        let categories = Categories::setup(info.categories)?;

        return Ok(ABThurstoneManager::new(
            manager_data_root,
            info.name,
            info.author,
            Local::now().date_naive(),
            Local::now().date_naive(),
            info.description,
            categories,
            ABThurstoneManager::setup_participants(info.participants),
            info.time_limit,
        ));
    }

    fn get_manager_data_root(app_data_root: PathBuf, test_name: String) -> Result<PathBuf> {
        let data_root = app_data_root.join(TEST_MANAGER_DIRNAME).join(test_name);
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

    fn edit_participants(&mut self, participants: Vec<String>) {
        let old: HashSet<_> = self.participants.clone().keys().cloned().collect();
        let new: HashSet<_> = participants.iter().cloned().collect();

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
