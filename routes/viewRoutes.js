const express = require('express')
const viewsController  = require('./../controllers/viewsController')
const authController  =require('./../controllers/authController')
const router = express.Router();


router.get('/login',authController.isLoggedIn,viewsController.login)

router.get('/',authController.isLoggedIn,viewsController.getOverview)
  
router.get('/tour/:slug',authController.isLoggedIn,viewsController.getTour)

router.get('/me',authController.protect,viewsController.myAccount)

router.post('/sumbit-user-data',authController.protect, viewsController.updateUser)

module.exports = router;