const { z } = require('zod');

const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    } catch (error) {
        return res.status(400).json({
            error: 'Bad Request',
            details: error.errors
        });
    }
};

module.exports = validate;
