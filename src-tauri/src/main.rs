// // Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// #[tauri::command]
// fn my_custom_command() {
//   println!("I was invoked from JS!");
// }
// fn main() {
//     tauri::Builder::default()
//         .invoke_handler(tauri::generate_handler![
//             my_custom_command,
//         ])
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }

mod app;
mod test_core;
mod test_manager;
mod test_trial;

use crate::app::ApplicationManager;
use crate::test_manager::mos::MOSManager;
use anyhow::Result;
use std::path::PathBuf;

#[allow(dead_code)]
mod path_name {
    pub const TEST_MANAGER_DIRNAME: &str = "test_manager";

    pub const CATEGORIES_DIRNAME: &str = "categories";
    pub const TRIAL_DIRNAME: &str = "trials";

    pub const TEST_LIST_FILENAME: &str = "test_list.json";
    pub const TEST_MANAGER_SETTING_FILENAME: &str = "setting.json";
}

fn main() -> Result<()> {
    let json = r#"
    { 
        "name": "MOS_test",
        "author": "k_hiro",
        "description": "Subjective Test for SSW",
        "participants": ["n_ichi", "m_oka"],
        "categories": [
            ["Ground Truth", "C:\\Users\\hiroh\\Downloads\\GroundTruth"],
            ["Proposed", "C:\\Users\\hiroh\\Downloads\\Proposed"]
        ],
        "time_limit": 5,
        "num_repeat": 2
    }"#;

    let mut app_manager =
        ApplicationManager::new(PathBuf::from("C:\\Users\\hiroh\\AppData\\Roaming\\TLOYT"))?;

    // println!("{:?}", app_manager);
    // let mut manager = MOSManager::setup(
    //     PathBuf::from("C:\\Users\\hiroh\\AppData\\Roaming\\TLOYT"),
    //     json,
    // )?;
    // manager.save_setting()?;
    // manager.copy_categories()?;

    // manager.launch_trial("n_ichi")?;
    // manager.close_trial()?;

    Ok(())
}
