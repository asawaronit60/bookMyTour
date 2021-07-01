const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync')
const factory = require('./../controllers/handlerFactory')
const AppError = require('../utils/appError')
const multer = require('multer')
const sharp = require('sharp')


const multerStorage  = multer.memoryStorage();

const multerFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true)
    }
    else{
        cb(new AppError('Not an image,Please upload only image!',200) ,false)
    }
}

const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
})

exports.uploadTourImages = upload.fields([
    {name:'imageCover' , maxCount:1},
    {name:'image' , maxCount:3 }
])

exports.resizeTourImage = catchAsync(async(req,res,next)=>{
    
    if(!req.files.imageCover || !req.files.image) 
    return next();
 
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${req.body.imageCover}`)
      
        req.body.image= []

    await Promise.all(
         req.files.image.map(async(file,index )=>{
        const fileName = `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`
        
         await sharp(file.buffer)
        .resize(2000,1333)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/tours/${fileName}`)
         
        req.body.image.push(fileName) 
    })
    )    
    next()
})

exports.aliasTopTour = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name,price,difficulty,ratingsAverage'
    next()
}

//GET all tours
exports.getAllTours = factory.getAll(Tour)
//Get particular tour
exports.getTour = factory.getOne(Tour, { path: 'reviews' })
//Create tour//
exports.createTour = factory.createOne(Tour)
//Update tour//
exports.updateTour = factory.updateOne(Tour)
//Delete tour//
exports.deleteTour = factory.deleteOne(Tour)


exports.getTourStats = catchAsync(async (req, res, next) => {

    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: '$difficulty',
                numTours: { $sum: 1 },
                numRating: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }

    ])//stats

    res.status(200).json({
        status: 'Success',
        data: {
            stats
        }
    })
})


exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year   //2021
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numToursStarts: -1 }
        },
        {
            $limit: 6
        }
    ])

    res.status(200).json({
        status: 'success',
        result: plan.length,
        data: {
            plan
        }
    })
})


// /tours-within/:distance/center/:latlng/unit/:unit

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng)
        return next(new AppError('Please provide latitude and longitude in format lat,lng.', 400))

    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({
        status: 'Success',
        result: tours.length,
        data: {
            data: tours
        }
    })

})


exports.getDistances = catchAsync(async (req, res, next) => {

    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',')
  
    const multiplier = unit==='mi' ? .000621371 : .001 

    if (!lat || !lng)
        return next(new AppError('Please provide latitude and longitude in format lat,lng.', 400))

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier,
                index:'startLocation'
            }
        },
        {
            $project:{
                distance:1,
                name:1
            }
        }
    ])

    res.status(200).json({
        status: 'Success',
        result:distances.length,
        data: {
            data: distances
        }
    })

})













































//filtering//
        //  const queryObject = {...req.query}
        //     const excludedFeilds = ['page','sort','limit','fields']
        //       excludedFeilds.forEach(el =>{
        //          delete queryObject[el]
        //     })
        //    let queryStr  = JSON.stringify(queryObject)
        //        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match=> `$${match}` )
        //       let query = Tour.find(JSON.parse(queryStr))

//sorting//
    //    if(req.query.sort){
    //     const sortBy = req.query.sort.split(',').join(" ")
    //    query = query.sort(sortBy)
    //     }
    //     else{
    //     query = query.sort('-createdAt')
    //      }


///Field limiting///

        //  if(req.query.sel){
        //      const fields  = req.query.sel.split(',').join(" ");
        //     query = query.select(fields)
        //  }
        //  else{
        //      query = query.select('-__v')
        //  }

         //    query  =  query.select(req.query.fields.split(',').join(" "))



  ////  PAGINATION///

        // const page = req.query.page*1 || 1;
        // const limit = req.query.limit * 1 || 100;
        // const skip = (page-1) * limit;


        // query = query.skip(skip).limit(limit)

        //  if(req.query.page){
        //      const tourNum = await Tour.countDocuments()
        //      if(skip >= tourNum) throw new Error ('This page does not exist')
        //  }