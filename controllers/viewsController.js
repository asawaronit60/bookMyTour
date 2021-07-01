const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel')
const User = require('./../models/userModel')
const catchAsync =require('./../utils/catchAsync')


exports.getOverview =catchAsync(async (req,res)=>{
      const tours = await Tour.find();
  
    res.status(200).render('overview',{
      title:'All tours',
      tours
    })
  })


exports.getTour =catchAsync(async (req,res,next)=>{
        
      const tour = await Tour.findOne({slug:req.params.slug}).populate({
          path:'reviews',
          select:'review rating user'
      })

    if(!tour){
      return next(new AppError('No tour with this name',400))
    }

       res.status(200).render('tour',{
       title:tour.name ,
      tour
    })
})


exports.login = catchAsync(async(req,res)=>{
   res.status(200).render('loginTemplate',{
     title:'Log into your account'
   })
})


exports.myAccount = catchAsync(async(req,res,next)=>{
  res.status(200).render('account',{
    title:'My Account'
  })
})


exports.updateUser = catchAsync(async(req,res,next)=>{
     const updatedUser  = await User.findByIdAndUpdate(req.user.id , {
       name:req.body.name,
       email:req.body.email
     },
     {
       new:true,
       runValidators:true
     })
       
     res.status(200).render('account',{
       title:'My Account',
       user: updatedUser
     })
            
})