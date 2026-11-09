const mongoose = require('mongoose');
const fail = (status, message) => Object.assign(new Error(message), { status });
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validId = id => typeof id === 'string' && mongoose.isObjectIdOrHexString(id);
const idParam = name => (req, res, next) => validId(req.params[name]) ? next() : next(fail(400, 'Invalid '+name));
module.exports = { fail, wrap, validId, idParam };
