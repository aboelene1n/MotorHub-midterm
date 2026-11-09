const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { wrap, fail, validId } = require('../lib/http');
const protect = wrap(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw fail(401, 'Please sign in');
  let decoded;
  try { decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { throw fail(401, 'Session expired. Please sign in again'); }
  if (!validId(decoded.id)) throw fail(401, 'Invalid session');
  const user = await User.findById(decoded.id).select('-password');
  if (!user) throw fail(401, 'Account no longer exists');
  req.user = { id: String(user._id), role: user.role };
  next();
});
module.exports = { protect };
