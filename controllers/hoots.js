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
            .populate([
                'author',
                'comments.author',
            ])
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
    };
});

// DELETE /hoots/:hootId
router.delete('/:hootId', verifyToken, async (req, res) => {
    try {
        const foundHoot = await Hoot.findById(req.params.hootId);
        if (!foundHoot.author.equals(req.user._id)) return res.status(403).send('you\'re not allowed to do that!');

        const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
        res.status(200).json(deletedHoot);
    } catch (err) {
        res.status(500).json({ err: err.message });
    };
});

// POST /hoots/:hootId/comments
router.post('/:hootId/comments', verifyToken, async (req, res) => {
    try {
        // set user as the author of the comment in the hootSchema
        req.body.author = req.user._id;
        const foundHoot = await Hoot.findById(req.params.hootId);
        foundHoot.comments.push(req.body);
        await foundHoot.save();

        // set the author in the commentSchema (separate document, referenced within Hoot)
        const newComment = foundHoot.comments[foundHoot.comments.length - 1];
        newComment._doc.author = req.user;

        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ err: err.message });
    };
});

// PUT /hoots/:hootId/comments/:commentId
router.put('/:hootId/comments/:commentId', verifyToken, async (req, res) => {
    try {
        const foundHoot = await Hoot.findById(req.params.hootId);
        const foundComment = foundHoot.comments.id(req.params.commentId);

        if (!foundComment.author.equals(req.user._id)) {
            return res.status(403).json({ message: 'you\'re not allowed to do that!' });
        };

        foundComment.text = req.body.text;
        await foundHoot.save();
        res.status(200).json({ message: 'comment successfully updated.' });
    } catch (err) {
        res.status(500).json({ err: err.message });
    };
});

// DELETE /hoots/:hootId/comments/:commentId
router.delete('/:hootId/comments/:commentId', verifyToken, async (req, res) => {
    try {
        const foundHoot = await Hoot.findById(req.params.hootId);
        const foundComment = foundHoot.comments.id(req.params.commentId);
        if (!foundComment.author.equals(req.user._id)) {
            return res.status(403).json({ message: 'you\'re not allowed to do that!' });
        };

        foundHoot.comments.remove({ _id: req.params.commentId });
        await foundHoot.save();
        res.status(200).json({ message: 'comment deleted successfully.' });
    } catch (err) {
        res.status(500).json({ err: err.message });
    };
});

module.exports = router;