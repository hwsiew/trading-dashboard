const config= {
  preset: 'ts-jest',
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "^types(.*)$": "<rootDir>/src/types$1",
  }
};
module.exports = config;