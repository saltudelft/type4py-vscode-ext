import {
    CancellationToken,
    CompletionContext,
    CompletionList,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    Position,
    TextLine,
    TextDocument,
    Range,
    window,
} from "vscode";
import { FunctionInferData, VariableInferData  } from "./type4pyData";
import { paramHintTrigger, returnHintTrigger } from './pythonData';
import typestore from './typestore';


export abstract class CompletionProvider {

    protected itemSortPrefix: number = 90;

    /**
     * Push type hints to the end of an array of completion items.
     */
    protected pushHintsToItems(typeHints: string[], completionItems: CompletionItem[], firstItemSelected: boolean) {
        const sortTextPrefix = this.itemSortPrefix.toString();
        completionItems.push(
            firstItemSelected 
                ? this.selectedCompletionItem(typeHints[0])
                : this.newCompletionitem(typeHints[0], sortTextPrefix)
        );

        for (let i = 1; i < typeHints.length; i++) {
            completionItems.push(this.newCompletionitem(typeHints[i], sortTextPrefix));
        }
    }

    private newCompletionitem = (hint: string, sortTextPrefix: string): CompletionItem => {
        const item = new CompletionItem(this.labelFor(hint), CompletionItemKind.TypeParameter);
        item.sortText = sortTextPrefix + hint;
        return item;
    };

    protected selectedCompletionItem(typeHint: string, sortTextPrefix: string = "0b"): CompletionItem {
        let item = new CompletionItem(this.labelFor(typeHint), CompletionItemKind.TypeParameter);
        item.sortText = `${sortTextPrefix}${typeHint}`;
        item.preselect = true;
        return item;
    }

    protected labelFor(typeHint: string): string {
        return " " + typeHint;
    }

    abstract async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null>;
}

/**
 * Provides one or more parameter type hint {@link CompletionItem}.
 */
export class ParamHintCompletionProvider extends CompletionProvider implements CompletionItemProvider {

    constructor() {
        super();
    }

    public async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null> {
        if (context.triggerCharacter === paramHintTrigger) {
            const items: CompletionItem[] = [];
            const line = doc.lineAt(pos);
            const precedingText = line.text.substring(0, pos.character - 1).trim();
            
            if (this.shouldProvideItems(precedingText, pos, doc) && !token.isCancellationRequested) {
                const param = this.getParam(precedingText);

                if (param && !token.isCancellationRequested) {
                    const inferData = findFunctionInferenceDataForActiveFilePos(pos)

                    if (inferData) {
                        const paramTypes = inferData.params[param];
                        if (paramTypes) {
                            for (let i = 0; i < paramTypes.length; ++i) {
                                const item = new CompletionItem(paramTypes[i], CompletionItemKind.TypeParameter);
                                item.sortText = `${i}`;
                                items.push(item);
                            }
                        }
                    }

                    return Promise.resolve(new CompletionList(items, false));  
                }
            }
        }
        return Promise.resolve(null);
    }

    /**
     * Returns the parameter which is about to be type hinted.
     * 
     * @param precedingText The text before the active position.
     */
    private getParam(precedingText: string): string | null {
        const split = precedingText.split(/[,(*]/);
        let param = split.length > 1 ? split[split.length - 1].trim() : precedingText;
        return !param || /[!:?/\\{}.+/=)'";@&£%¤|<>$^~¨ -]/.test(param) ? null : param;
    }
    
    private pushEstimationsToItems(typeHints: string[], items: CompletionItem[]) {

        if (typeHints.length > 0) {
            items.push(this.selectedCompletionItem(typeHints[0]));

            for (let i = 1; i < typeHints.length; i++) {
                let item = new CompletionItem(this.labelFor(typeHints[i]), CompletionItemKind.TypeParameter);
                item.sortText = `${i}${typeHints[i]}`;
                items.push(item);
            }       
        }
    }

    private shouldProvideItems(precedingText: string, activePos: Position, doc: TextDocument): boolean {

        if (activePos.character > 0 && !/#/.test(precedingText)) {
            let provide = /^[ \t]*(def |async *def )/.test(precedingText);

            if (!provide) {
                const nLinesToCheck = activePos.line > 4 ? 4 : activePos.line;
                const previousLines = doc.getText(
                    new Range(doc.lineAt(activePos.line - nLinesToCheck).range.start, activePos)
                );
                provide = new RegExp(`^[ \t]*(async *)?def(?![\\s\\S]+(\\):|-> *[^:\\s]+:))`, "m").test(previousLines);
            }
            return provide;
        }
        return false;
    }
}

/**
 * Provides one or more return type hint {@link CompletionItem}.
 */
export class ReturnHintCompletionProvider extends CompletionProvider implements CompletionItemProvider {

