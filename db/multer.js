const Multer = require('multer')

const storage = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
})

module.exports = storage