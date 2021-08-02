// import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import * as chai from 'chai';
import * as spies from 'chai-spies';
import { ERROR_MESSAGES } from '../../src/messages';
import { beforeEach } from 'mocha';
import { Type4PyApi } from '../../src/extension';

chai.use(spies);

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    beforeEach(() => {
        chai.spy.restore();
        chai.spy.on(vscode.window, 'showErrorMessage');
    });

    test("Infer without open file", async () => {
        await vscode.commands.executeCommand("workbench.action.closeAllEditors");
        await vscode.commands.executeCommand("type4py.infer");
        chai.expect(vscode.window.showErrorMessage).to.have.been.called.with(ERROR_MESSAGES.noActiveFile);
    });

    test("Infer with empty file", async () => {
        const doc = await vscode.workspace.openTextDocument({ language: "python", content: ""});
        await vscode.window.showTextDocument(doc, { preview: false, viewColumn: 0 });
        await vscode.commands.executeCommand("type4py.infer");

        chai.expect(vscode.window.showErrorMessage).to.have.been.called.with(ERROR_MESSAGES.emptyFile);
    });

    test("Infer with non-Python file", async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: "typescript", content: "const x = 5;"
        });
        await vscode.window.showTextDocument(doc, { preview: false, viewColumn: 0 });
        await vscode.commands.executeCommand("type4py.infer");

        chai.expect(vscode.window.showErrorMessage).to.have.been.called.with(ERROR_MESSAGES.nonPythonFile);
    });

    test("Infer with Python file", async () => {
        // Open Python file
        const fpath = path.resolve(__dirname, path.join("..", "res", "various_cases.py"));
        const doc = await vscode.workspace.openTextDocument(fpath);
        await vscode.window.showTextDocument(doc, { preview: false, viewColumn: 0 });

        // Verify initially that inference data for the open document is unavailable
        const typestore = vscode.extensions.getExtension<Type4PyApi>("saltud.type4py")!
                            .exports.typestore;
        const activeDocument = vscode.window.activeTextEditor!.document.fileName;
        chai.expect(typestore.get(activeDocument)).to.be.undefined;

        // After inference, the data should now be available
        await vscode.commands.executeCommand("type4py.infer");
        chai.expect(typestore.get(activeDocument)).not.to.be.undefined;
    });

    // test("Infer with exception", async () => {
    //     // Open Python file
    //     const fpath = path.resolve(__dirname, path.join("..", "res", "various_cases.py"));
    //     const doc = await vscode.workspace.openTextDocument(fpath);
    //     await vscode.window.showTextDocument(doc, { preview: false, viewColumn: 0 });

    //     // Set request to throw error
    //     const errorMessage = "Failed due to error: 500";
    //     chai.spy.on(axios, 'post', () => {
    //         throw Error(errorMessage);
    //     });

    //     // Assert error message
    //     await vscode.commands.executeCommand("type4py.infer");
    //     chai.expect(vscode.window.showErrorMessage).to.have.been.called.with(errorMessage);
    // });

    // test("Infer with empty payload", async () => {
    //     // Open Python file
    //     const fpath = path.resolve(__dirname, path.join("..", "res", "various_cases.py"));
    //     const doc = await vscode.workspace.openTextDocument(fpath);
    //     await vscode.window.showTextDocument(doc, { preview: false, viewColumn: 0 });

    //     // Set request to return empty malformed response
    //     chai.spy.on(axios, 'post', async () => {
    //         return {
    //             data: {}
    //         };
    //     });

    //     await vscode.commands.executeCommand("type4py.infer");
    //     chai.expect(vscode.window.showErrorMessage).to.have.been.called.with(ERROR_MESSAGES.emptyPayload);
    // });

    // test("Infer with response error", async () => {
    //     // Open Python file
    //     const fpath = path.resolve(__dirname, path.join("..", "res", "various_cases.py"));
    //     const doc = await vscode.workspace.openTextDocument(fpath);
    //     await vscode.window.showTextDocument(doc, { preview: false, viewColumn: 0 });

    //     // Set request to return message with error
    //     const errorMessage = "Failed due to internal service error";
    //     chai.spy.on(axios, 'post', () => {
    //         return {
    //             data: {
    //                 error: errorMessage
    //             }
    //         };
    //     });

    //     await vscode.commands.executeCommand("type4py.infer");
    //     chai.expect(vscode.window.showErrorMessage).to.have.been.called.with(errorMessage);
    // });
});
