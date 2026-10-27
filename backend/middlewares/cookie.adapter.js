module.exports = (req, res, next) => {
  if (!req.headers.authorization && req.cookies?.access_token) {
    req.headers.authorization = `Bearer ${req.cookies.access_token}`;
  }

  next();
};