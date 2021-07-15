import * as vscode from 'vscode';
import { ParamHintCompletionProvider, ReturnHintCompletionProvider, VariableCompletionProvider } from './completionProvider';
import { InferApiData, InferApiPayload, transformInferApiData } from "./type4pyData";
import { paramHintTrigger, returnHintTrigger, TypeSlots } from "./pythonData";
import { Type4PySettings } from './settings';
import typestore from './typestore';
import axios from 'axios';
import { INFER_REQUEST_TIMEOUT, INFER_URL_BASE, TELEMETRY_REQ_TIMEOUT, TELEMETRY_URL_BASE } from './constants';
import * as fs from 'fs';
import { ERROR_MESSAGES } from './messages';
import * as path from 'path';


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
    const inferCommand = vscode.commands.registerCommand('type4py.infer', async () => { infer(settings, context) });
    context.subscriptions.push(inferCommand);
    
    // Automatic type inference when opening a Python source file.
    vscode.workspace.onDidOpenTextDocument( async () => {
        //const a = context.workspaceState.get(vscode.window.activeTextEditor?.document.fileName!);
        if (settings.autoInfer) {
            if (context.workspaceState.get(vscode.window.activeTextEditor?.document.fileName!) === undefined) {
                    infer(settings, context, true)
                }
            }
         });
    
    // Sharing accepted type predictions based on the user's consent
    const comm = vscode.commands.registerCommand('submitAcceptedType', (acceptedType: string, rank: number,
        typeSlot: TypeSlots, identifierName: string, typeSlotLineNo: number) => {
       console.log(`Selected ${acceptedType} for ${typeSlot} with ${rank}`);
       if (settings.shareAcceptedPredsEnabled) {
            const f = vscode.window.activeTextEditor?.document.fileName!;
            const telemResult = axios.get(TELEMETRY_URL_BASE,
                {timeout: TELEMETRY_REQ_TIMEOUT , params: {
                    at: acceptedType,
                    r: rank,
                    ts: typeSlot,
                    fp: settings.fliterPredsEnabled ? 1 : 0,
                    idn: identifierName,
                    tsl: typeSlotLineNo,
                    sid: context.workspaceState.get(path.parse(vscode.workspace.asRelativePath(f)).base) 
                    }}
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
            const relativePath = path.parse(vscode.workspace.asRelativePath(activeDocument.fileName)).base;
            vscode.window.showInformationMessage(`Inferring type annotations for the file ${relativePath}`);

            // Read file contents
            const currentPath = activeDocument.fileName;
            const fileContents = fs.readFileSync(currentPath);

            // Send request
            //console.log(`Sending request with TC: ${settings.tcEnabled}`);
            console.log(`Sending request with FP: ${settings.fliterPredsEnabled}`)
            const inferResult = await axios.post<InferApiPayload>(INFER_URL_BASE, fileContents,
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
                // Transform & cache API data
                const inferResultData: InferApiData = inferResult.data.response;
                const transformedInferResultData = transformInferApiData(inferResultData);
                console.log(transformedInferResultData);
                typestore.add(currentPath, transformedInferResultData);
                
                vscode.window.showInformationMessage(
                    `Type prediction for ${relativePath} completed!`
                );

                context.workspaceState.update(relativePath,
                                              inferResult.data.response['session_id'])
                context.workspaceState.update(activeDocument.fileName, true);

            }
        } catch (error) {
            console.error(error);

            if (error.message) {
                vscode.window.showErrorMessage(error.message);
            }                
        }
    }
}
