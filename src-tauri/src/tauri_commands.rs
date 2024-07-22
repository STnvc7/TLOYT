use crate::app::{ApplicationManager, TestType};
use crate::test_trial::TrialStatus;

use std::sync::Mutex;
use tauri::State;

#[tauri::command]
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

#[tauri::command]
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

#[tauri::command]
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

#[tauri::command]
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

#[tauri::command]
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

#[tauri::command]
pub fn get_audio(
    app_manager: State<Mutex<ApplicationManager>>,
) -> Result<String, String> {
    let result = app_manager.lock().unwrap().get_audio();
    match result {
        Ok(p) => {
            let path = p.to_string_lossy().into_owned();
            return Ok(path);
        }
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command]
pub fn set_score(
    app_manager: State<Mutex<ApplicationManager>>,
    score: Vec<isize>,
) -> Result<TrialStatus, String> {
    let result = app_manager.lock().unwrap().set_score(score);
    match result {
        Ok(v) => return Ok(v),
        Err(s) => return Err(s.to_string()),
    }
}

#[tauri::command]
pub fn get_settings(
    app_manager: State<Mutex<ApplicationManager>>,
) -> Result<Vec<(TestType, String)>, String> {
    let result = app_manager.lock().unwrap().get_settings();
    match result {
        Ok(v) => return Ok(v),
        Err(s) => return Err(s.to_string()),
    }
}
