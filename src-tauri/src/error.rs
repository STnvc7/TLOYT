use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApplicationError {
    #[error("\'{0}\' has already used")]
    AlreadyUsedTestNameError(String),   
    #[error("There is no available test: {0}")]
    UnavailableTestError(String),
    #[error("There is no trial data: {0}")]
    TrialDataNotFoundError(PathBuf),
    #[error("{0} has already taken test")]
    AlreadyTakenTrialError(String),
    #[error("{0} is not registerd for {1}")]
    UnregisteredParticipantError(String, String),
    #[error("There is no test data: {0}")]
    TestDataNotFoundError(PathBuf),
    #[error("The names of the audio files are not the same between category")]
    DifferentFilenameInCategoryError,
    #[error("Different type for set score")]
    InvalidScoreInputTypeError,
}
