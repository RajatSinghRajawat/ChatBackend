const User = require('../models/User')

const jwt = require("jsonwebtoken")


const protectRoute = async (req, res, next) => {
  try {
    // Check for token in Authorization header first, then in cookies
    let token = req.headers.authorization;
    
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7); // Remove 'Bearer ' prefix
    } else {
      token = req.cookies?.jwt; // Fallback to cookies
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = protectRoute;