    public async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null> {
        if (context.triggerCharacter !== returnHintTrigger) {
            return null;
        }
        const items: CompletionItem[] = [];
        const line = doc.lineAt(pos);

        if (this.shouldProvideItems(line, pos)) {
            const inferData = findFunctionInferenceDataForActiveFilePos(pos);
            
            if (inferData) {
                for (let i = 0; i < inferData.returnTypes.length; ++i) {
                    const item = new CompletionItem(
                        inferData.returnTypes[i],
                        CompletionItemKind.TypeParameter
                    );
                    item.sortText = `${i}`;
                    items.push(item);
                }
            }
        }
        return Promise.resolve(new CompletionList(items, false));
    }

    private shouldProvideItems(line: TextLine, pos: Position): boolean {

        if (pos.character > 0 && line.text.substr(pos.character - 2, 2) === "->") {
            return /\) *->[: ]*$/m.test(line.text);
        }
        return false;
    }
}

/**
 * Provides one or more variable type hint {@link CompletionItem}.
 */
 export class VariableCompletionProvider extends CompletionProvider implements CompletionItemProvider {

    public async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null> {
        if (context.triggerCharacter !== paramHintTrigger) {
            return null;
        }

        const items: CompletionItem[] = [];
        const line = doc.lineAt(pos);

        if (this.shouldProvideItems(line, pos)) {
            // const inferData = findFunctionInferenceDataForActiveFilePos(pos);
            const inferData = findVariableInferenceDataForActiveFilePos(line);
            
            if (inferData) {
                for (let i = 0; i < inferData.annotations.length; ++i) {
                    const item = new CompletionItem(
                        inferData.annotations[i],
                        CompletionItemKind.TypeParameter
                    );
                    item.sortText = `${i}`;
                    items.push(item);
                }
            }
        }
        return Promise.resolve(new CompletionList(items, false));
    }

    private shouldProvideItems(line: TextLine, pos: Position): boolean {
        // TODO: should this support multi-line?
        const lineRemainder = line.text.substr(pos.character - 1);

        // Test for '<space>:<space>=' pattern
        return pos.character > 0 && /(\s)*:(\s)*=/.test(lineRemainder);
    }
}

/**
 * Finds function inference data for the specified position
 * in the currently active file.
 * 
 * Returns undefined if such data could not be found.
 * 
 * @param pos Position to query data for
 * @returns Function inference data or undefined
 */
function findFunctionInferenceDataForActiveFilePos(pos: Position): FunctionInferData | undefined {
    // Get active file being edited
    const activePath = window.activeTextEditor?.document.fileName;

    if (activePath) {
        // Query type store
        const annotationData = typestore.get(activePath);

        if (annotationData) {
            // Rebase to 1-index
            const lineNumber = pos.line + 1;

            // Find line
            for (const x of annotationData.functions) {
                if (isWithinLineBounds(lineNumber, x.lines)) {
                    return x;
                }
            }
        }
    }

    return undefined
}

function findVariableInferenceDataForActiveFilePos(line: TextLine): VariableInferData | undefined {
    const activePath = window.activeTextEditor?.document.fileName;

    if (activePath) {
        // TODO: should support multi-line?
        // TODO: can this be refactored to share similar
        //       interface to 'findFunctionInferenceDataForActiveFilePos'?

        // Extract variable: <space>[var]<space>=<...>
        const splitData = line.text.split("=");

        if (splitData.length > 0) {
            const variableName = splitData[0].replace(":", "").trim();
            const annotationData = typestore.get(activePath);

            if (annotationData) {
                for (const fileVar of annotationData.variables) {
                    const lineNumber = line.lineNumber + 1;

                    if (isWithinLineBounds(lineNumber, fileVar.lines) && fileVar.name == variableName) {
                        return fileVar;
                    }
                }
            }
        }
    }

    return undefined;
}

/**
 * Helper function to check if a target line number is (inclusively) within
 * the given bounds.
 * @param line Line number to check
 * @param bounds Bounds to check inclusion in
 * @returns True if line is in bounds
 */
function isWithinLineBounds(line: number, bounds: [number, number]) {
    return line >= bounds[0] && line <= bounds[1];
}
