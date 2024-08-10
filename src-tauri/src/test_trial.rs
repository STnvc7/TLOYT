pub mod thurstone;
pub mod mos;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ScoreType {
    Valid,
    Dummy,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum TrialStatus {
    Doing,
    Done,
}

#[allow(dead_code)]
pub trait TestTrial {
    fn get_audio(&mut self) -> Result<Vec<PathBuf>>;
    fn set_score(&mut self, score: Vec<String>) -> Result<()>;
    fn to_next(&mut self) -> Result<TrialStatus>;
    fn save_result(&self) -> Result<()>;
}
