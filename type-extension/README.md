# Type4Py VSCode hints extension
The extension is a [Python Type Hint](https://github.com/njqdev/vscode-python-typehint) fork, with Type4Py server integration to provide completion items for function parameters, return types and (soon) for variables.

## Setup & Usage
1. Build the package & install dependencies using `npm install`
2. Compile the extension using `npm run compile`
3. Open `src/extension.ts` in VSCode, open *"Select Environment"*, and run in *"VS Code Extension Development"*
4. Open a Python source code, open the Command Palette, and run the *"Type4Py: Infer type hints"* command. 
5. After a success message pops up, fill function annotations as usual (e.g. `x:` or `def ...) ->`), and type hint completion items will show up (if available)