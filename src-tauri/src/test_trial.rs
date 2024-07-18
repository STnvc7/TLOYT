pub mod mos;

use anyhow::Result;
use std::path::PathBuf;

#[derive(Debug)]
pub enum TrialStatus {
    Doing,
    Done,
}

#[allow(dead_code)]
pub trait TestTrial {
    fn get_examinee(&self) -> String;
    fn get_audio(&self) -> PathBuf;
    fn set_score(&mut self, score: Vec<isize>);
    fn to_next(&mut self) -> TrialStatus;
    fn close(&self) -> Result<()>;
}
