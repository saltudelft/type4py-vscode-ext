import * as assert from 'assert';
import { InferData } from '../../src/type4pyData';
import typestore from "../../src/typestore";

suite('Typestore', () => {
    test('Typestore query non-existent', () => {
        assert.strictEqual(typestore.get('random'), undefined);
    });

    test('Typestore add & query', () => {
        const key = 'fileKey';
        const data: InferData = { functions: [], variables: [] };
        typestore.add(key, data);

        assert.strictEqual(typestore.get(key), data);
    });

    test('Typestore replace', () => {
        const key = 'fileKey2';
        const data1: InferData = { functions: [], variables: [] };
        const data2: InferData = { functions: [{
            name: "func",
            lines: [3, 7],
            returnTypes: ["int"],
            params: { "p": ["str"] }
        }], variables: [{
            name: "v",
            lines: [1, 2],
            annotations: ["Union[int, float]"]
        }] };

        assert.strictEqual(typestore.get(key), undefined);
        typestore.add(key, data1);
        assert.strictEqual(typestore.get(key), data1);
        typestore.add(key, data2);
        assert.strictEqual(typestore.get(key), data2);
    });
});
