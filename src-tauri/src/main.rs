// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod cli;
mod constants;
mod test_manager;
mod test_trial;

use anyhow::Result;

// #[tauri::command]
// fn my_custom_command() {
//     println!("I was invoked from JS!");
// }
// fn main() {
//     tauri::Builder::default()
//         .invoke_handler(tauri::generate_handler![my_custom_command,])
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }

fn main() -> Result<()> {
    cli::cli_test()?;
    Ok(())
}