const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const redisClient = require('../config/redis');

// Cấu hình Nodemailer gửi email (Bạn cần thiết lập biến môi trường EMAIL_USER, EMAIL_PASS)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const handleForgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Email không tồn tại trong hệ thống!');

  // Tạo mã OTP 6 số ngẫu nhiên
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash OTP trước khi lưu vào Redis (Bảo mật)
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  // Lưu OTP đã hash vào Redis với thời hạn 15 phút (900 giây)
  const TTL_IN_SECONDS = 15 * 60;
  await redisClient.setEx(`pwdResetOTP:${email}`, TTL_IN_SECONDS, hashedOtp);

  // Gửi email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Mã OTP khôi phục mật khẩu (UTE Social Network)',
    text: `Chào ${user.name},\n\nMã OTP khôi phục mật khẩu của bạn là: ${otp}\n\nMã này sẽ hết hạn trong 15 phút.\nNếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.\n\nTrân trọng,`
  };
  
  await transporter.sendMail(mailOptions);
};

const handleResetPassword = async (email, otp, newPassword) => {
  // Lấy hash OTP từ Redis
  const storedHashedOtp = await redisClient.get(`pwdResetOTP:${email}`);

  // Nếu không tìm thấy key (do hết hạn TTL hoặc chưa từng yêu cầu)
  if (!storedHashedOtp) throw new Error('Mã OTP đã hết hạn hoặc không tồn tại yêu cầu cho email này!');

  // Kiểm tra OTP người dùng gửi lên so với hash trong Redis
  const isMatch = await bcrypt.compare(otp, storedHashedOtp);
  if (!isMatch) throw new Error('Mã OTP không chính xác!');

  // Nếu đúng OTP, tiến hành cập nhật mật khẩu
  const user = await User.findOne({ email });
  if (!user) throw new Error('Người dùng không tồn tại!');

  // Hash mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  
  // Lưu thay đổi vào DB
  await user.save();

  // Xóa mã OTP khỏi Redis sau khi đã đổi mật khẩu thành công (Tránh tái sử dụng)
  await redisClient.del(`pwdResetOTP:${email}`);
};

//Okarin's part

const handleLogin = async (email, password) => {
    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) throw new Error('Sai email hoặc mật khẩu!');

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Sai email hoặc mật khẩu!');

    return user; // Trả về thông tin user
};
module.exports = { handleForgotPassword, handleResetPassword, handleLogin };