import * as vscode from 'vscode';
import {
    ParamHintCompletionProvider,
    ReturnHintCompletionProvider,
    TypeCompletionItem,
    VariableCompletionProvider
} from './completionProvider';
import { InferApiData, InferApiPayload, transformInferApiData } from "./type4pyData";
import { paramHintTrigger, returnHintTrigger} from "./pythonData";
import { Type4PySettings } from './settings';
import typestore from './typestore';
import axios from 'axios';
import { INFER_REQUEST_TIMEOUT, INFER_URL_BASE, INFER_URL_BASE_DEV, INFER_URL_BASE_LOCAL, TELEMETRY_REQ_TIMEOUT,
         TELEMETRY_URL_BASE, TELEMETRY_URL_BASE_DEV} from './constants';
import { ERROR_MESSAGES, TELEMETRY_REQUEST_MESSAGE } from './messages';
import * as path from 'path';
import {createHash, randomBytes} from 'crypto';
import { Type4PyOutputChannel, Type4PyStatusBar } from './ui';

// Dependencies for the web version of the extension
const fetch = require('node-fetch').default;
var Url = require('url-parse');

export interface Type4PyApi {
    typestore: typeof typestore
}

// Called when the extension is activated.
export function activate(context: vscode.ExtensionContext): Type4PyApi {

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
    
    var t4pyOutputChannel = new Type4PyOutputChannel(context);
    var t4pyStatusBar = new Type4PyStatusBar(context, t4pyOutputChannel);
    
    // Register command for inferring type hints
    const inferCommand = vscode.commands.registerCommand('type4py.infer', async () => { 
        await infer(settings,
                    context,
                    t4pyStatusBar,
                    t4pyOutputChannel);
    });
    context.subscriptions.push(inferCommand);
    
    // Automatic type inference when opening a Python source file.
    vscode.workspace.onDidOpenTextDocument( async () => {
        if (settings.autoInfer) {
            if (context.workspaceState.get(
                vscode.window.activeTextEditor?.document.fileName!
            ) === undefined) {
                    await infer(settings, context, t4pyStatusBar, t4pyOutputChannel, true);
                }
            }
         });
    
    // Sharing accepted type predictions based on the user's consent
    const comm = vscode.commands.registerCommand('submitAcceptedType',
    (typeCompletionItem: TypeCompletionItem) => {
       console.log(`Selected ${typeCompletionItem.label} for ${typeCompletionItem.typeSlot}` +
                    `with ${typeCompletionItem.rank}`);
       if (settings.shareAcceptedPredsEnabled) {
            const f = vscode.window.activeTextEditor?.document.fileName!;                       
            var telemetry_url;

            if (context.extensionMode === vscode.ExtensionMode.Production) {
                telemetry_url = TELEMETRY_URL_BASE;
            } else {
                telemetry_url = TELEMETRY_URL_BASE_DEV;
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
                    sid: context.workspaceState.get(
                        path.parse(vscode.workspace.asRelativePath(f)).base
                    )
                };
                context.workspaceState.update("lastTypePrediction", null);
            } else {
                req_params = {
                    ts: typeCompletionItem.typeSlot,
                    cp: 1,
                    fp: settings.fliterPredsEnabled ? 1 : 0,
                    idn: typeCompletionItem.identifierName,
                    tsl: typeCompletionItem.typeSlotLineNo,
                    sid: context.workspaceState.get(
                        path.parse(vscode.workspace.asRelativePath(f)).base
                    ) 
                    };
            }
            const telemResult = axios.get(telemetry_url,
                {timeout: TELEMETRY_REQ_TIMEOUT , params: req_params}
                );
       }
       
   });

   if (context.globalState.get("activation_id") === undefined) {
        if (vscode.env.isTelemetryEnabled) {
            settings.setShareAcceptedPreds = vscode.env.isTelemetryEnabled;
            } else {
                // Sharing accepted type predctions based on the user's consent
                vscode.window.showInformationMessage(
                    TELEMETRY_REQUEST_MESSAGE,
                    ...["Yes", "No"]).then((answer) => {
                    if (answer === "Yes") {
                        settings.setShareAcceptedPreds = true;
                    } else {
                        settings.setShareAcceptedPreds = false;
                    }}
                );
            }
   }
   
    // Each installation of the extension gets a random activation ID once!
    if (context.globalState.get("activation_id") === undefined) {
        context.globalState.update("activation_id", randomBytes(16).toString('hex'));
    }
    
    // Clear all the stored objects on workspaceState for development
    if (!(context.extensionMode === vscode.ExtensionMode.Production)) {
        for (let k of context.workspaceState.keys()) {
            context.workspaceState.update(k, undefined);
        }
    }

    // Expose public API
    return {
        typestore
    };
}

