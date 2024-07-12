use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

//===================================================
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ParticipantStatus {
    Yet,
    Done,
}

//===================================================
// this struct is made for member of struct that implement TestManager trait.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Participant {
    name: String,
    status: ParticipantStatus,
}
#[allow(dead_code)]
impl Participant {
    pub fn new(name: String) -> Self {
        return Participant {
            name: name,
            status: ParticipantStatus::Yet,
        };
    }
    pub fn get_name(&self) -> String {
        self.name.clone()
    }
    pub fn get_status(&self) -> ParticipantStatus {
        return match self.status {
            ParticipantStatus::Done => ParticipantStatus::Done,
            ParticipantStatus::Yet => ParticipantStatus::Yet,
        };
    }
    pub fn set_status_done(&mut self) {
        self.status = ParticipantStatus::Done;
    }
    pub fn set_status_yet(&mut self) {
        self.status = ParticipantStatus::Yet;
    }
}

//===================================================
// this struct is made for member of struct that implement TestManager trait.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Category {
    category: String,
    original_path: PathBuf,
    audio_files: Vec<PathBuf>,
}
#[allow(dead_code)]
impl Category {
    pub fn new(category: String, path: PathBuf) -> Result<Self> {
        let mut audio_files: Vec<PathBuf> = Vec::new();
        let entries = fs::read_dir(&path)?;
        for entry in entries {
            let file_path = entry?.path();
            let file_name = PathBuf::from(file_path.file_name().unwrap());
            audio_files.push(file_name);
        }

        return Ok(Category {
            category: category,
            original_path: path,
            audio_files: audio_files,
        });
    }
    pub fn get_category_name(&self) -> String {
        self.category.clone()
    }
    pub fn get_original_path(&self) -> PathBuf {
        self.original_path.clone()
    }
    pub fn get_audio_files(&self) -> Vec<PathBuf> {
        self.audio_files.clone()
    }
}
