const express = require('express');
const router = express.Router();
const { uploadBannerImage } = require('../middlewares/upload');
const { authCheck, adminCheck } = require('../middlewares/authCheck');

router.post('/images', authCheck, adminCheck, uploadBannerImage, (req, res) => {
    if (req.file && req.file.url) {
        res.json({ url: req.file.url, public_id: req.file.public_id });
    } else {
        res.status(400).json({ message: "No image uploaded" });
    }
});

module.exports = router;
