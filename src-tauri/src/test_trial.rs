pub mod mos;

use crate::test_core::Category;

use anyhow::Result;
use std::path::PathBuf;

#[allow(dead_code)]
pub trait TestTrial<T> {
    fn generate(
        manager_data_root: PathBuf,
        participant_name: String,
        categories: Vec<Category>,
        num_repeat: usize,
    ) -> Result<T>;
    fn get_question(&self) -> PathBuf;
    fn set_answer(&mut self, rate: Vec<isize>);
    fn to_next(&mut self);
    fn close(&self) -> Result<()>;
}
