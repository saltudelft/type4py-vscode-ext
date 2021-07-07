export interface TestCase {
    data: any,
    expected: any
}

export class SetupError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SetupError";
    }
}

export function messageFor(testData: any, expected: any, actual: any): string {
   return `${actual} == ${expected}. \n[Test data]\n${testData}`;
};
