const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, removeAdditional: true });
addFormats(ajv);

const validateSchema = (schema) => {
    const validate = ajv.compile(schema);

    return (req, res, next) => {
        const isValid = validate(req.body);
        if (!isValid) {
            return res.status(400).json({
                error: 'Validación de datos fallida (JSON Schema)',
                details: validate.errors
            });
        }
        next();
    };
};

module.exports = validateSchema;
