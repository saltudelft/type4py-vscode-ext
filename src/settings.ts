import { workspace, Event, EventEmitter } from "vscode";

/**
 * Container of user settings.
 */
export class Type4PySettings {

    private _tcEnabled = false;
    private _filterPreds = true;

    constructor() {
        workspace.onDidChangeConfiguration(() => {
            this.initialize();
            this.settingsUpdated.fire();
        });
        this.initialize();
    }

    public get tcEnabled() {
        return this._tcEnabled;
    }

    public get fliterPredsEnabled() {
        return this._filterPreds;
    }
    
    public readonly settingsUpdated = new EventEmitter<void>();

    public get onDidChangeConfiguration(): Event<void> {
        return this.settingsUpdated.event;
    }

    private initialize() {
        const tcEnable: boolean | undefined = workspace.getConfiguration('workspace').get('typeCheckEnabled');
        const filterPreds: boolean | undefined = workspace.getConfiguration('workspace').get('filterPredictionsEnabled');

        if (tcEnable !== undefined) {
            this._tcEnabled = tcEnable;
        }

        if (filterPreds !== undefined) {
            this._filterPreds = filterPreds;
        }
    }

}