"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiSource = getApiSource;
exports.getActiveEndpoint = getActiveEndpoint;
const env_1 = require("../config/env");
function getApiSource() {
    return env_1.ENV.CUSTOM_API_ENDPOINT && env_1.ENV.CUSTOM_API_KEY ? 'external' : 'local';
}
function getActiveEndpoint() {
    const source = getApiSource();
    if (source === 'external') {
        return {
            source,
            baseUrl: env_1.ENV.CUSTOM_API_ENDPOINT,
            apiKey: env_1.ENV.CUSTOM_API_KEY,
        };
    }
    // Local fallback: our own backend handles the chat logic (or delegates)
    return {
        source: 'local',
        baseUrl: 'http://localhost:3001', // self
    };
}
//# sourceMappingURL=apiConfig.js.map