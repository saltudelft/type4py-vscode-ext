import { workspace, Event, EventEmitter } from "vscode";

/**
 * Container of user settings.
 */
export class Type4PySettings {

    //private _tcEnabled = false;
    private _filterPreds = true;
    private _shareAcceptedPreds = false;
    private _autoInfer = false;
    private _useLocalModel = false;

    constructor() {
        workspace.onDidChangeConfiguration(() => {
            this.initialize();
            this.settingsUpdated.fire();
        });
        this.initialize();
    }

    // public get tcEnabled() {
    //     return this._tcEnabled;
    // }

    public get fliterPredsEnabled() {
        return this._filterPreds;
    }

    public get shareAcceptedPredsEnabled() {
        return this._shareAcceptedPreds;
    }
    public get autoInfer() {
        return this._autoInfer;
    }

    public get useLocalModel() {
        return this._useLocalModel;
    }

    public set setShareAcceptedPreds(value: boolean) {
        this._shareAcceptedPreds = value;
    }
    
    public readonly settingsUpdated = new EventEmitter<void>();

    public get onDidChangeConfiguration(): Event<void> {
        return this.settingsUpdated.event;
    }

    private initialize() {
        //const tcEnable: boolean | undefined = workspace
        //.getConfiguration('workspace').get('typeCheckEnabled');
        const filterPreds: boolean | undefined = workspace
            .getConfiguration('workspace').get('filterPredictionsEnabled');
        const shareAcceptPreds: boolean | undefined = workspace
            .getConfiguration('workspace').get('shareAcceptedPredictions');
        const autoInfer: boolean | undefined = workspace
            .getConfiguration('workspace').get('autoInferEnabled');
        const useLocalModel: boolean | undefined = workspace
            .getConfiguration('workspace').get('localModelEnabled');
        
        // if (tcEnable !== undefined) {
        //     this._tcEnabled = tcEnable;
        // }

        if (filterPreds !== undefined) {
            this._filterPreds = filterPreds;
        }

        if (shareAcceptPreds !== undefined) {
            this._shareAcceptedPreds = shareAcceptPreds;
        }

        if (autoInfer !== undefined) {
            this._autoInfer = autoInfer;
        }

        if (useLocalModel !== undefined) {
            this._useLocalModel = useLocalModel;
        }
    }
}