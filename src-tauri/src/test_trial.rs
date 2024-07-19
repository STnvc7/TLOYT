pub mod mos;
pub mod ab_thurstone;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ScoreType {
    Valid,
    Dummy,
}

#[derive(Debug)]
pub enum TrialStatus {
    Doing,
    Done,
}

#[allow(dead_code)]
pub trait TestTrial {
    fn get_examinee(&self) -> String;
    fn get_audio(&mut self) -> Result<PathBuf>;
    fn set_score(&mut self, score: Vec<isize>) -> Result<()>;
    fn to_next(&mut self) -> Result<TrialStatus>;
    fn close(&self) -> Result<()>;
}
