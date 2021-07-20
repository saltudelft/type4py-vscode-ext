import * as vscode from 'vscode';
import { ParamHintCompletionProvider, ReturnHintCompletionProvider, TypeCompletionItem, VariableCompletionProvider } from './completionProvider';
import { InferApiData, InferApiPayload, transformInferApiData } from "./type4pyData";
import { paramHintTrigger, returnHintTrigger} from "./pythonData";
import { Type4PySettings } from './settings';
import typestore from './typestore';
import axios from 'axios';
import { INFER_REQUEST_TIMEOUT, INFER_URL_BASE, INFER_URL_BASE_DEV, TELEMETRY_REQ_TIMEOUT,
         TELEMETRY_URL_BASE, TELEMETRY_URL_BASE_DEV } from './constants';
import * as fs from 'fs';
import { ERROR_MESSAGES } from './messages';
import * as path from 'path';


// Called when the extension is activated.
export function activate(context: vscode.ExtensionContext) {

    const settings = new Type4PySettings();

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'python',
            new ParamHintCompletionProvider(context),
            paramHintTrigger
        ),
        vscode.languages.registerCompletionItemProvider(
            'python',
            new ReturnHintCompletionProvider(context),
            returnHintTrigger
        ),
        vscode.languages.registerCompletionItemProvider(
            'python',
            new VariableCompletionProvider(context),
            paramHintTrigger
        ),
    );

    // Register command for inferring type hints
    const inferCommand = vscode.commands.registerCommand('type4py.infer', async () => { infer(settings, context) });
    context.subscriptions.push(inferCommand);
    
    // Automatic type inference when opening a Python source file.
    vscode.workspace.onDidOpenTextDocument( async () => {
        if (settings.autoInfer) {
            if (context.workspaceState.get(vscode.window.activeTextEditor?.document.fileName!) === undefined) {
                    infer(settings, context, true)
                }
            }
         });
    
    // Sharing accepted type predictions based on the user's consent
    const comm = vscode.commands.registerCommand('submitAcceptedType', (typeCompletionItem: TypeCompletionItem) => {
       console.log(`Selected ${typeCompletionItem.label} for ${typeCompletionItem.typeSlot} with ${typeCompletionItem.rank}`);
       if (settings.shareAcceptedPredsEnabled) {
            const f_hash = vscode.window.activeTextEditor?.document.fileName!;
            var telemetry_url;
            if (settings.devMode) {
                telemetry_url = TELEMETRY_URL_BASE_DEV;
            } else {
                telemetry_url = TELEMETRY_URL_BASE;
            }

            var req_params;
            if (typeCompletionItem.label !== "" && typeCompletionItem.rank !== -1) {
                req_params = {
                    at: typeCompletionItem.label,
                    r: typeCompletionItem.rank,
                    ts: typeCompletionItem.typeSlot,
                    cp: 0,
                    fp: settings.fliterPredsEnabled ? 1 : 0,
                    idn: typeCompletionItem.identifierName,
                    tsl: typeCompletionItem.typeSlotLineNo,
                    sid: context.workspaceState.get(path.parse(vscode.workspace.asRelativePath(f_hash)).base) 
                }
                context.workspaceState.update("lastTypePrediction", null);
            } else {
                req_params = {
                    ts: typeCompletionItem.typeSlot,
                    cp: 1,
                    fp: settings.fliterPredsEnabled ? 1 : 0,
                    idn: typeCompletionItem.identifierName,
                    tsl: typeCompletionItem.typeSlotLineNo,
                    sid: context.workspaceState.get(path.parse(vscode.workspace.asRelativePath(f_hash)).base) 
                    }
            }
            const telemResult = axios.get(telemetry_url,
                {timeout: TELEMETRY_REQ_TIMEOUT , params: req_params}
                );
       }
       
   });

   if (vscode.env.isTelemetryEnabled) {
    settings.setShareAcceptedPreds = vscode.env.isTelemetryEnabled;
    } else {
        // Sharing accepted type predctions based on the user's consent
        vscode.window.showInformationMessage("Would you like to share accepted type predictions with us for research purposes?",
        ...["Yes", "No"]).then((answer) => {
            if (answer === "Yes") {
                settings.setShareAcceptedPreds = true;
            } else {
                settings.setShareAcceptedPreds = false;
            }}
        )
    }

    // Clear all the stored objects on workspaceState for development
    if (settings.devMode) {
        for (let k of context.workspaceState.keys()) {
            console.log(context.workspaceState.get(k));
            context.workspaceState.update(k, undefined);
        }
    }
}

