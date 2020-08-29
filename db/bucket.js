const {Storage} = require('@google-cloud/storage');

const storage = new Storage()



const bucket = storage.bucket('hse-key')

module.exports = bucket