# VSCode Extension of Type4Py
This extension asissts Python developers to gradually add type annotations to their existing codebases. Type annotations are inferred by [Type4Py](https://github.com/saltudelft/type4py), which is a deep similarity learning-based type inference model for Python.

- [Usage](#usage)
- [Installation](#installation)
- [Privacy](#privacy)
- [Limitations](#limitations)
- [Development](#contributors)
- [Acknowledgements](#acknowledgements)

# Usage

# Installation

# Privacy
Privacy is very prominent for us. That is, we do consider the following privacy concerns:
- We do NOT store private code in our server.
- We do NOT store any information from users such as location, system info, usage stats, coding preferences, etc.

# Limitations
To accomodate fair use and avialablity for all users, the exentions has currrently the following limitations:
- **Rate limit**: 5 requests per hour and 100 requests per day.
- **File size**: Python source files of up to 1K LoC can be processed.

# Support
Issues and errors can be reported [here](https://github.com/saltudelft/type4py-vscode-ext/issues).

# Type4Py VSCode hints extension
The extension is a [Python Type Hint](https://github.com/njqdev/vscode-python-typehint) fork, with Type4Py server integration to provide completion items for function parameters, return types and (soon) for variables.

# Development
To contribute or make changes to the extension, follow the below steps:
1. Build the package & install dependencies using `npm install`
2. Compile the extension using `npm run compile`
3. Open `src/extension.ts` in VSCode, open *"Select Environment"*, and run in *"VS Code Extension Development"*
4. Open a Python source code file, open the Command Palette, and run the *"Type4Py: Infer type annotations"* command. 
5. After a success message pops up, fill function annotations as usual (e.g. `x:` or `def ...) ->`), and type hint completion items will show up (if available)

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