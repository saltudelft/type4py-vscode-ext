import * as assert from 'assert';
import { InferApiData, InferData, transformInferApiData } from "../../src/type4pyData";
import * as sampleResponse from "../sample-response.json";
import * as sampleTransformed from "../sample-expected.json";


suite('Type4Py Data', () => {
    test('Transform API Data', function() {
        // There are some type ambiguities from the JSON signature directly.
        // So instead, we can stringify & parse to resolve the type issue.
        const inferApiData: InferApiData = JSON.parse(JSON.stringify(sampleResponse));
        const transformedData = transformInferApiData(inferApiData);
        const expectedData: InferData = JSON.parse(JSON.stringify(sampleTransformed));

        assert.deepStrictEqual(transformedData, expectedData);
    });
});
