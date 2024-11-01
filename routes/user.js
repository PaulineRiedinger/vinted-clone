// Importer express, mongoose + les modèles nécessaires et les routes
const express = require("express");
const mongoose = require("mongoose");

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

const router = express.Router();

// Route pour l'inscription
router.post("/signup", async (req, res) => {
  console.log("Démarrage de l'inscription");

  try {
    const { username, email, password, newsletter } = req.body;
    console.log("Données reçues pour l'inscription :", req.body);

    // Vérification des champs requis
    if (!username) {
      console.log("Nom d'utilisateur manquant");
      return res
        .status(400)
        .json({ message: "Merci de renseigner un nom d'utilisateur" });
    }
    if (!email) {
      console.log("Email manquant");
      return res.status(400).json({ message: "Merci de renseigner un email" });
    }
    if (!password) {
      console.log("Mot de passe manquant");
      return res
        .status(400)
        .json({ message: "Merci de renseigner un mot de passe" });
    }

    // Vérification si l'email existe déjà
    const existingUser = await User.findOne({ email });
    console.log("Recherche d'utilisateur existant par email :", email);

    if (existingUser) {
      console.log("Utilisateur déjà existant avec cet email");
      return res
        .status(409)
        .json({ message: "L'adresse mail est déjà utilisée" });
    }

    // Génération du salt et hashage du mot de passe
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    console.log("Mot de passe hashé avec le salt :", salt);

    // Génération du token
    const token = uid2(64);
    console.log("Token généré :", token);

    // Création de l'utilisateur
    const newUser = new User({
      email,
      account: { username },
      newsletter,
      token,
      hash,
      salt,
    });

    // Sauvegarde dans la BDD
    await newUser.save();
    console.log("Nouvel utilisateur enregistré :", newUser);

    res.status(201).json({
      user: {
        email: newUser.email,
        account: newUser.account,
        token: newUser.token,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour la connexion
router.post("/login", async (req, res) => {
  console.log("Démarrage de la connexion");

  try {
    const { email, password } = req.body;
    console.log("Données reçues pour la connexion :", req.body);

    if (!email) {
      console.log("Email manquant");
      return res.status(400).json({ message: "Merci de renseigner un email" });
    }
    if (!password) {
      console.log("Mot de passe manquant");
      return res
        .status(400)
        .json({ message: "Merci de renseigner un mot de passe" });
    }

    // Trouver l'utilisateur
    const userFound = await User.findOne({ email });
    console.log("Recherche d'utilisateur pour la connexion :", email);

    if (!userFound) {
      console.log("Utilisateur non trouvé");
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    // Vérification du mot de passe
    const newHash = SHA256(password + userFound.salt).toString(encBase64);
    console.log("Mot de passe hashé pour vérification :", newHash);

    if (newHash !== userFound.hash) {
      console.log("Mot de passe incorrect");
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Connexion réussie
    console.log("Connexion réussie pour l'utilisateur :", userFound);
    res.status(200).json({
      _id: userFound._id,
      token: userFound.token,
      account: {
        username: userFound.account.username,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
