import { FunctionInferData } from "./python";

/**
 * Data container to allow inserting and fetching type data.
 * The container maps filepaths to their associated annotation data.
 */
class TypeStore {
    private dataMap: Map<string, Array<FunctionInferData>>

    constructor() {
        this.dataMap = new Map()
    }

    /**
     * Adds data entry (synchronously)
     * @param key Key of filepath
     * @param value Function inference data
     */
    add(key: string, value: Array<FunctionInferData>): void {
        this.dataMap.set(key, value)
    }

    /**
     * Fetches data entry. Returns undefined if the key does not exist.
     * @param key Key of filepath
     * @returns Value mapped by filepath
     */
    get(key: string): Array<FunctionInferData> | undefined {
        return this.dataMap.get(key)
    }
}

// Export singleton data store
const typeDataStore = new TypeStore()
export default typeDataStore