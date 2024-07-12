pub mod mos;
use crate::test_manager::mos::MOSManager;

use std::path::PathBuf;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub enum TestType {
    MOS,
    DMOS,
}

#[derive(Debug)]
pub enum TestManager {
    MOS(MOSManager),
}

impl TestManager {
    pub fn from_json(test_setting_path: PathBuf, test_type: TestType) -> Result<TestManager> {
        return match test_type {
            TestType::MOS => {
                let manager = MOSManager::from_json(test_setting_path)?;
                Ok(TestManager::MOS(manager))
            }
            _ => Err(anyhow!("Not implment")),
        };
    }

    pub fn new<S: AsRef<str>>(app_data_root: PathBuf, test_type: TestType, mut json_string_from_frontend: S) -> Result<TestManager> {
        let json_string_from_frontend = json_string_from_frontend.as_ref().to_string();

        return match test_type {
            TestType::MOS => {
                let manager = MOSManager::setup(app_data_root, json_string_from_frontend)?;
                Ok(TestManager::MOS(manager))
            }
            _ => Err(anyhow!("Not implment")),
        };
    }
}
