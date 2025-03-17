const express = require('express');
const verifyToken = require('../middleware/verify-token');
const Hoot = require('../models/hoot');
const router = express.Router();

// POST /hoots
router.post('/', verifyToken, async (req, res) => {
    try {
        req.body.author = req.user._id;
        const hoot = await Hoot.create(req.body);
        hoot._doc.author = req.user;
        res.status(201).json(hoot);
    } catch (err) {
        res.status(500).json({ err: err.message });
    };
});

// GET /hoots
router.get('/', verifyToken, async (req, res) => {
    try {
        const hoots = await Hoot.find({})
            .populate('author')
            .sort({ createdAt: 'desc' });
        res.status(200).json(hoots);
    } catch (err) {
        res.status(500).json({ err: err.message });
    };
});

// GET /hoots/:hootId
router.get('/:hootId', verifyToken, async (req, res) => {
    try {
        const foundHoot = await Hoot.findById(req.params.hootId).populate('author');
        res.status(200).json(foundHoot);
    } catch (err) {
        res.status(500).json({ err: err.message });
    };
});

// PUT /hoots/:hootId
router.put('/:hootId', verifyToken, async (req, res) => {
    try {
        const foundHoot = await Hoot.findById(req.params.hootId);
        if (!foundHoot.author.equals(req.user._id)) return res.status(403).send('you\'re not allowed to do that!');

        const updatedHoot = await Hoot.findByIdAndUpdate(req.params.hootId, req.body, { new: true });
        updatedHoot._doc.author = req.user;
        res.status(200).json(updatedHoot);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
});

module.exports = router;