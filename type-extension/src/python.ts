
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

/** TYPE4PY API DATA TYPES */

/** Common datatypes */

/**
 * Type definition for parameter predection.
 * The first element is the type qualifier, the second is the confidence (float in [0, 1])
*/
export type InferApiParamPrediction = [string, number];

/**
 * Type for list of Infer API parameter predections.
 */
export type InferApiParamPredictionList = Array<InferApiParamPrediction>;

/**
 * Interface to represent an Object. Keys are parameter IDs and values are
 * **ordered** lists of predictions.
 */
export interface InferApiParamPredictionMapping {
    [key: string]: InferApiParamPredictionList
}

/** Composable interfaces */

export interface WithInferFunctions {
    funcs: Array<InferApiFunction>
}

export interface WithInferVariables {
    variables_p: InferApiParamPredictionMapping,
    variables: { [key: string]: string },
}

/** Type4Py response elements */

export interface InferApiFunction extends WithInferVariables {
    name: string,
    fn_lc: Array<Array<number>>,
    params: { [key: string]: string },
    params_p: InferApiParamPredictionMapping,
    ret_type_p: InferApiParamPredictionList,
}

export interface InferApiClass extends WithInferFunctions, WithInferVariables {
    name: string,
}

export interface InferApiResponse extends WithInferFunctions, WithInferVariables {
    classes: Array<InferApiClass>
}

/** TYPE SUGGESTION EXTENSION DATA TYPES */

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

    // TODO: variables
}

export interface InferData {
    functions: Array<FunctionInferData>
    // TODO: variables
    // TODO: classes
}

/**
 * Transforms a Type4Py infer API response to an extension-friendly
 * InferData object.
 * 
 * TODO: does not yet support variables or classes!
 * 
 * @param apiData response to transform
 * @returns Transformed InferData object
 */
export function transformInferApiData(apiData: InferApiResponse): InferData {
    const functionInferData: Array<FunctionInferData> = [];

    for (const func of apiData.funcs) {
        // Assume: already sorted by value. Extract keys
        const returnTypes = func.ret_type_p.map(retParam => {
            return retParam[0];
        });
        
        const paramTypes: { [key: string]: Array<string> } = {};

        for (const param of Object.keys(func.params_p)) {
            paramTypes[param] = func.params_p[param].map(annotation => {
                return annotation[0];
            });
        }

        const funcEntry: FunctionInferData = {
            lines: [func.fn_lc[0][0], func.fn_lc[1][0]],
            returnTypes: returnTypes,
            params: paramTypes
        };

        functionInferData.push(funcEntry);
    }

    return {
        functions: functionInferData
    };
}