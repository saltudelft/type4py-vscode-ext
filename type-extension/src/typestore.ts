import { FunctionInferData, InferData } from "./python";

/**
 * Data container to allow inserting and fetching type data.
 * The container maps filepaths to their associated annotation data.
 */
class TypeStore {
    /** Data map: filepath -> inference data */
    private dataMap: Map<string, InferData>

    constructor() {
        this.dataMap = new Map();
    }

    /**
     * Adds data entry (synchronously)
     * @param key Key of filepath
     * @param value Function inference data
     */
    add(key: string, value: InferData): void {
        this.dataMap.set(key, value);
    }

    /**
     * Fetches data entry. Returns undefined if the key does not exist.
     * @param key Key of filepath
     * @returns Value mapped by filepath
     */
    get(key: string): InferData | undefined {
        return this.dataMap.get(key);
    }
}

// Export singleton data store
const typeDataStore = new TypeStore()
export default typeDataStore