const jwt = require("jsonwebtoken");

// in middleware you get req,res,next
module.exports = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send(`Unauthorized`);
    }

    // destructure userId because when we send out the token we set payload as an object in auth.js
    const { userId } = jwt.verify(
      req.headers.authorization,
      process.env.jwtSecret
    );

    req.userId = userId;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).send(`Unauthorized`);
  }
};
