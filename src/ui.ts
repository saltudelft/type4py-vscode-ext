/*
Defines UI elements for the Type4Py extension in VSCode such as status bar and output channel.
*/

import * as vscode from "vscode";

export class Type4PyOutputChannel {
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('Type4Py');
        //this.outputChannel.show();
        context.subscriptions.push(this.outputChannel);
    }

    public appendInProgress(fileName: string) {
        this.outputChannel.appendLine(`[${new Date().toLocaleString()}][${fileName}] Inferring types...`);
    }

    public appendCompleted(fileName: string) {
        this.outputChannel.appendLine(`[${new Date().toLocaleString()}][${fileName}] Type prediction completed!`);
    }

    public appendError(fileName: string, errorMsg: string) {
        this.outputChannel.appendLine(`[${new Date().toLocaleString()}][${fileName}] ${errorMsg}`);
    }

    public show() {
        this.outputChannel.show();
    }
}

export class Type4PyStatusBar {

    private statusBar: vscode.StatusBarItem;
    private inProgressRequests: number = 0;
    private completedRequests: number = 0;
    private statusBarText: string;

    constructor(context: vscode.ExtensionContext, outputChannel: Type4PyOutputChannel) {
        this.statusBarText = this.getUpdatedStatusBar();
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBar.text = this.statusBarText;
        this.statusBar.tooltip = "Click to see the extension's logs";
        this.statusBar.show();
        context.subscriptions.push(this.statusBar);

        vscode.commands.registerCommand('showOutputChannel', async () => {outputChannel.show()});
        this.statusBar.command = 'showOutputChannel';
    }

    private getUpdatedStatusBar(): string {
        this.statusBarText = `Type4Py: $(loading) In-progress: ${this.inProgressRequests} | $(testing-passed-icon) Completed: ${this.completedRequests}`;
        return this.statusBarText;
    }

    public updateInProgress() {
        this.inProgressRequests += 1;
        this.statusBar.text = this.getUpdatedStatusBar();
        this.statusBar.show();
    }

    public updateCompleted() {
        this.inProgressRequests -= 1;
        this.completedRequests += 1;
        this.statusBar.text = this.getUpdatedStatusBar();
        this.statusBar.show();
    }

    public updateInProgressWithErrors() {
        this.inProgressRequests -= 1;
        this.statusBar.text = this.getUpdatedStatusBar()
        this.statusBar.show();
    }
}