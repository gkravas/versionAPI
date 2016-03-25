module.exports = function(req, res, next) {

  // Only buildMachine's IP is allowed
  if (req.connection.remoteAddress.indexOf('0.0.0.0') !== -1) {
    return next();
  }

  return res.forbidden('You are not permitted to perform this action.');
};
