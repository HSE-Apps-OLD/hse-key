const express = require('express')
const sgMail = require('@sendgrid/mail')
const phone = require('phone')
const router = express.Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { body, validationResult } = require('express-validator');


const {config} = require('../config')
const {JWT_SECRET, SG_KEY} = config




sgMail.setApiKey(SG_KEY)


const templates = {
    emailVerification: "d-f3b28e521c2d447086f3e9c4068cf36c"
    }



// Verifies account

router.post('/verify/', async (req, res) => {
    const {token} = req.body
    console.log(token)
    try{
        const payload = await jwt.verify(token, JWT_SECRET+"email")
        const {id} = payload
        await User.updateOne({_id: id}, {verified: true})
        res.send("Success")
    } catch (err) {
        console.log(err)
        res.status(400).send("fail")
    }
})



//




router.post('/verify/resend', async(req,res) => {

    const token = req.headers.authorization.split(" ")[1]

    if(!req.headers.authorization){
        console.log('no auth')
        return res.status(400).json({errors: [{msg: "Auth Please"}]})
    }


    try{

        const {id} = await jwt.verify(token, JWT_SECRET)

        const user = await User.findById(id)


        const emailToken = jwt.sign({id}, JWT_SECRET+'email', {expiresIn: "1d"})


        const msg = {
            to: user.email,
            from: {
              email: "support@hseapps.org",
              name: "HSE Apps"
            },
            templateId: templates.emailVerification,
            dynamic_template_data: {
              emailToken: emailToken
            }
          }
        
        await sgMail.send(msg, (err) => {
            if(err){
                console.log(err)
            }
        })

        res.send("Success")

    } catch (err) {
        console.log(err)
        res.status(400).send("Error")
    }
  
})






// Aggregate user fetch
router.post('/aggregate', async (req, res) => {
    const {idList} = req.body
    console.log(idList)
    try{
        const users = await User.find({_id: {$in: idList}}, '-password')
        res.json(users)

    } catch(err) {
        console.log(err)
        return res.status(500).json({errors: [{msg: "Server Error"}]})
    }
})

// Returns user data


router.get('/', async (req, res) => {


    if(!req.headers.authorization){
        return res.status(400).json({errors: [{msg: "Auth Please"}]})
    }

    const token = req.headers.authorization.split(" ")[1]

    try{
        await jwt.verify(token, JWT_SECRET, async (err, payload) => {
            if(err){
                return res.status(401).json({errors: [{msg: "Invalid Token"}]})
            } else {
                const user = await User.findById(payload.id, '-password')
                
                
                res.json(user)
            }
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({errors: [{msg: "Server Error"}]})
    }
})


// Returns JWT token
// Sends verification email to them

router.put('/', 
    [
        body('name').notEmpty().contains(" ").withMessage("Enter your full name"),
        body("phone").isMobilePhone().withMessage("Enter a valid phone"),
        body('class').trim().isNumeric().withMessage("Enter a valid class name"),
        body('img').isURL()
    ], 
    async (req,res) => {

        const errors = validationResult(req).array()

        console.log(errors)

        // if (!errors.isEmpty()) {
        //   return res.json({ errors: errors.array() }).status(400);
        // }

        const token = req.headers.authorization.split(" ")[1]





        if(!token){
            return res.status(400).json({errors: [{msg: "Auth Please"}]})
        }

        try{

            let payload;
            
            jwt.verify(token, JWT_SECRET, async (err, decoded) => {
                if(err){
                    return res.status(400).json({errors: [{msg: "Invalid Token"}]})
                } else {
                    payload =decoded
                }
            })
            const user = await User.findById(payload.id)

            if(req.body.name){
                const nameError = errors.some((error) => error.param == 'name')
                if(!nameError){
                    user.name = req.body.name
                } else {
                    return res.status(400).json({errors: [{msg: "Enter your full name"}]})
                }
            }
            
            if(req.body.img){
                const imgError = errors.some((error) => error.param == 'img')
                if(!imgError){
                    user.profilePictureURL = req.body.img
                } else {
                    return res.status(400).json({errors: [{msg: "Something went wrong uploading your image"}]})
                }
            }


            if(req.body.class){
                const classError = errors.some((error) => error.param == 'class')
                if(!classError){
                    if(req.body.class > 2015 && req.body.class <= 2030){
                        user.class = req.body.class
                    } else {
                        return res.status(400).json({errors: [{msg: "Enter a valid class"}]})
                    }

                } else {
                    return res.status(500).json({errors: [{msg: "Enter a valid class"}]})
                }
            }

            if(req.body.phone){
                const phoneError = errors.some((error) => error.param == 'phone')
                if(!phoneError){
                    user.phone = phone(req.body.phone, 'USA')[0]
                } else {
                    return res.status(500).json({errors: [{msg: "Enter a valid phone number"}]})
                }
            }

            user.save()
            res.json(user)
        } catch(err) {
            console.log(err)
            return res.status(500).json({errors: [{msg: "Server Error"}]})
        }

})





router.post('/signup', 
    [
        body('password').notEmpty().withMessage("Please enter a password"),
        body('email').isEmail().withMessage("Please enter a valid email"),
        body('name').notEmpty().contains(" ").withMessage("Please enter your full name")
    ], 
    async (req,res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() })
        }

        const {password, email, name} = req.body

        const domain = email.split("@")[1]

        if(domain != "gmail.com" && domain != "hsestudents.org"){
            return res.status(400).json({errors: [{msg: "Your must use your HSE email"}]})
        }

        try{

            const emailExists = await User.findOne({email: email}) 
            if(emailExists){
                return res.status(400).json({errors: [{msg: "This email has already been used"}]})
            }

            const hashedPW = await bcrypt.hash(password, 12)

            let role;
            if(domain == "hsestudents.org"){
                role = 'teacher'
            } else {
                role = 'student'
            }

            const user = new User({email,password: hashedPW, name, role, dateRegistered: Date.now()})
            user.save()
            
            const token = jwt.sign({id: user._id}, JWT_SECRET, {expiresIn: "4hr"})

            const emailToken = jwt.sign({id: user._id}, JWT_SECRET+'email', {expiresIn: "1d"})


            const msg = {
                to: user.email,
                from: {
                  email: "support@hseapps.org",
                  name: "HSE Apps"
                },
                templateId: templates.emailVerification,
                dynamic_template_data: {
                  emailToken: emailToken
                }
              }
            
            await sgMail.send(msg, (err) => {
                if(err){
                    console.log(err)
                }
            })
            

            res.send(token)
        } catch (err) {
            console.log(err)
            return res.status(500).json({errors: [{msg: "Server Error"}]})
        }
})



// Returns JWT auth token

router.post('/login', 
    [
        body('password').notEmpty().withMessage("Please enter a password"),
        body('email').isEmail().withMessage("Please enter a valid email")
    ], 
    async (req,res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() })
        }

        const {password, email} = req.body

        try{

            const user = await User.findOne({email: email}) 

            if(!user){
                return res.status(400).json({errors: [{msg: "Invalid Credentials"}]})
            }

            const validPW = await bcrypt.compare(password, user.password)

            if(!validPW){
                return res.status(400).json({errors: [{msg: "Invalid Credentials"}]})
            } else {
                const token = jwt.sign({id: user._id}, JWT_SECRET, {expiresIn: "4hr"})
                res.send(token)
            }


        } catch (err) {
            console.log(err)
            return res.status(400).json({errors: [{msg: "Server Error"}]})
        }
})

module.exports = router