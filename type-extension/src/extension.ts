import * as vscode from 'vscode';
import { ParamHintCompletionProvider, ReturnHintCompletionProvider, VariableCompletionProvider } from './completionProvider';
import { InferApiData, InferApiPayload, transformInferApiData } from "./type4pyData";
import { paramHintTrigger, returnHintTrigger } from "./pythonData";
import { Type4PySettings } from './settings';
import typestore from './typestore';
import axios from 'axios';
import { INFER_REQUEST_TIMEOUT, INFER_URL_BASE } from './constants';
import * as fs from 'fs';
import { ERROR_MESSAGES } from './messages';


// Called when the extension is activated.
export function activate(context: vscode.ExtensionContext) {

    const settings = new Type4PySettings();

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'python',
            new ParamHintCompletionProvider(),
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
    const inferCommand = vscode.commands.registerCommand('type4py.infer', async () => { infer(settings) });
    context.subscriptions.push(inferCommand);
}

// Called when the extension is deactivated.
export function deactivate() {}

/**
 * Type4Py Infer command function
 *
 * @param settings Type4Py settings to use
 */
async function infer(settings: Type4PySettings): Promise<void> {
    vscode.window.showInformationMessage("Inferring type hints for current file...");

    // Get current file being editted
    const activeDocument = vscode.window.activeTextEditor?.document;

    if (!activeDocument) {
        vscode.window.showErrorMessage(ERROR_MESSAGES.noActiveFile);
    } else if (activeDocument.lineCount > 1000) {
        vscode.window.showErrorMessage(ERROR_MESSAGES.lineCountExceeded);
    } else if (activeDocument.languageId !== "python") {
        vscode.window.showErrorMessage(ERROR_MESSAGES.nonPythonFile);
    } else if (activeDocument.lineCount === 0) {
        vscode.window.showErrorMessage(ERROR_MESSAGES.emptyFile);
    } else {
        try {
            // Read file contents
            const currentPath = activeDocument.fileName;
            const fileContents = fs.readFileSync(currentPath);

            // Send request
            console.log(`Sending request with TC: ${settings.tcEnabled}`);
            const inferResult = await axios.post<InferApiPayload>(INFER_URL_BASE, fileContents,
                { headers: { "Content-Type": "text/plain" }, timeout: INFER_REQUEST_TIMEOUT, params: {
                    // TODO: check with server side; this can be passed as boolean
                    tc: settings.tcEnabled ? 1 : 0
                }}
            );
            console.log(inferResult);
            
            // Check if response is present & report error if not
            if (!inferResult.data.response) {
                if (inferResult.data.error) {
                    vscode.window.showErrorMessage(inferResult.data.error);
                } else {
                    vscode.window.showErrorMessage(ERROR_MESSAGES.emptyPayload);
                }
            } else {
                // Transform & cache API data
                const inferResultData: InferApiData = inferResult.data.response;
                const transformedInferResultData = transformInferApiData(inferResultData);
                console.log(transformedInferResultData);
                typestore.add(currentPath, transformedInferResultData);
    
                const relativePath = vscode.workspace.asRelativePath(activeDocument.fileName);
                vscode.window.showInformationMessage(
                    `Type hint inference for ${relativePath} complete!`
                );
            }
        } catch (error) {
            console.error(error);

            if (error.message) {
                vscode.window.showErrorMessage(error.message);
            }                
        }
    }
}
