use crate::constants::{TEST_LIST_FILENAME, TEST_MANAGER_DIRNAME, TEST_MANAGER_SETTING_FILENAME};
use crate::test_manager::mos::MOSManager;
use crate::test_manager::TestManager;
use crate::test_trial::TrialStatus;

use std::collections::HashMap;
use std::io::Write;
use std::path::PathBuf;
use std::{fs, fs::File};

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum TestType {
    MOS,
}

pub struct ApplicationManager {
    managers: HashMap<String, Box<dyn TestManager>>,
    app_data_root: PathBuf,
    test_list: HashMap<String, TestType>,
}
#[allow(dead_code)]
impl ApplicationManager {
    pub fn setup(app_data_root: PathBuf) -> Result<ApplicationManager> {
        let managers: HashMap<String, Box<dyn TestManager>>;
        let test_list: HashMap<String, TestType>;

        let test_list_path = app_data_root.join(TEST_LIST_FILENAME);
        if test_list_path.exists() {
            let json_string = fs::read_to_string(test_list_path)?;
            test_list = serde_json::from_str(&json_string)?;
            managers = ApplicationManager::load(&test_list, app_data_root.clone())?;
        } else {
            ApplicationManager::init(app_data_root.clone())?;
            test_list = HashMap::new();
            managers = HashMap::new();
        }

        Ok(ApplicationManager {
            managers: managers,
            app_data_root: app_data_root,
            test_list: test_list,
        })
    }

    fn load(
        test_list: &HashMap<String, TestType>,
        app_data_root: PathBuf,
    ) -> Result<HashMap<String, Box<dyn TestManager>>> {
        let mut managers: HashMap<String, Box<dyn TestManager>> = HashMap::new();

        for (t_name, t_type) in test_list.iter() {
            let manager_json_path = app_data_root
                .join(TEST_MANAGER_DIRNAME)
                .join(&t_name)
                .join(TEST_MANAGER_SETTING_FILENAME);

            let manager =
                ApplicationManager::load_test_from_json(t_type.clone(), manager_json_path)?;
            managers.insert(t_name.clone(), manager);
        }
        return Ok(managers);
    }

    fn load_test_from_json(
        test_type: TestType,
        setting_json_path: PathBuf,
    ) -> Result<Box<dyn TestManager>> {
        match test_type {
            TestType::MOS => return Ok(Box::new(MOSManager::from_json(setting_json_path)?)),
        }
    }

    fn init(app_data_root: PathBuf) -> Result<()> {
        let test_list_path = app_data_root.join(TEST_LIST_FILENAME);

        let test_list: HashMap<String, TestType> = HashMap::new();
        let json_string = serde_json::to_string_pretty(&test_list)?;
        let mut file = File::create(test_list_path)?;
        file.write_all(json_string.as_bytes())?;

        Ok(())
    }

    pub fn add_new_test(&mut self, test_type: TestType, json_string: String) -> Result<()> {
        let new_manager = match test_type {
            TestType::MOS => Box::new(MOSManager::setup(self.app_data_root.clone(), json_string)?),
        };
        let new_test_name = new_manager.get_name();
        if self.managers.contains_key(&new_test_name) {
            return Err(anyhow!("Already Exist"));
        }

        new_manager.copy_categories()?;
        new_manager.save_setting()?;

        self.managers.insert(new_test_name.clone(), new_manager);
        self.test_list.insert(new_test_name, test_type);
        self.save_test_list()?;
        Ok(())
    }

    pub fn save_test_list(&self) -> Result<()> {
        let test_list_path = self.app_data_root.join(TEST_LIST_FILENAME);
        let json_string = serde_json::to_string_pretty(&self.test_list)?;
        let mut file = File::create(test_list_path)?;
        file.write_all(json_string.as_bytes())?;
        Ok(())
    }

    /*======================================================================================
     */
    pub fn start_test(&mut self, test_name: String, participant_name: String) -> Result<()> {
        self.managers
            .get_mut(&test_name)
            .unwrap()
            .launch_trial(participant_name)?;
        Ok(())
    }

    pub fn close_test(&mut self, test_name: String) -> Result<()> {
        self.managers.get_mut(&test_name).unwrap().close_trial()?;
        Ok(())
    }

    pub fn get_audio(&mut self, test_name: String) -> Result<PathBuf> {
        let audio_path = self.managers.get(&test_name).unwrap().get_audio()?;
        Ok(audio_path)
    }

    pub fn set_score(&mut self, test_name: String, score: Vec<isize>) -> Result<TrialStatus> {
        let status = self
            .managers
            .get_mut(&test_name)
            .unwrap()
            .set_score(score)?;
        Ok(status)
    }
}
