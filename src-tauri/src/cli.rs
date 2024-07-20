use crate::app::{ApplicationManager, TestType};
use crate::test_trial::TrialStatus;

use anyhow::Result;
use dialoguer::Select;
use std::path::PathBuf;

pub fn cli_test() -> Result<()> {
    let mut app_manager =
        ApplicationManager::setup(PathBuf::from("C:\\Users\\hiroh\\AppData\\Roaming\\TLOYT"))?;

    // app_manager.delete_test("AB".to_string())?;

    // let mut json = r#"
    // {
    //     "name": "AB",
    //     "author": "k_hiro",
    //     "description": "Subjective Test for SSW",
    //     "participants": ["n_ichi", "m_oka"],
    //     "categories": [
    //         ["PCM", "C:\\Users\\hiroh\\Downloads\\GroundTruth"],
    //         ["Deep Performer", "C:\\Users\\hiroh\\Downloads\\Proposed"]
    //     ],
    //     "time_limit": 5
    // }"#;

    // app_manager.add_new_test(TestType::ABThurstone, json.to_string())?;

    let json = r#"
    {
        "name": "AB_test",
        "author": "k_hiro",
        "description": "Subjective Test for SSW",
        "participants": ["n_ichi", "m_oka", "k_hiro"],
        "categories": [
            ["PCM", "C:\\Users\\hiroh\\Downloads\\GroundTruth"],
            ["Deep Performer", "C:\\Users\\hiroh\\Downloads\\Proposed"]
        ],
        "time_limit": 5
    }"#;
    app_manager.edit_test("AB".to_string(), json.to_string())?;
    let string = app_manager.get_setup_info("AB".to_string());
    println!("{:?}", string);
    // app_manager.start_test("AB".to_string(), "n_ichi".to_string())?;
    // let scores = vec![0,1];
    // loop {
    //     for _ in 0..=1{
    //         let file = app_manager.get_audio("AB".to_string())?;
    //         println!("{:?}", file);
    //     }
    //     let selection = Select::new().items(&scores).interact()?;
    //     let status = app_manager.set_score("AB".to_string(), vec![scores[selection]])?;
    //     match status {
    //         TrialStatus::Done => break,
    //         _ => {}
    //     }
    // }
    // app_manager.close_test("AB".to_string(), "n_ichi".to_string())?;
    Ok(())
}
