const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController')
const reviewRouter = require('./../routes/reviewRoutes')
// const reviewController = require('./../controllers/reviewController')

const router = express.Router();

// router.param('id',tourController.checkId)

//  router.route('/:tourId/reviews')
//.post(authController.protect , authController.restrictTo('user'),reviewController.createReview);
  
router.route('/tours-within/:distance/center/:latlng/unit/:unit')
             .get(tourController.getToursWithin)    

router.route('/distances/:latlng/unit/:unit') 
             .get(tourController.getDistances)

router.use('/:tourId/reviews',reviewRouter)

router.route('/top-5-cheap')
         .get(tourController.aliasTopTour,tourController.getAllTours);


router.route('/get-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year')
    .get(authController.protect,authController.restrictTo('lead-guide','admin','guide'),tourController.getMonthlyPlan)


router.route('/')
    .get(tourController.getAllTours)
    .post(authController.protect,authController.restrictTo('lead-guide','admin'),tourController.createTour)

router.route('/:id')
    .get(tourController.getTour)                
    .patch(authController.protect,
        authController.restrictTo('admin','lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImage,
        tourController.updateTour)

    .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteTour)
  
    
 module.exports = router;