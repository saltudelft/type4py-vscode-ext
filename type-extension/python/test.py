import json

data = [{
    'line': 1,
    'return_types': ['int', 'typing.Dict', 'str', 'any'],
    'params': {
        'a': ['str', 'any']
    }
}, {
    'line': 4,
    'return_types': ['int'],
    'params': {
        'x': ['any'],
        'y': ['typing.List', 'any']
    }
}]

print(json.dumps(data))