import libcst as cst


def build_function_stub(name, parameters, return_type):
    """
    Constructs a function stub as a string from the specified function
    parameters.

    :param: name Name of the function
    :param: parameters List of parameters in the form of (name, type) tuples
    :param: return_type Name of the return type of the function
    :return: function stub as a string
    """

    # Append begining of function signature
    function = "def " + name + "("

    # Append parameters
    for i in range(len(parameters)):
        param = parameters[i]
        param_name = param[0]
        param_type = param[1]

        # Append parameter name
        function += param_name

        # If parameter type present, add it
        if (param_type):
            function += ": " + param_type
        
        # Separate non-last element by comma
        if ((i+1) != len(parameters)):
            function += ", "

    # Close parameter list
    function += ")"

    # Append return type
    if (return_type):
        function += " -> " + return_type

    # Append ending of the function stub
    function += ": ..."

    return function


test_func = build_function_stub("test_func", [("name", None), ("value", "int")], "int")
print(test_func)