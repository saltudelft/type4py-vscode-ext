
export const moduleName: string = "[a-zA-Z_][a-zA-Z0-9_.]*";

export const paramHintTrigger: string = ":";
export const returnHintTrigger: string = ">";

/**
 * A built-in Python type.
 */
export class DataType {
    name: PythonType;
    category: TypeCategory;

    constructor(name: PythonType, category: TypeCategory) {
        this.name = name;
        this.category = category;
    }
}

/**
 * Container with type name keys and data type values.
 */
export interface DataTypeContainer {
     [key: string]: DataType 
};

export const getDataTypeContainer = (): DataTypeContainer => {
    return {
        bool: new DataType(PythonType.Bool, typeCategories.bool),
        bytes: new DataType(PythonType.Bytes, typeCategories.bytes),
        complex: new DataType(PythonType.Complex, typeCategories.complex),
        dict: new DataType(PythonType.Dict, typeCategories.dict),
        float: new DataType(PythonType.Float, typeCategories.float),
        int: new DataType(PythonType.Int, typeCategories.int),
        list: new DataType(PythonType.List, typeCategories.list),
        object: new DataType(PythonType.Object, typeCategories.object),
        set: new DataType(PythonType.Set, typeCategories.set),
        str: new DataType(PythonType.String, typeCategories.string),
        tuple: new DataType(PythonType.Tuple, typeCategories.tuple)
    };
};

/**
 * Names of built-in Python types.
 */
export enum PythonType {
    Bool = "bool",
    Bytes = "bytes",
    Complex = "complex",
    Dict = "dict",
    Float = "float",
    Int = "int",
    List = "list",
    Object = "object",
    Set = "set",
    String = "str",
    Tuple = "tuple",
}

/**
 * Categories of Python types.
 */
export enum TypeCategory {
    Abstract,
    Basic,
    Collection
}

/**
 * Built-in Python type keys with Type category values. 
 */
const typeCategories: { [key: string]: TypeCategory } = {
    bool: TypeCategory.Basic,
    bytes: TypeCategory.Basic,
    complex: TypeCategory.Basic,
    dict: TypeCategory.Collection,
    float: TypeCategory.Basic,
    int: TypeCategory.Basic,
    list: TypeCategory.Collection,
    object: TypeCategory.Abstract,
    set: TypeCategory.Collection,
    string: TypeCategory.Basic,
    tuple: TypeCategory.Collection
};

/** API DATA TYPES */

export interface InferApiData {
    funcs: Array<InferApiFunction>
    // TODO: classes
    // TODO: variables?
}

export type InferApiParamData = [string, number]

export interface InferApiFunction {
    fn_lc: Array<Array<number>>,
    name: string,
    params: { [key: string]: string }
    params_p: {
        [key: string]: Array<InferApiParamData>
    },
    ret_type_p: Array<InferApiParamData>
    // TODO: variables
}

/** EXTENSION DATA TYPES */

/**
 * Data type for function inference data.
 */
 export interface FunctionInferData {
    /** Tuple: first & last line of function */
    lines: [number, number]

    /** Ordered array of return type annotations */
    returnTypes: Array<string>

    /** Parameter mapping: parameter -> annotations */
    params: {
        /** Ordered array of parameter type annotations */
        [key: string]: Array<string>
    }
}

export interface InferData {
    functions: Array<FunctionInferData>
}

export function transformInferApiData(apiData: InferApiData): InferData {
    const functionInferData: Array<FunctionInferData> = []

    for (const func of apiData.funcs) {
        // Assume: already sorted by value. Extract keys
        const returnTypes = func.ret_type_p.map(retParam => {
            return retParam[0]
        })
        
        const paramTypes: { [key: string]: Array<string> } = {}

        for (const param of Object.keys(func.params_p)) {
            paramTypes[param] = func.params_p[param].map(annotation => {
                return annotation[0]
            })
        }

        const funcEntry: FunctionInferData = {
            lines: [func.fn_lc[0][0], func.fn_lc[1][0]],
            returnTypes: returnTypes,
            params: paramTypes
        }

        functionInferData.push(funcEntry);
    }

    return {
        functions: functionInferData
    }
}