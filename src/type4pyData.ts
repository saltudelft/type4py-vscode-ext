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

/**
 * Interface to represent a variable map to track line numbers (first and last)
 */
export type InferApiVarLocations = { [key: string]: Array<Array<number>> };

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
    ret_type_p?: InferApiParamPredictionList,
    fn_var_ln: InferApiVarLocations
}

export interface InferApiClass extends WithInferFunctions, WithInferVariables {
    name: string,
    cls_var_ln: InferApiVarLocations
}

export interface InferApiPayload {
    response?: InferApiData,
    error?: string
}

export interface InferApiData extends WithInferFunctions, WithInferVariables {
    classes: Array<InferApiClass>,
    mod_var_ln: InferApiVarLocations,
    session_id: string
}

/** TYPE SUGGESTION EXTENSION DATA TYPES */

/**
 * Data type for function inference data.
 */
 export interface FunctionInferData {
    /** Name of the function */
    name: string

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

/**
 * Data type for variable inference data.
 */
export interface VariableInferData {
    /** Tuple: first & last line of variable */
    lines: [number, number] 

    /** Name of the variable */
    name: string

    /** List of inferred type annotations (ordered) */
    annotations: Array<string>
}

/**
 * Data container holding inference data for a single file.
 */
export interface InferData {
    functions: Array<FunctionInferData>
    variables: Array<VariableInferData>
}

/**
 * API payload for Type4Py API
 */
export interface InferApiPayload {
    response?: InferApiData,
    error?: string
}


/**
 * Transforms a Type4Py infer API response to an extension-friendly
 * InferData object.
 * 
 * @param apiData response to transform
 * @returns Transformed InferData object
 */
export function transformInferApiData(apiData: InferApiData): InferData {
    const functionInferData: Array<FunctionInferData> = [];
    const variableInferData: Array<VariableInferData> = [];
    let funcs: InferApiFunction[] = apiData.funcs;

    // Extract module-level variables
    variableInferData.push(...extractVariableInferData(
        apiData.variables_p, 
        apiData.mod_var_ln
    ));

    // Merge class functions & variables
    for (const apiClass of apiData.classes) {
        funcs = funcs.concat(apiClass.funcs);
        variableInferData.push(...extractVariableInferData(
            apiClass.variables_p, apiClass.cls_var_ln
        ));
    }

    // Collect functions & function variables
    for (const func of funcs) {
        // Assume: already sorted by value. Extract keys
        // Provide 'None' type prediction when no return type exists
        const returnTypes = func.ret_type_p?.map(retParam => {
            return retParam[0];
        }) || ['None'];
        
        // Extract parameter predictions
        const paramTypes: { [key: string]: Array<string> } = {};
        for (const param of Object.keys(func.params_p)) {
            paramTypes[param] = func.params_p[param].map(annotation => {
                return annotation[0];
            });
        }
        
        // Map to FunctionInferData object
        const funcEntry: FunctionInferData = {
            name: func.name,
            lines: [func.fn_lc[0][0], func.fn_lc[1][0]],
            returnTypes: returnTypes,
            params: paramTypes
        };

        functionInferData.push(funcEntry);
        variableInferData.push(...extractVariableInferData(
            func.variables_p, func.fn_var_ln
        ));
    }

    return {
        functions: functionInferData,
        variables: variableInferData
    };
}

/**
 * Helper function to convert a prediction mapping with a complementing line number
 * mapping for variables to an array of VariableInferData objects.
 * 
 * Entries that are present in one mapping but not the other are ignored (normally
 * this should not occur)
 *
 * @param predictions Variable -> Prediction map
 * @param locs Variable -> Line Number map
 * @returns Array of transformed variable infer data
 */
function extractVariableInferData(
    predictions: InferApiParamPredictionMapping,
    locs: InferApiVarLocations): Array<VariableInferData> {
        let inferData: Array<VariableInferData> = [];

        for (const key of Object.keys(predictions)) {
            // Location not found (should generally not occur)
            if (!locs[key]) {
                continue;
            }

            // Convert from mapping to VariableInferData object
            const varData: VariableInferData = {
                name: key,
                annotations: predictions[key].map((val) => {
                    return val[0];
                }),
                lines: [locs[key][0][0], locs[key][1][0]]
            };

            inferData.push(varData);
        }

        return inferData;
}