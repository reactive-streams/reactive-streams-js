module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    "<rootDir>/src/ts"
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  }
};