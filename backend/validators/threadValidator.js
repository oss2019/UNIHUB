import { body, param, validationResult } from 'express-validator';
import { AppError } from '../utils/appError.js';

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array().map(err => err.msg).join('. ');
        return next(new AppError(400, message));
    }
    next();
};

export const validateThreadCreation = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .trim()
        .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('content')
        .notEmpty().withMessage('Content is required')
        .trim()
        .isLength({ min: 10, max: 5000 }).withMessage('Content must be between 10 and 5000 characters'),
    body('subForumId')
        .notEmpty().withMessage('subForumId is required')
        .isMongoId().withMessage('Invalid subForumId format'),
    handleValidationErrors
];

export const validateThreadParamId = [
    param('id')
        .isMongoId().withMessage('Invalid Resource ID structure'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new AppError(404, "Thread not found")); // Mask structural breaks gracefully as identical 404 targets natively.
        }
        next();
    }
];
