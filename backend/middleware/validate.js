const { validationResult } = require("express-validator");

/**
 * Reads express-validator results and returns 400 on first error.
 * Mount after your validation chain: router.post("/", [...validators], validate, controller)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors:  errors.array(),
    });
  }
  next();
};

module.exports = validate;
