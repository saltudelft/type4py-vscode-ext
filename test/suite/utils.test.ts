import * as assert from 'assert';
import { isWithinLineBounds } from "../../src/utils";

suite('Utils', () => {
    test('In bounds', () => {
        assert.strictEqual(isWithinLineBounds(3, [1, 7]), true);
    });

    test('In bounds (left edge)', () => {
        assert.strictEqual(isWithinLineBounds(2, [2, 4]), true);
    });

    test('In bounds (right edge)', () => {
        assert.strictEqual(isWithinLineBounds(3, [1, 3]), true);
    });

    test('Out of bounds', () => {
        assert.strictEqual(isWithinLineBounds(2, [6, 10]), false);
    });

    test('Out of bounds (left edge)', () => {
        assert.strictEqual(isWithinLineBounds(3, [4, 6]), false);
    });

    test('Out of bounds (right edge)', () => {
        assert.strictEqual(isWithinLineBounds(9, [2, 8]), false);
    });
});
