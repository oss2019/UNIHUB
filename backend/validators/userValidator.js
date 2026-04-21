import { param, query, validationResult } from "express-validator";
import { AppError } from "../utils/appError.js";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((err) => err.msg)
      .join(". ");
    return next(new AppError(400, message));
  }
  return next();
};

export const validateUserIdParam = [
  param("id").isMongoId().withMessage("Invalid user id format"),
  handleValidationErrors,
];

export const validateUserThreadsQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100"),
  handleValidationErrors,
];

export const validateUsersListQuery = [
  query("role")
    .optional()
    .isString()
    .trim()
    .isIn(["STUDENT", "ALUMNI", "student", "alumni"])
    .withMessage("role must be STUDENT or ALUMNI"),
  handleValidationErrors,
];
