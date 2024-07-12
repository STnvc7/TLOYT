use crate::test_manager::{mos::MOSManager, TestManager};
use crate::path_name::{TEST_LIST_FILENAME, TEST_MANAGER_DIRNAME, TEST_MANAGER_SETTING_FILENAME};

use std::path::PathBuf;
use std::fs;

use anyhow::{Result, anyhow};
use serde::{Serialize, Deserialize};
use serde_json;

#[derive(Serialize, Deserialize)]
pub enum TestType{
	MOS,
	DMOS,
}

#[derive(Serialize, Deserialize)]
pub struct TestList{
	pub test_name: String,
	pub test_type: TestType,
}

pub struct ApplicationManager{
	test_managers: Vec<Box<dyn TestManager>>,
	active_manager: Option<Box<dyn TestManager>>,
	app_data_root: PathBuf,
}

#[allow(dead_code, unused_variables)]
impl ApplicationManager {
	/*======================================================================================
	*/
	pub fn setup(app_data_root: PathBuf) -> Result<ApplicationManager>
	{
		let json_string = fs::read_to_string(app_data_root.join(TEST_LIST_FILENAME))?;
		let test_list: Vec<TestList> = serde_json::from_str(&json_string)?;

		let mut test_managers: Vec<Box<dyn TestManager>> = Vec::new();
		for test in test_list {
			let manager_json_path = app_data_root
				.join(TEST_MANAGER_DIRNAME)
				.join(&test.test_name)
				.join(TEST_MANAGER_SETTING_FILENAME);

			let manager = ApplicationManager::new_manager_from_json(test.test_type, manager_json_path)?;
			test_managers.push(manager);
		}
		return Ok(ApplicationManager{test_managers: test_managers, active_manager: None, app_data_root: app_data_root})
	}
	/*======================================================================================
	*/
	pub fn new_manager_from_json(test_type: TestType, setting_json_path: PathBuf) -> Result<Box<dyn TestManager>>{
		match test_type{
			TestType::MOS => {return Ok(Box::new(MOSManager::from_json(setting_json_path)?))}
			_ => {return Err(anyhow!("Not Implmented"))}
		}
	}

	/*======================================================================================
	*/
	pub fn get_managers(){

	}

	/*======================================================================================
	*/
	pub fn add_manager<S: AsRef<str>>(&self, json_string_from_frontend: S){

	}

	/*======================================================================================
	*/
	pub fn get_manager<S: AsRef<str>>(&self, test_name: S){
	}

	/*======================================================================================
	*/
	pub fn start_test<S: AsRef<str>>(test_name: S, participant_name: S){
		//let test_manager = get_manager(test_name.as_ref());

	}

	/*======================================================================================
	*/
	pub fn close_test(){

	}
}