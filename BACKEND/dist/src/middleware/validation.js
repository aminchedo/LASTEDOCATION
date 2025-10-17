"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const logger_1 = require("./logger");
function validate(schemas) {
    return async (req, res, next) => {
        try {
            // Validate body
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            // Validate query
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query);
            }
            // Validate params
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                logger_1.logger.warn({
                    msg: 'validation_failed',
                    path: req.path,
                    errors: error.errors
                });
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            else {
                logger_1.logger.error({
                    msg: 'validation_error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                res.status(500).json({
                    success: false,
                    error: 'Internal validation error'
                });
            }
        }
    };
}
//# sourceMappingURL=validation.js.map