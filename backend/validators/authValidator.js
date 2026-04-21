import { body, cookie, query, validationResult } from "express-validator";
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

const rejectBody = (routeLabel) => (req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    return next(new AppError(400, `${routeLabel} does not accept a request body`));
  }
  return next();
};

export const validateGoogleAuth = [
  query("prompt")
    .optional()
    .isString()
    .trim()
    .isIn(["none", "consent", "select_account"])
    .withMessage("prompt must be one of: none, consent, select_account"),
  rejectBody("Google auth"),
  handleValidationErrors,
];

export const validateGoogleCallback = [
  query("code")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("code must be a non-empty string"),
  query("state")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("state must be a non-empty string"),
  query("error")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("error must be a non-empty string"),
  rejectBody("Google callback"),
  (req, res, next) => {
    const hasCode = typeof req.query.code === "string" && req.query.code.trim().length > 0;
    const hasError = typeof req.query.error === "string" && req.query.error.trim().length > 0;

    if (!hasCode && !hasError) {
      return next(new AppError(400, "Missing OAuth callback data: expected code or error query param"));
    }

    return handleValidationErrors(req, res, next);
  },
];

export const validateRefreshRequest = [
  cookie("refreshToken")
    .exists()
    .withMessage("refreshToken cookie is required")
    .bail()
    .isString()
    .withMessage("refreshToken cookie must be a string")
    .bail()
    .notEmpty()
    .withMessage("refreshToken cookie cannot be empty"),
  body().custom((value, { req }) => {
    if (req.body && Object.keys(req.body).length > 0) {
      throw new Error("Refresh endpoint does not accept a request body");
    }
    return true;
  }),
  handleValidationErrors,
];

export const validateLogoutRequest = [
  body().custom((value, { req }) => {
    if (req.body && Object.keys(req.body).length > 0) {
      throw new Error("Logout endpoint does not accept a request body");
    }
    return true;
  }),
  handleValidationErrors,
];

export const validateGetMeRequest = [
  rejectBody("Get current user"),
  handleValidationErrors,
];
