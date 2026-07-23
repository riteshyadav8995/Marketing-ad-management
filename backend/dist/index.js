"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const utm_1 = __importDefault(require("./routes/utm"));
const pages_1 = __importDefault(require("./routes/pages"));
const experiments_1 = __importDefault(require("./routes/experiments"));
const attribution_1 = __importDefault(require("./routes/attribution"));
const integrations_1 = __importDefault(require("./routes/integrations"));
const leads_1 = __importDefault(require("./routes/leads"));
const public_1 = __importDefault(require("./routes/public"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/utm-links', utm_1.default);
app.use('/api/pages', pages_1.default);
app.use('/api/experiments', experiments_1.default);
app.use('/api/attribution', attribution_1.default);
app.use('/api/integrations', integrations_1.default);
app.use('/api/leads', leads_1.default);
app.use('/api/public', public_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
