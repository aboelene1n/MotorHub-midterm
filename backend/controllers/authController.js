const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { wrap, fail } = require('../lib/http');
const publicUser = u => ({ id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: u.role });
const token = u => jwt.sign({ id: String(u._id) }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
const credentials = body => {
  if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) throw fail(400, 'Enter a valid email');
  if (typeof body.password !== 'string' || body.password.length < 6 || Buffer.byteLength(body.password) > 72) throw fail(400, 'Password must be 6–72 bytes');
  return { email: body.email.trim().toLowerCase(), password: body.password };
};
exports.register = wrap(async (req, res) => {
  const { email, password } = credentials(req.body);
  const { name, phone = '' } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100 || typeof phone !== 'string' || phone.length > 30) throw fail(400, 'Enter a name (up to 100 characters) and valid phone');
  if (await User.exists({email})) throw fail(409, 'Email is already registered');
  const user = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password,12), phone });
  res.status(201).json({ token: token(user), user: publicUser(user) });
});
exports.login = wrap(async (req, res) => {
  const { email, password } = credentials(req.body);
  const user = await User.findOne({email});
  if (!user || !(await bcrypt.compare(password,user.password))) throw fail(401, 'Invalid email or password');
  res.json({ token: token(user), user: publicUser(user) });
});
exports.getProfile = wrap(async (req,res) => res.json(publicUser(await User.findById(req.user.id))));
