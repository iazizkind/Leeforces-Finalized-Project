const multer = require("multer");

// Memory storage: file lives only in req.file.buffer, never touches disk.
// This buffer gets streamed straight to Cloudinary in the controller.
const storage = multer.memoryStorage();

const videoUpload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit, matches AdminPanel.jsx check
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith("video/")) {
            return cb(null, true);
        }
        cb(new Error("Only video files are allowed!"));
    }
});

module.exports = videoUpload;