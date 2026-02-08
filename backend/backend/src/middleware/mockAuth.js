const mockAuth = (req, res, next) => {
    
  // Temporary: simulate logged-in user
  req.user = {
    id: "6974287f688a62bfdb66791e" // Used a random user's ID from DB
  };

  next();
};

export default mockAuth;