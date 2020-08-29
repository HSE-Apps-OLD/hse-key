const express = require('express')
const router = express.Router()
const dotenv = require('dotenv')
const {config} = require('../config')
const {TWILIO_TOKEN, TWILIO_SID} = config
const client = require('twilio')(TWILIO_SID, TWILIO_TOKEN)
const User = require('../models/User')




router.post('/single/:id', async (req, res) => {

    try{
        const user = await User.findById(req.params.id)

        if(!user.phone){
            return res.status(500).json({errors: [{msg: "This user doesn't have their phone number linked"}]})
        }

        client.messages.create({
            body: req.body.msg,
            from: "+13177512332",
            to: user.phone
        })
        .then(() => res.send("Success"))
        
    } catch(err) {
        console.log(err)
        return res.status(500).json({errors: [{msg: "Server Error"}]})
    }
})

router.post('/aggregate', async (req, res) => {
    const {idList, message} = req.body
    try{
        const users = await User.find({_id: {$in: idList}})
        
        users.forEach(user => {
            if(user.phone){
                client.messages.create({
                    body: message,
                    from: "+13177512332",
                    to: user.phone
                })
            }
        })

        res.send('success')
    } catch(err) {
        console.log(err)
        return res.status(500).json({errors: [{msg: "Server Error"}]})
    }
})

module.exports = router