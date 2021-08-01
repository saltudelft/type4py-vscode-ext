import * as assert from 'assert';
import * as vsc from 'vscode';
import { paramHintTrigger, PythonType, returnHintTrigger } from "../../src/pythonData";
import { CompletionProvider, ParamHintCompletionProvider, ReturnHintCompletionProvider, VariableCompletionProvider } from "../../src/completionProvider";
import { messageFor } from '../common';
import * as inferData from '../res/sample-expected.json';
import { InferData } from '../../src/type4pyData';
import typestore from "../../src/typestore";
import * as fs from 'fs';
import * as path from 'path';

suite('ParamHintCompletionProvider', () => {
    const paramProvider = new ParamHintCompletionProvider(null);
    const returnProvider = new ReturnHintCompletionProvider(null);
    const varProvider = new VariableCompletionProvider(null);
    const data: InferData = JSON.parse(JSON.stringify(inferData));
    const sourceFile: string = fs.readFileSync(
        /**
         * NOTE: Because tsconfig does not handle moving non TS files to 'out',
         * we must copy the Python resources manually via additional package.json scripts.
         * This line of code relies on the script being present outside of the folder
         * in a 'res' folder.
        */
        path.resolve(__dirname, path.join("..", "res", "various_cases.py"))
    ).toString();

    test("Return type no data", async () => {
        const newSourceFile = sourceFile + "\ndef newFoo(x):\n    pass";
        const pos = new vsc.Position(14, 13); // line 15, col 15
        const providerResult = await provideCompletionItems(
            returnProvider,
            newSourceFile,
            pos,
            returnHintTrigger,
            data
        );

        assert.deepStrictEqual(providerResult!.items, []);
    });

    test("Provide return type hints", async () => {
        const pos = new vsc.Position(9, 13); // line 10, col 14
        const providerResult = await provideCompletionItems(
            returnProvider,
            sourceFile,
            pos,
            returnHintTrigger,
            data
        );

        const typeHints = providerResult!.items.map((value) => {
            return value.label.toString().trim();
        });

        assert.deepStrictEqual(typeHints, ["List[int]", "List[str]"]);
    });

    test("Param type no data", async () => {
        const newSourceFile = sourceFile + "\ndef newFoo(x):\n    pass";
        const pos = new vsc.Position(14, 13); // line 15, col 14
        const providerResult = await provideCompletionItems(
            paramProvider,
            newSourceFile,
            pos,
            paramHintTrigger,
            data
        );

        assert.deepStrictEqual(providerResult!.items, []);
    });

    test("Provide param type hints", async () => {
        const pos = new vsc.Position(9, 10); // line 10, col 11
        const providerResult = await provideCompletionItems(
            paramProvider,
            sourceFile,
            pos,
            paramHintTrigger,
            data
        );

        const typeHints = providerResult!.items.map((value) => {
            return value.label.toString().trim();
        });

        assert.deepStrictEqual(typeHints, ["int"]);
    });

    test("Variable type no data", async () => {
        const newSourceFile = sourceFile + "\nzxc = 10";
        const pos = new vsc.Position(14, 4); // line 15, col 5
        const providerResult = await provideCompletionItems(
            varProvider,
            newSourceFile,
            pos,
            paramHintTrigger,
            data
        );

        assert.deepStrictEqual(providerResult!.items, []);
    });

    test("Provide variable hints", async () => {
        const pos = new vsc.Position(13, 2); // line 14, col 3
        const providerResult = await provideCompletionItems(
            varProvider,
            sourceFile,
            pos,
            paramHintTrigger,
            data
        );

        const typeHints = providerResult!.items.map((value) => {
            return value.label.toString().trim();
        });

        assert.deepStrictEqual(typeHints, ["str", "int"]);
    });

    test("Provide function-level variable hints", async () => {
        const pos = new vsc.Position(10, 6); // line 11, col 7
        const providerResult = await provideCompletionItems(
            varProvider,
            sourceFile,
            pos,
            paramHintTrigger,
            data
        );

        const typeHints = providerResult!.items.map((value) => {
            return value.label.toString().trim();
        });

        assert.deepStrictEqual(typeHints, ["str", "List[str]", "List[int]", "List[bytes]", "int"]);
    });

    test("Provide class-level param hints", async () => {
        const pos = new vsc.Position(3, 25); // line 4, col 26
        const providerResult = await provideCompletionItems(
            paramProvider,
            sourceFile,
            pos,
            paramHintTrigger,
            data
        );

        const typeHints = providerResult!.items.map((value) => {
            return value.label.toString().trim();
        });

        assert.deepStrictEqual(typeHints, ["int", "bool", "float"]);
    });

    test("Provide class-level return hints", async () => {
        const pos = new vsc.Position(6, 20); // line 7, col 21
        const providerResult = await provideCompletionItems(
            returnProvider,
            sourceFile,
            pos,
            returnHintTrigger,
            data
        );

        const typeHints = providerResult!.items.map((value) => {
            return value.label.toString().trim();
        });

        assert.deepStrictEqual(typeHints, ["int", "Optional[str]"]);
    });

    test("Provide class-level variable hints", async () => {
        const pos = new vsc.Position(1, 6); // line 2, col 7
        const providerResult = await provideCompletionItems(
            varProvider,
            sourceFile,
            pos,
            paramHintTrigger,
            data
        );

        const typeHints = providerResult!.items.map((value) => {
            return value.label.toString().trim();
        });

        assert.deepStrictEqual(typeHints, ["str"]);
    });

    test("Provide class-level function-level variable hints", async () => {
        const pos = new vsc.Position(4, 15); // line 5, col 16
        const providerResult = await provideCompletionItems(
            varProvider,
            sourceFile,
            pos,
            paramHintTrigger,
            data
        );

        const typeHints = providerResult!.items.map((value) => {
            return value.label.toString().trim();
        });

        assert.deepStrictEqual(typeHints, ["str", "Dict[str, Any]", "dict", "int"]);
    });

});

