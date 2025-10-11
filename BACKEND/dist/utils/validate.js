"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, source = 'body') => (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
        res.status(400).json({
            error: true,
            code: 'VALIDATION_ERROR',
            details: parsed.error.flatten(),
        });
        return;
    }
    req.validated = parsed.data;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map