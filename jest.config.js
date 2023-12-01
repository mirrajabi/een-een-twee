// This is a basic typescript testing config that uses ts-jest
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
        },
    },
};