// Called when the extension is deactivated.
export function deactivate() {

}

/**
 * Type4Py Infer command function
 *
 * @param settings Type4Py settings to use
 */
async function infer(settings: Type4PySettings, context: vscode.ExtensionContext,
                     auto: boolean=false): Promise<void> {
 
    // Get current file being editted
    const activeDocument = vscode.window.activeTextEditor?.document;

    if (!activeDocument) {
        vscode.window.showErrorMessage(ERROR_MESSAGES.noActiveFile);
    // Remove the file size limit for now!
    // } else if (activeDocument.lineCount > 1000) {
    //     vscode.window.showErrorMessage(ERROR_MESSAGES.lineCountExceeded);
    } else if (activeDocument.languageId !== "python") {
        if (auto === false){ vscode.window.showErrorMessage(ERROR_MESSAGES.nonPythonFile); }
    } else if (activeDocument.getText().length === 0) {
        if (auto === false){ vscode.window.showErrorMessage(ERROR_MESSAGES.emptyFile); }
    } else {
        try {
            // Read file contents
            const currentPath = activeDocument.fileName;
            const fileContents = fs.readFileSync(currentPath);
            var infer_url;

            const relativePath = path.parse(vscode.workspace.asRelativePath(currentPath)).base;
            vscode.window.showInformationMessage(`Inferring type annotations for the file ${relativePath}`);

            // Send request
            //console.log(`Sending request with TC: ${settings.tcEnabled}`);
            //console.log(`Sending request with FP: ${settings.fliterPredsEnabled}`)
            if (settings.devMode) {
                infer_url = INFER_URL_BASE_DEV;
            } else {
                infer_url = INFER_URL_BASE;
            }

            const inferResult = await axios.post<InferApiPayload>(infer_url, fileContents,
                { headers: { "Content-Type": "text/plain" }, timeout: INFER_REQUEST_TIMEOUT, params: {
                    // TODO: check with server side; this can be passed as boolean
                    //tc: settings.tcEnabled ? 0 : 0,
                    tc: 0,
                    fp: settings.fliterPredsEnabled ? 1 : 0
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
                
                // Submitting the last cancelled prediciton based on the user's consent 
                // before giving new predictions.
                if (context.workspaceState.get("lastTypePrediction") !== null) {
                    vscode.commands.executeCommand("submitAcceptedType",
                                    context!.workspaceState.get("lastTypePrediction"));
                }

                // Transform & cache API data
                const inferResultData: InferApiData = inferResult.data.response;
                const transformedInferResultData = transformInferApiData(inferResultData);
                console.log(transformedInferResultData);
                typestore.add(currentPath, transformedInferResultData);
                
                vscode.window.showInformationMessage(
                    `Type prediction for ${relativePath} completed!`
                );
                
                // Session ID of the current opened file assigned by the server.
                context.workspaceState.update(relativePath,
                                              inferResult.data.response['session_id'])
                // Remembers the last opened file for the auto-infer feature.
                context.workspaceState.update(currentPath, true);
                // Rememebers the last canceled type predictions for submission (based on the user's consent)
                context.workspaceState.update("lastTypePrediction", null);

            }
        } catch (error) {
            console.error(error);
            if (error.message) {
                vscode.window.showErrorMessage(error.message);
            }                
        }
    }
}
