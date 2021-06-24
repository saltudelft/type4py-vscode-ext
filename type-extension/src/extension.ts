import * as vscode from 'vscode';
import { ParamHintCompletionProvider, ReturnHintCompletionProvider } from './completionProvider';
import { FunctionInferData, InferApiResponse, paramHintTrigger, returnHintTrigger, transformInferApiData } from "./python";
import { TypeHintSettings } from './settings';
import * as cp from 'child_process';
import * as path from 'path';
import typestore from './typestore';
import { privateEncrypt } from 'crypto';
import axios from 'axios';
import { INFER_URL_BASE } from './constants';
import * as fs from 'fs';


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
        )
    );

    
    // Register command for inferring type hints
    // const PYTHON_INFER_SCRIPT_PATH = context.asAbsolutePath(path.join('python', 'test_response.py'));

    const inferCommand = vscode.commands.registerCommand('type4py.infer', async () => {
        vscode.window.showInformationMessage("Inferring type hints for current file...");

        // Get current file being editted
        const currentPath = vscode.window.activeTextEditor?.document.fileName;

        // TODO: exception handling when no file present, or when non-Python file
        if (currentPath) {
            try {
                const fileContents = fs.readFileSync(currentPath);
                const inferResult = await axios.post<InferApiResponse>(INFER_URL_BASE, fileContents,
                    { headers: { "Content-Type": "text/plain" } }
                );

                console.log(inferResult);

                const inferResultData = inferResult.data;
                const transformedInferResultData = transformInferApiData(inferResultData);
                typestore.add(currentPath, transformedInferResultData);

                // TODO: set timeout for request? (and report error via message)
                // TODO: indicate file path
                vscode.window.showInformationMessage("Type hint inference complete!");
            } catch (error) {
                // TODO: more precise error handling
                vscode.window.showErrorMessage(error);
            }

            // cp.exec(`python3 ${PYTHON_INFER_SCRIPT_PATH}`, (error, stdout, stderr) => {
            //     // TODO: exception handling

            //     // Output file is a JSON file, parse it and add to state
            //     const res: Array<FunctionInferData> = JSON.parse(stdout);
            //     typestore.add(currentPath, res);

            //     vscode.window.showInformationMessage("Type hint inference complete!");
            // })
        }
    });

    context.subscriptions.push(inferCommand);
}

// Called when the extension is deactivated.
export function deactivate() {}
