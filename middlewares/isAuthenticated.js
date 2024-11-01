const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  console.log("Middleware d'authentification atteint");

  try {
    // Récupérer le token de l'en-tête Authorization
    const authHeader = req.headers.authorization;
    console.log("En-tête Authorization reçu :", authHeader);

    if (!authHeader) {
      console.log("Aucun en-tête Authorization trouvé");
      return res.status(401).json({ error: "unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token reçu :", token);

    // Chercher l'utilisateur correspondant au token
    const user = await User.findOne({ token: token }).select("-salt -hash");
    console.log("Utilisateur trouvé :", user);

    if (!user) {
      console.log("Utilisateur non trouvé, accès non autorisé");
      return res.status(401).json({ error: "unauthorized" });
    }

    req.user = user; // Attacher l'utilisateur à la requête
    console.log("Utilisateur authentifié :", req.user);
    next(); // Passer au middleware suivant
  } catch (error) {
    console.error("Erreur lors de l'authentification :", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = isAuthenticated;
