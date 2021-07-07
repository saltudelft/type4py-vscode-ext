

export function capitalized(s: string) {
    if (s.length > 1) {
        return s[0].toUpperCase() + s.slice(1);
    }
    return s;
}

/**
 * Helper function to check if a target line number is (inclusively) within
 * the given bounds.
 * @param line Line number to check
 * @param bounds Bounds to check inclusion in
 * @returns True if line is in bounds
 */
export function isWithinLineBounds(line: number, bounds: [number, number]) {
    return line >= bounds[0] && line <= bounds[1];
}