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

    // test("provides items for first param", async () => {
    //     let param = "param_1:";
    //     let actual = await providerResult(provider, param);
    //     assert.notStrictEqual(actual, null);
    // });

    // test("provides items for non-first param", async () => {
    //     let param = "first: str, paramName:";
    //     let actual = await providerResult(provider, param, "\n\nparamName = 12");
    //     assert.notStrictEqual(actual, null);
    //     assert.strictEqual(actual?.items[0].label.toString(), PythonType.Int);
    // });

    // test("provides items for param on new line", async () => {
    //     let param = "\n    paramName:";
    //     let actual = await providerResult(provider, param);
    //     assert.notStrictEqual(actual, null);

    //     param = "\n\tparamName:";
    //     actual = await providerResult(provider, param);
    //     assert.notStrictEqual(actual, null);
    // });
    
    // test("provides items for param with legal non-ascii chars", async () => {
    //     let param = "a変な:";
    //     let actual = await providerResult(provider, param);
    //     assert.notStrictEqual(actual, null);
    // });

    // test("provides items for nestled function", async () => {
    //     let data = `):
    // x = 1
    // def nestled(multiple_lines,
    //             paramName:`;
    //     let actual = await providerResult(provider, data);
    //     assert.notStrictEqual(actual, null);
    // });

    // test("provides items for async function", async () => {
    //     let data = "async def func(test:";
    //     let pos = new vsc.Position(0, data.length);
    //     let expected = null;
    //     let actual = await provideCompletionItems(provider, data, pos);
    //     assert.notStrictEqual(actual, null, messageFor(data, expected, actual));

    //     let line2 = "        test:";
    //     data = "async def func(\n" + line2;
    //     pos = new vsc.Position(1, line2.length);
    //     actual = await provideCompletionItems(provider, data, pos);
    //     assert.notStrictEqual(actual, null, messageFor(data, expected, actual));
    // });
    
    // test("provides default items if nothing is detected", async () => {
    //     let param = "notFound:";
    //     let expected = typeHints().concat(typingHints());
    //     let result = await providerResult(provider, param);
        
    //     assert.notStrictEqual(result, null);
    //     const actual: string[] | undefined = result?.items.map(item => item.label.toString());
    //     assert.deepStrictEqual(actual, expected);
    // });

    // test("provides type estimations + default items", async () => {
    //     let param = "param:";
    //     let expected = ["Class"].concat(typeHints()).concat(typingHints());

    //     let result = await providerResult(provider, param, "\n\nparam = Class()");

    //     assert.notStrictEqual(result, null);
    //     const actual: string[] | undefined = result?.items.map(item => item.label.toString());
    //     assert.deepStrictEqual(actual, expected);
    // });
    
    // test("does not provide items unless a function def is detected", async () => {
    //     let text = " :";
    //     let pos = new vsc.Position(0, text.length);
    //     let actual = await provideCompletionItems(provider, text, pos);
    //     assert.strictEqual(actual, null);
    // });

    // test("does not provide items for ':' without a param (within function brackets)", async () => {
    //     let actual = await providerResult(provider, "param, :");
    //     assert.strictEqual(actual, null);
    // });

    // test("does not provide items for ':' under a function def", async () => {
    //     let data = "):\n    d = ', not_a_param:";
    //     let expected = null;
    //     let actual = await providerResult(provider, data);
    //     assert.strictEqual(actual, expected, messageFor(data, expected, actual));
        
    //     data = "):\n    :";
    //     actual = await providerResult(provider, data);
    //     assert.strictEqual(actual, expected, messageFor(data, expected, actual));

    //     data = "):\n d = { key:";
    //     actual = await providerResult(provider, data);
    //     assert.strictEqual(actual, null, messageFor(data, expected, actual));

    //     data = `self,
    //     s: str,
    //     f: float,
    //     i: int):
    // v = ', not_a_param:`;
    //     actual = await providerResult(provider, data);
    //     assert.strictEqual(actual, null, messageFor(data, expected, actual));

    //     data = `self,
    //     s: str,
    //     f: float,
    //     i: int) -> int:
    // v = ', not_a_param:`;
    //     actual = await providerResult(provider, data);
    //     assert.strictEqual(actual, null, messageFor(data, expected, actual));

    //     data = `self,
    //     s: str,
    //     f: float,
    //     i: int) -> 変な:
    // v = ', not_a_param:`;
    //     actual = await providerResult(provider, data);
    //     assert.strictEqual(actual, null, messageFor(data, expected, actual));
    // });

    // test("does not provide items for end of function definition", async () => {
    //     let actual = await providerResult(provider, "):");
    //     assert.strictEqual(actual, null);
    // });

    // test("does not include * in parameter name", async () => {
    //     let param = "*paramName:";
    //     let actual = await providerResult(provider, param, "\n\nparamName = 12");
    //     assert.strictEqual(actual?.items[0].label.toString(), PythonType.Int);
    // });

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