// Called when the extension is deactivated.
export function deactivate() {

}

/**
 * Type4Py Infer command function
 *
 * @param settings Type4Py settings to use
 */
async function infer(
    settings: Type4PySettings,
    context: vscode.ExtensionContext,
    statusBar: Type4PyStatusBar,
    outputChannel: Type4PyOutputChannel,
    auto: boolean=false
): Promise<void> {
 
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
            const fileContents = activeDocument.getText();
            var inferUrl: string;

            const relativePath = path.parse(vscode.workspace.asRelativePath(currentPath)).base;
            statusBar.updateInProgress();
            
            // Select either local model or central server
            if (settings.useLocalModel === true) {
                inferUrl = INFER_URL_BASE_LOCAL;
                outputChannel.appendInProgress(relativePath, true);
            } else {
                if (context.extensionMode === vscode.ExtensionMode.Production) {
                    inferUrl = INFER_URL_BASE;
                } else {
                    inferUrl = INFER_URL_BASE_DEV; // Development and testing
                }
                outputChannel.appendInProgress(relativePath, false);
            }
            outputChannel.show();
            
            var inferResult;
            var req_params = {
                tc: 0,
                fp: settings.fliterPredsEnabled ? 1 : 0,
                ai: context.globalState.get("activation_id"),
                fh: createHash('sha256').update(currentPath, 'utf8').digest('hex'),
                ev: vscode.extensions.getExtension('saltud.type4py')?.packageJSON.version
            };
            if (vscode.env.uiKind === vscode.UIKind.Desktop) {
                inferResult = await axios.post<InferApiPayload>(inferUrl, fileContents,
                    {headers: { "Content-Type": "text/plain" }, timeout: INFER_REQUEST_TIMEOUT, params: req_params});
                    console.log(inferResult);
            } else {
                // For the web version of VS Code
                const response = await fetch(new Url("./fetch", inferUrl+"/").href, {
                method: 'POST',
                body: JSON.stringify(Object.assign({}, {
                    f: fileContents}, req_params)),
                    headers: { "Content-Type": "text/plain"},
                    timeout: INFER_REQUEST_TIMEOUT
                });
                inferResult = {data: await response.json()};
            }
            
            // Check if response is present & report error if not
            if (!inferResult.data.response) {
                if (inferResult.data.error) {
                    vscode.window.showErrorMessage(inferResult.data.error);
                    statusBar.updateInProgressWithErrors();
                    outputChannel.appendError(relativePath, inferResult.data.error);
                } else {
                    vscode.window.showErrorMessage(ERROR_MESSAGES.emptyPayload);
                    statusBar.updateInProgressWithErrors();
                    outputChannel.appendError(relativePath, ERROR_MESSAGES.emptyPayload);
                }
            } else {
                // Submitting the last cancelled prediciton based on the user's consent 
                // before giving new predictions.
                if (context.workspaceState.get("lastTypePrediction") !== null) {
                    vscode.commands.executeCommand("submitAcceptedType",
                        context!.workspaceState.get("lastTypePrediction")).then(undefined, err => {
                            console.error("Couldn't submit the accepted/rejected type!");
                        });
                }

                // Transform & cache API data
                const inferResultData: InferApiData = inferResult.data.response;
                const transformedInferResultData = transformInferApiData(inferResultData);
                typestore.add(currentPath, transformedInferResultData);
                
                // vscode.window.setStatusBarMessage(
                //     `Type prediction for ${relativePath} completed!`
                // );
                statusBar.updateCompleted();
                outputChannel.appendCompleted(relativePath);
                
                // Session ID of the current opened file assigned by the server.
                context.workspaceState.update(relativePath,
                                              inferResult.data.response['session_id']);
                // Remembers the last opened file for the auto-infer feature.
                context.workspaceState.update(currentPath, true);
                // Rememebers the last canceled type predictions for submission
                // (based on the user's consent)
                context.workspaceState.update("lastTypePrediction", null);

            }
        } catch (error) {
            console.error(error);
            if (error.message) {
                statusBar.updateInProgressWithErrors();
                if (settings.useLocalModel == true) {
                    vscode.window.showErrorMessage(ERROR_MESSAGES.localModelNotDetected);
                } else {
                    vscode.window.showErrorMessage(ERROR_MESSAGES.connectionError);
                }
            }                
        }
    }
}
