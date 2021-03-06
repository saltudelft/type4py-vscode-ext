export const ERROR_MESSAGES = {
    'lineCountExceeded': "The selected file exceeds the 1000 LoC limitation." +
        " Please resubmit a request with a smaller file.",
    'noActiveFile': "No document is opened in the VSCode editor.",
    'nonPythonFile': "Cannot infer type annotations for non-Python code files.",
    'emptyFile': "Cannot infer type annotations for empty files.",
    'emptyPayload': "The received response was empty.",
    'connectionError': "Could not connect to the server.",
    'localModelNotDetected': "Could not use the local model. Ensure that Type4Py's Docker container is running." 
};

export const TELEMETRY_REQUEST_MESSAGE = "Would you like to share accepted " +
    "type predictions with us for research purposes?";
