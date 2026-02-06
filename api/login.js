module.exports = (req, res) => {
  res.statusCode = 204;
  res.setHeader('Cache-Control', 'no-store');
  res.end();
};
