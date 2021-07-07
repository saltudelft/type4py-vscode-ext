# VSCode Extension of Type4Py
This extension provides machine learning-based type autocompletion for Python, which assists developers to gradually add type annotations to their existing codebases.

- [Core Features](#core-features)
- [Usage](#usage)
- [Installation](#installation)
- [Privacy](#privacy)
- [Limitations](#limitations)
- [Support](#support)
- [Development](#development)
- [Contributors](#contributors)
- [Acknowledgements](#acknowledgements)

# Core Features
- **Machine learning**-based type prediction (powered by [Type4Py](https://github.com/saltudelft/type4py))
- Improved **autocompletion** for Python type annotations (based on [Python Type Hint](https://github.com/njqdev/vscode-python-typehint))
- Type autocompletion for **parameters** and **return types** of functions.
- Type autocompletion for module, class, and local **variables**.
- Simple, fairly fast and easy to use.

# Usage

# Installation
**NOTE:** Update VSCode before installing the extension.

The latest version of the extension can be installed from the VSCode [marketplace](). 

# Privacy
Privacy is very prominent for us. That is, we do consider the following privacy concerns:
- We do NOT store private code on our server.
- We do NOT store any information from users such as location, system info, usage stats, coding preferences, etc.

# Limitations
To accommodate fair use and availability for all users, the extension has currently the following limitations:
- **Rate limit**: 5 requests per hour and 100 requests per day.
- **File size**: Python source files of up to 1K LoC can be processed.

# Support
Issues and errors can be reported [here](https://github.com/saltudelft/type4py-vscode-ext/issues).

# Development
External contributions are welcome such as bug fixes and improvements! Feel free to send a pull request.
## Running the extension from source
1. Build the package & install dependencies using `npm install`
2. Compile the extension using `npm run compile`
3. Open `src/extension.ts` in VSCode, open *"Select Environment"*, and run in *"VS Code Extension Development"*
4. Open a Python source code file, open the Command Palette, and run the *"Type4Py: Infer type annotations"* command. 
5. After a success message pops up, fill function annotations as usual (e.g. `x:` or `def ...) ->`), and type completion items will show up (if available)

# Contributors
## Researchers & Developers
- Amir M. Mir (@mir-am)
- Evaldas Latoškinas (@elatoskinas)
## Supervisors
- Sebastian Proksch (@proksch)
- Georgios Gousios (@gousiosg)

# Acknowledgements
The Type4Py model and its VSCode extension are designed and developed in [SERG](https://se.ewi.tudelft.nl/) at the Delft University of Technology.

<img src="images/tudlogo.png" alt="TUD_logo" width="200"/>