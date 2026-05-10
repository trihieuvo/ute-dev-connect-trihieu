const { body, validationResult } = require('express-validator');

// Hàm xử lý kết quả validation
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const validateForgotPassword = [
    body('email').isEmail().withMessage('Vui lòng cung cấp một email hợp lệ.'),
    validateRequest
];

const validateResetPassword = [
    body('email').isEmail().withMessage('Vui lòng cung cấp một email hợp lệ.'),
    body('otp')
        .isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải bao gồm đúng 6 ký tự.')
        .isNumeric().withMessage('Mã OTP chỉ được chứa các chữ số.'),
    body('newPassword')
        .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự.'),
    validateRequest
];


//Okarin's part
const validateLogin = [
    body('email').isEmail().withMessage('Vui lòng cung cấp một email hợp lệ.'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống.'),
    validateRequest // Tái sử dụng middleware bắt lỗi của nhóm
];

// Export thêm validateLogin
module.exports = {
    validateForgotPassword,
    validateResetPassword,
    validateLogin
};