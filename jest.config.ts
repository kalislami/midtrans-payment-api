/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'], // jika butuh akses .env
    testMatch: ['**/tests/**/*.test.ts'],
};
