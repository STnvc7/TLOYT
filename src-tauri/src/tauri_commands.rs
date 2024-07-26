use crate::app::{ApplicationManager, TestType};
use crate::test_trial::TrialStatus;

use std::sync::Mutex;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub fn add_test(
    app_manager: State<Mutex<ApplicationManager>>,
    test_type: TestType,
    json_string: String,
) -> Result<(), String> {
    let result = app_manager.lock().unwrap().add_test(test_type, json_string);
    match result {
        Ok(_) => return Ok(()),
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_test(
    app_manager: State<Mutex<ApplicationManager>>,
    test_name: String,
) -> Result<(), String> {
    let result = app_manager.lock().unwrap().delete_test(test_name);
    match result {
        Ok(_) => return Ok(()),
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn edit_test(
    app_manager: State<Mutex<ApplicationManager>>,
    test_name: String,
    json_string: String,
) -> Result<(), String> {
    let result = app_manager
        .lock()
        .unwrap()
        .edit_test(test_name, json_string);
    match result {
        Ok(_) => return Ok(()),
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn start_test(
    app_manager: State<Mutex<ApplicationManager>>,
    test_name: String,
    examinee: String,
) -> Result<(), String> {
    let result = app_manager.lock().unwrap().start_test(test_name, examinee);
    match result {
        Ok(_) => return Ok(()),
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn close_test(
    app_manager: State<Mutex<ApplicationManager>>,
    examinee: String,
) -> Result<(), String> {
    let result = app_manager.lock().unwrap().close_test(examinee);
    match result {
        Ok(_) => return Ok(()),
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_audio(
    app_manager: State<Mutex<ApplicationManager>>,
) -> Result<Vec<String>, String> {
    let result = app_manager.lock().unwrap().get_audio();
    match result {
        Ok(p) => {
            let paths: Vec<String> = p.into_iter()
            .map(|_p| _p.to_string_lossy().into_owned())
            .collect();
            return Ok(paths);
        }
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn set_score(
    app_manager: State<Mutex<ApplicationManager>>,
    score: Vec<String>,
) -> Result<TrialStatus, String> {
    let result = app_manager.lock().unwrap().set_score(score);
    match result {
        Ok(v) => return Ok(v),
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_settings(
    app_manager: State<Mutex<ApplicationManager>>,
) -> Result<Vec<String>, String> {
    let result = app_manager.lock().unwrap().get_settings();
    match result {
        Ok(v) => return Ok(v),
        Err(s) => return Err(s.to_string()),
    }
}
