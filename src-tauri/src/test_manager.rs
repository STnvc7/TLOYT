pub mod mos;

use anyhow::Result;
use std::path::PathBuf;

//===================================================
// struct that implement this trait behave as TestManager
// TestManager controls(launch and close) each Trial
#[allow(dead_code)]
pub trait TestManager{
    fn delete(&self);
    fn launch_trial(&mut self, participant_name: String) -> Result<()>;
    fn get_question(&self) -> Result<PathBuf>;
    fn set_answer(&mut self, rate: Vec<isize>) -> Result<()>;
    fn close_trial(&mut self) -> Result<()>;

    //====================================================================
    fn copy_categories(&self) -> Result<()>;
    fn save_setting(&self) -> Result<()>;
}
