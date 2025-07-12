const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log("data in multer")
    cb(null, "public/Uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + " " + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /avif|jpeg|jpg|png|gif|mp4/; 
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb("invalid file type" , false)
      // const error = {
      //   message: "Incorrect file type",
      //   details: {
      //     allowedExtensions: ["jpeg", "jpg", "png", "gif", "mp4"],
      //     receivedExtension: path.extname(file.originalname),
      //   },
      // };
      // return cb({ error, status: 0 });
    }
  },
});

module.exports = upload;
