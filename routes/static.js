const express = require('express')
const router = express.Router()
const multer = require('../db/multer')
const bucket = require('../db/bucket')
const {format} = require('util')

 
router.post('/', multer.single('file'), (req, res, next) => {
    if (!req.file) {
      return res.status(500).json({errors: [{msg: 'No file uploaded'}]})
    }
  
    // Create a new blob in the bucket and upload the file data.
    const blob = bucket.file(req.file.originalname.replace(" ", ""));
    const blobStream = blob.createWriteStream();
  
    blobStream.on('error', (err) => {
      return res.status(500).json({errors: [{msg: err}]})
    });
  
    blobStream.on('finish', () => {
      // The public URL can be used to directly access the file via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );
      res.send(publicUrl).status(200);
    });
  
    blobStream.end(req.file.buffer);
  });

module.exports = router