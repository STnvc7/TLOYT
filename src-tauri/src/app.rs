use crate::path_name::{TEST_LIST_FILENAME, TEST_MANAGER_DIRNAME, TEST_MANAGER_SETTING_FILENAME};
use crate::test_manager::{TestManager, TestType};

use std::fs;
use std::path::PathBuf;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json;

#[derive(Serialize, Deserialize)]
struct TestList {
    pub test_name: String,
    pub test_type: TestType,
}

#[allow(dead_code)]
#[derive(Debug)]
pub struct ApplicationManager {
    test_managers: Vec<TestManager>,
    active_manager: Option<TestManager>,
    app_data_root: PathBuf,
}

#[allow(dead_code, unused_variables)]
impl ApplicationManager {
    pub fn new(app_data_root: PathBuf) -> Result<ApplicationManager> {
        let json_string = fs::read_to_string(app_data_root.join(TEST_LIST_FILENAME))?;
        let test_list: Vec<TestList> = serde_json::from_str(&json_string)?;

        let mut test_managers: Vec<TestManager> = Vec::new();
        for test in test_list {
            let manager_json_path = app_data_root
                .join(TEST_MANAGER_DIRNAME)
                .join(&test.test_name)
                .join(TEST_MANAGER_SETTING_FILENAME);

            let new_manager = TestManager::from_json(manager_json_path, test.test_type)?;
            test_managers.push(new_manager)
        }

        return Ok(ApplicationManager {
            test_managers: test_managers,
            active_manager: None,
            app_data_root: app_data_root,
        });
    }
    pub fn get_managers() {}
    pub fn add_manager<S: AsRef<str>>(&self, json_string_from_frontend: S) {}
    pub fn get_manager<S: AsRef<str>>(&self, test_name: S) {}
    pub fn start_test<S: AsRef<str>>(test_name: S, participant_name: S) {
        //let test_manager = get_manager(test_name.as_ref());
    }
    pub fn close_test() {}
}
