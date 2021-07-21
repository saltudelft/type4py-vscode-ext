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
    Command,
    ExtensionContext,
    commands
} from "vscode";
import { FunctionInferData, VariableInferData  } from "./type4pyData";
import { paramHintTrigger, returnHintTrigger } from './pythonData';
import typestore from './typestore';
import { isWithinLineBounds } from "./utils";
import { TypeSlots } from "./pythonData";


export abstract class CompletionProvider {

    protected vscContext: ExtensionContext | null;
    // Prevents several submission of the same prediction.
    protected resolvedCompletion: boolean = false;

    constructor(context: ExtensionContext | null=null) {
        this.vscContext = context;
    }

    protected labelFor(typeHint: string): string {
        return " " + typeHint;
    }

    protected submitCanceledPrediction(currTypeSelection: TypeCompletionItem) {
        if (this.vscContext!.workspaceState.get("lastTypePrediction") === null) {
            this.vscContext!.workspaceState.update("lastTypePrediction", currTypeSelection);
        } else {
            commands.executeCommand("submitAcceptedType",
                                    this.vscContext!.workspaceState.get("lastTypePrediction")).then(undefined, err => {
                                        console.error("Couldn't submit the accepted/rejected type!");
                                    });
            this.vscContext!.workspaceState.update("lastTypePrediction", currTypeSelection);
        }
    }

    abstract provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null>;
}

export class TypeCompletionItem extends CompletionItem {

    public typeSlot: TypeSlots;
    public rank: number;
    public identifierName: string; // Can be name of a variable, a parameter, or a function.
    public typeSlotLineNo: number;

    constructor(label: string, kind: CompletionItemKind, typeSlot: TypeSlots,
                rank: number, identifierName: string, typeSlotLineNo: number) {
        super(label, kind);
        this.typeSlot = typeSlot;
        this.rank = rank;
        this.identifierName = identifierName;
        this.typeSlotLineNo = typeSlotLineNo;
    }
}

/**
 * Provides one or more parameter type hint {@link CompletionItem}.
 */
export class ParamHintCompletionProvider extends CompletionProvider implements CompletionItemProvider {

    private paramName: string = "";
    private paramLineNo: number = -1;

    public async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null> {
        // Check if triggered with the correct parameter annotation character
        if (context.triggerCharacter !== paramHintTrigger) {
            return null;
        }

        const items: TypeCompletionItem[] = [];
        const line = doc.lineAt(pos);
        const precedingText = line.text.substring(0, pos.character - 1).trim();

        // Check if pattern matches parameters
        if (this.shouldProvideItems(precedingText, pos, doc) && !token.isCancellationRequested) {
            // Extract parameter
            const param = this.getParam(precedingText);
            if (param && !token.isCancellationRequested) {
                const inferData = findFunctionInferenceDataForActiveFilePos(pos);
                this.resolvedCompletion = false;
                
                if (inferData !== undefined) {
                    this.paramName = param;
                    this.paramLineNo = line.lineNumber + 1;
                }
                
                // Map parameter data to completion items (if present)
                inferData?.params[param].forEach((annotation, id) => {
                    items.push(annotationToCompletionItem(new TypeCompletionItem(annotation,
                         CompletionItemKind.TypeParameter, TypeSlots.Parameter, id, param,
                                                          line.lineNumber + 1)));
                });
            }
        }

        return Promise.resolve(new CompletionList(items, false));  
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

    public async resolveCompletionItem(item: CompletionItem, token: CancellationToken) {
        var currTypeSelection = new TypeCompletionItem("", CompletionItemKind.TypeParameter, TypeSlots.Parameter,
                                                       -1, this.paramName, this.paramLineNo);
        if (this.resolvedCompletion === false) {
            this.submitCanceledPrediction(currTypeSelection);
            this.resolvedCompletion = true;
        }
        return null;
    }
}

/**
 * Provides one or more return type hint {@link CompletionItem}.
 */
export class ReturnHintCompletionProvider extends CompletionProvider implements CompletionItemProvider {

    private functionName: string = "";
    private functionLineNo: number = -1;

    public async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null> {
        // Check if triggered with the correct return type annotation character
        if (context.triggerCharacter !== returnHintTrigger) {
            return null;
        }
        const items: CompletionItem[] = [];
        const line = doc.lineAt(pos);

        if (this.shouldProvideItems(line, pos)) {
            const inferData = findFunctionInferenceDataForActiveFilePos(pos);
            this.resolvedCompletion = false;

            if (inferData !== undefined) {
                this.functionName = inferData!.name;
                this.functionLineNo = line.lineNumber + 1;
            }
            
            // Map return type data to completion items (if present)
            inferData?.returnTypes.forEach((annotation, id) => {
                items.push(annotationToCompletionItem(new TypeCompletionItem(annotation,
                     CompletionItemKind.TypeParameter, TypeSlots.ReturnType, id, this.functionName,
                                                      this.functionLineNo)));
            });
        }
        return Promise.resolve(new CompletionList(items, false));
    }

