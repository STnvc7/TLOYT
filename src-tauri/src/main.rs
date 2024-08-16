// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod cli;
mod constants;
mod error;
mod tauri_commands;
mod test_manager;
mod test_trial;

use crate::app::ApplicationManager;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_log::LogTarget;
use log::info;

fn main() {

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    LogTarget::Stdout, 
                    LogTarget::Webview,
                    LogTarget::LogDir
                ]).build(),
        )
        .setup(|app| {
            info!("Application start");
            // let app_data_root = data_dir().unwrap().join("TLOYT");
            let app_data_root = app.handle().path_resolver().app_data_dir().unwrap();
            let app_manager_raw = ApplicationManager::setup(app_data_root)?;
            let app_manager = Mutex::new(app_manager_raw);
            app.manage(app_manager);

            // 開発時だけdevtoolsを表示する。
            #[cfg(debug_assertions)]
            app.get_window("main").unwrap().open_devtools();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            tauri_commands::add_test,
            tauri_commands::delete_test,
            tauri_commands::edit_test,
            tauri_commands::start_test,
            tauri_commands::close_test,
            tauri_commands::get_audio,
            tauri_commands::set_score,
            tauri_commands::get_settings,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// use anyhow::Result;
// fn main() -> Result<()> {
//     cli::cli_test()?;
//     Ok(())
// }
