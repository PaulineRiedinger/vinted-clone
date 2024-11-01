// Importer express + les modèles nécessaires et les routes
const express = require("express");

const fileUpload = require("express-fileupload");

const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");

const Offer = require("../models/Offer");

const router = express.Router();

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: "dagcd4gbx",
  api_key: "158493649496338",
  api_secret: "TumEqT6URQJ8yHiK-kXV3Ndlb7U",
});
console.log("Configuration de Cloudinary réussie");

// Middleware pour le téléchargement de fichiers
router.use(fileUpload());
console.log("Middleware pour le téléchargement de fichiers ajouté");

// Fonction pour convertir les fichiers en base64
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Route pour uploader l'image sur Cloudinary
const uploadImageToCloudinary = async (picture) => {
  console.log("Upload de l'image sur Cloudinary...");
  const result = await cloudinary.uploader.upload(convertToBase64(picture));
  console.log("Image uploadée avec succès :", result.secure_url);
  return result.secure_url; // Retourne l'URL sécurisée de l'image
};

// Créer une route POST pour publier une offre
router.post("/publish", isAuthenticated, async (req, res) => {
  console.log("Requête reçue sur /publish");

  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      console.log(
        "Tentative de publication d'une offre par un utilisateur non authentifié"
      );
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Vérifier les champs requis
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    const { picture } = req.files || {};

    console.log("Données reçues pour la publication de l'offre :", req.body);

    if (
      !title ||
      !description ||
      !price ||
      !condition ||
      !city ||
      !brand ||
      !size ||
      !color ||
      !picture
    ) {
      console.log("Champs manquants lors de la publication de l'offre");
      return res
        .status(400)
        .json({ message: "Merci de renseigner tous les champs" });
    }

    // Upload de l'image sur Cloudinary
    const pictureUrl = await uploadImageToCloudinary(picture);

    // Créer une nouvelle offre
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ÉTAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      product_image: {
        secure_url: pictureUrl,
      },
      owner: req.user._id,
    });

    // Sauvegarder l'offre dans la BDD
    await newOffer.save();
    console.log("Nouvelle offre sauvegardée :", newOffer);

    res.status(201).json(newOffer);
  } catch (error) {
    console.error("Erreur lors de la publication de l'offre :", error);
    res.status(500).json({ message: error.message });
  }
});

// Pour tester si le middleware d'authentification fonctionne
router.use((req, res, next) => {
  console.log("Vérification d'authentification pour chaque requête");
  next();
});

module.exports = router;
