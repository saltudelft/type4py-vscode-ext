import * as vscode from 'vscode';
import { ParamHintCompletionProvider, ReturnHintCompletionProvider, VariableCompletionProvider } from './completionProvider';
import { FunctionInferData, InferApiResponse, paramHintTrigger, returnHintTrigger, transformInferApiData } from "./python";
import { TypeHintSettings } from './settings';
import * as cp from 'child_process';
import * as path from 'path';
import typestore from './typestore';
import { privateEncrypt } from 'crypto';
import axios from 'axios';
import { INFER_URL_BASE } from './constants';
import * as fs from 'fs';
import { ERROR_MESSAGES } from './messages';


// Called when the extension is activated.
export function activate(context: vscode.ExtensionContext) {

    const settings = new TypeHintSettings();

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'python',
            new ParamHintCompletionProvider(settings),
            paramHintTrigger
        ),
        vscode.languages.registerCompletionItemProvider(
            'python',
            new ReturnHintCompletionProvider(),
            returnHintTrigger
        ),
        vscode.languages.registerCompletionItemProvider(
            'python',
            new VariableCompletionProvider(),
            paramHintTrigger
        ),
    );

    
    // Register command for inferring type hints
    // const PYTHON_INFER_SCRIPT_PATH = context.asAbsolutePath(path.join('python', 'test_response.py'));

    const inferCommand = vscode.commands.registerCommand('type4py.infer', async () => {
        vscode.window.showInformationMessage("Inferring type hints for current file...");

        // Get current file being editted
        const activeDocument = vscode.window.activeTextEditor?.document;

        if (activeDocument) {
            if (activeDocument.lineCount > 1000) {
                vscode.window.showErrorMessage(ERROR_MESSAGES.lineCountExceeded);
                return;
            } else if (activeDocument.languageId !== "python") {
                vscode.window.showErrorMessage(ERROR_MESSAGES.nonPythonFile);
                return;
            } else if (activeDocument.lineCount === 0) {
                vscode.window.showErrorMessage(ERROR_MESSAGES.emptyFile);
                return;
            }

            const currentPath = activeDocument.fileName;
            try {
                const fileContents = fs.readFileSync(currentPath);
                const inferResult = await axios.post(INFER_URL_BASE, fileContents,
                    { headers: { "Content-Type": "text/plain" } }
                );

                // TODO: set timeout for request? (and report error via message)
                // TODO: indicate file path
                console.log(inferResult);

                const inferResultData: InferApiResponse = inferResult.data['response'];
                const transformedInferResultData = transformInferApiData(inferResultData);
                console.log(transformedInferResultData);
                typestore.add(currentPath, transformedInferResultData);

                vscode.window.showInformationMessage("Type hint inference complete!");
            } catch (error) {
                // TODO: more precise error handling
                vscode.window.showErrorMessage(error);
            }
        } else {
            vscode.window.showErrorMessage(ERROR_MESSAGES.noActiveFile);
        }
    });

    context.subscriptions.push(inferCommand);
}

// Called when the extension is deactivated.
export function deactivate() {}
