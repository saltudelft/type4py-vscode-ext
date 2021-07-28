# Changelog
All notable changes to the [Type4Py's VSCode extension](https://github.com/saltudelft/type4py-vscode-ext) will be documented in this file. The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.4] - 2021-07-21
### Added
- Detecting `ExtensionMode` for testing and development using the local server (**ONLY FOR THE EXTENSION'S DEVELOPERS**).
- Submitting the canceled/rejected type predictions based on the user's consent.
- Sending the hash of files' absolute path, the extension's version, and activation ID along with the prediction request (**ONLY FOR RESEARCH PURPOSE**).

## [0.1.3] - 2021-07-17
### Added
- Automatic type inference when a Python file is opened. A setting is created for this, which is false by default.
- Included the name of the file in the information window when type inference is invoked.
- Some revision to README and PRIVACY.

### Changed
- Moved the design figure from README to a separate file, `DESIGN.md`.

### Removed
- Removed the 1K LoC limitation for Python source files.
- Removed type-checking setting until we support it.

## [0.1.2] - 2021-07-15
### Added
- Some improvements to README and the package file

### Fixed
- The list of predicted types changes when inserting an extra space after the annotation syntax, i.e, `:` or `->`.


## [0.1.0] - 2021-07-14
### Added
- Querying the pre-trained [Type4Py](https://github.com/saltudelft/type4py) model on the server.
- Handling the server's responses and convert to defined data structures for type suggestions.
- Type autocompletion for parameters and return type functions/class methods.
- Type autocompletion for variables (i.e. module-level variables, class variables, and local variables).
- Exception handlings and considering limitations.
- Adding settings for type-checking and filtering out type predictions.
- Gathering telemetry data for accepted type predictions based on the user's consent.
- Adding README

