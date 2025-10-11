"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const simple_proxy_1 = __importDefault(require("./simple-proxy"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Mount proxy routes
app.use('/api/v1', simple_proxy_1.default);
// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
    console.log(`Proxy server listening on port ${port}`);
});
//# sourceMappingURL=proxy-server.js.map