const language = "python";

async function provideCompletionItems(
    provider: CompletionProvider, 
    documentContent: string,
    pos: vsc.Position,
    triggerCharacter: string,
    typeData: InferData
): Promise<vsc.CompletionList | null> {
    const doc = await vsc.workspace.openTextDocument({ language, content: documentContent });
    const editor = await vsc.window.showTextDocument(doc, { preview: false, viewColumn: 0 });

    // On return hint provider: type out -> to trigger completion items, and shift the position
    if (provider instanceof ReturnHintCompletionProvider) {
        await editor.edit((e) => {
            e.insert(pos, "->");
        });
        pos = new vsc.Position(pos.line,pos.character+2);
    };

    typestore.add(doc.fileName, typeData);
    const token = new vsc.CancellationTokenSource().token;
    const ctx = {
        triggerCharacter: triggerCharacter,
        triggerKind: vsc.CompletionTriggerKind.TriggerCharacter
    };

    return provider.provideCompletionItems(doc, pos, token, ctx);
}

// async function providerResult(
//     provider: CompletionProvider,
//     functionText: string,
//     triggerCharacter: string,
//     trailingText?: string
// ): Promise<vsc.CompletionList | null> {
//     let content = `    def func(${functionText}`;
//     const lines: string[] = content.split("\n");
//     const lastLineIdx = lines.length - 1;
//     const lastPos = new vsc.Position(lastLineIdx, lines[lastLineIdx].length);

//     if (trailingText) {
//         content += trailingText;
//     }

//     const doc = await vsc.workspace.openTextDocument({ language, content });
//     const token = new vsc.CancellationTokenSource().token;
//     const ctx = {
//         triggerCharacter: triggerCharacter,
//         triggerKind: vsc.CompletionTriggerKind.TriggerCharacter
//     };

//     return provider.provideCompletionItems(doc, lastPos, token, ctx);
// }

// const typeHints = (): string[] => Object.values(PythonType).sort();

// const typingHints = (): string[] => {
//     const prefix = "typing.";
//     return [
//         `Dict[`,
//         `List[`,
//         `Set[`,
//         `Tuple[`,
//         `${prefix}Dict[`,
//         `${prefix}List[`,
//         `${prefix}Set[`,
//         `${prefix}Tuple[`
//     ];
// };