    private shouldProvideItems(line: TextLine, pos: Position): boolean {

        if (pos.character > 0 && line.text.substr(pos.character - 2, 2) === "->") {
            return /\) *->[: ]*$/m.test(line.text);
        }
        return false;
    }

    public async resolveCompletionItem(item: CompletionItem, token: CancellationToken) {
        var currTypeSelection = new TypeCompletionItem("", CompletionItemKind.TypeParameter, TypeSlots.ReturnType,
                                                       -1, this.functionName, this.functionLineNo);
        if (this.resolvedCompletion === false) {
            this.submitCanceledPrediction(currTypeSelection);
            this.resolvedCompletion = true;
        }
        return null;
    }
}

/**
 * Provides one or more variable type hint {@link CompletionItem}.
 */
 export class VariableCompletionProvider extends CompletionProvider implements CompletionItemProvider {

    private variableName: string = "";
    private variableLineNo: number = -1;

    public async provideCompletionItems(
        doc: TextDocument, 
        pos: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionList | null> {
        // Check if triggered with the correct variable annotation character (same as param)
        if (context.triggerCharacter !== paramHintTrigger) {
            return null;
        }

        const items: TypeCompletionItem[] = [];
        const line = doc.lineAt(pos);

        if (this.shouldProvideItems(line, pos)) {
            const inferData = findVariableInferenceDataForActiveFilePos(line);
            this.resolvedCompletion = false;

            if (inferData !== undefined) {
                this.variableName = inferData!.name;
                this.variableLineNo = line.lineNumber + 1;
            }
            // Map variable data to completion items (if present)
            inferData?.annotations.forEach((annotation, id) => {
                items.push(annotationToCompletionItem(new TypeCompletionItem(annotation, CompletionItemKind.TypeParameter,
                                                      TypeSlots.Variable, id, this.variableName, this.variableLineNo)));
            });
        }
        return Promise.resolve(new CompletionList(items, false));
    }

    private shouldProvideItems(line: TextLine, pos: Position): boolean {
        // TODO: should this support multi-line?
        const lineRemainder = line.text.substr(pos.character - 1);

        // Test for '<space>:<space>=' pattern
        return pos.character > 0 && /(\s)*:(\s)*=/.test(lineRemainder);
    }

    public async resolveCompletionItem(item: CompletionItem, token: CancellationToken) {
        console.log("Resolved Completion items!");
        var currTypeSelection = new TypeCompletionItem("", CompletionItemKind.TypeParameter, TypeSlots.Variable,
                                                       -1, this.variableName, this.variableLineNo);
        if (this.resolvedCompletion === false) {
            this.submitCanceledPrediction(currTypeSelection);
            this.resolvedCompletion = true;
        }
        return null;
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

    return undefined;
}

/**
 * Finds variable inference data for the specified position
 * in the currently active file.
 * 
 * Returns undefined if such data could not be found.
 * 
 * @param line Line to query variable annotation data for
 * @returns Variable inference data or undefined
 */
function findVariableInferenceDataForActiveFilePos(line: TextLine): VariableInferData | undefined {
    const activePath = window.activeTextEditor?.document.fileName;

    if (activePath) {
        // TODO: should support multi-line?
        // TODO: can this be refactored to share similar
        //       interface to 'findFunctionInferenceDataForActiveFilePos'?

        // Extract variable: <space>[var]<space>=<...>
        const splitData = line.text.split("=");

        if (splitData.length > 0) {
            const variableName = splitData[0].replace(":", "").replace("self.", "").trim();
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

export class AcceptedTypeCompletionItem implements Command {

    // rank: number;
    // selectedType: string;
    // typeSlot: TypeSlots;
    // identifierName: string; // Can be name of a variable, a parameter, or a function.
    // typeSlotLineNo: number;
    typeCompletionItem: TypeCompletionItem;

    title = "AcceptedTypeCompletionItem";
    command = 'submitAcceptedType';
    arguments: any[];

    constructor(typeCompletion: TypeCompletionItem) {
        this.typeCompletionItem = typeCompletion;
        this.typeCompletionItem.rank += 1;
        this.arguments = [this.typeCompletionItem];
    }
}

/**
 * Helper function to transform an annotation at the given ID (lower = more confidence)
 * to a CompletionItem to provide as autocomplete.
 * 
 * @param annotation Annotation (string)
 * @param id Index
 * @returns CompletionItem
 */
function annotationToCompletionItem(item: TypeCompletionItem): TypeCompletionItem {

    item.command = new AcceptedTypeCompletionItem(item);
    item.filterText = ` ${item.label}`; // Do not remove filter after adding single whitespace
    item.insertText = ` ${item.label}`; // Add whitespace after annotation
    item.sortText = `${item.rank}`;
    return item;
}
