"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const utmSchema = zod_1.z.object({
    destinationUrl: zod_1.z.string().url(),
    utm_source: zod_1.z.string().min(1),
    utm_medium: zod_1.z.string().min(1),
    utm_campaign: zod_1.z.string().min(1),
    utm_content: zod_1.z.string().optional(),
    utm_term: zod_1.z.string().optional(),
});
// Mocked storage
const storedLinks = [];
function generateUTMString(params) {
    const url = new URL(params.destinationUrl);
    Object.keys(params).forEach(key => {
        if (key !== 'destinationUrl' && params[key]) {
            const formattedKey = key;
            const formattedValue = params[key].toLowerCase().replace(/\s+/g, '_');
            url.searchParams.append(formattedKey, formattedValue);
        }
    });
    return url.toString();
}
router.post('/', (req, res) => {
    try {
        const validatedData = utmSchema.parse(req.body);
        const finalUrl = generateUTMString(validatedData);
        const newLink = {
            id: Math.random().toString(36).substring(7),
            ...validatedData,
            finalUrl,
            createdAt: new Date().toISOString()
        };
        storedLinks.push(newLink);
        res.status(201).json(newLink);
    }
    catch (error) {
        res.status(400).json({ error: 'Validation failed', details: error });
    }
});
router.get('/', (req, res) => {
    res.json(storedLinks);
});
exports.default = router;
