const crypto = require('crypto')
const util = require('util')
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')  
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email' )

const signtoken = (id)=>{
    return  jwt.sign({ id:id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}


const createSendToken = (user,statusCode,res) =>{
     const token = signtoken(user._id);

    const cookieOptions =  {
        expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 *60 *60 *1000),
        secure: process.env.NODE_ENV==='production' ? true : false ,
        httpOnly: true
 }

   res.cookie('jwt',token,cookieOptions)

    //remove the pasword from the optput
       user.password= undefined
  
       res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user
        }
    })
}

//////////////////SIGNUP//////////
exports.signup = catchAsync(async (req,res,next)=>{
   const  newUser = await User.create(req.body)

  createSendToken(newUser,201,res);

})


        //////////////////////LOGIN//////////////////
exports.login = catchAsync(async(req,res,next)=>{
    const {email,password }  = req.body;
    
    //check if email and password exists
        if(!email || !password)
      return  next(new AppError('Please provide an email or password!',400))

    // check id user exists and password is correct
     const user =  await User.findOne({email}).select('+password')
      if(!user || !(await user.correctPassword(password,user.password)) )
      return next(new AppError('Incorrect email or password',401))

    //   if(!user.active) return next(new AppError('account deleted',501))
      
    //if everything ok then send token to the client
      createSendToken(user,200,res);
   
})

exports.logout = (req,res)=>{
     res.cookie('jwt','loggedout',{
         expiresIn:new Date(Date.now() + 10*1000),
         httpOnly:true
     })
     res.status(200).json({
         status:'success'
     })
}


//////////PROTECTION MIDDLEWARE -->check if user is logged in or not////////////////
exports.protect = catchAsync(async (req,res,next)=>{
     let token  
//1)get token and check if its there
       if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
       } else if(req.cookies.jwt){
       token = req.cookies.jwt
       }

       
      if(!token) 
   return next(new AppError('you are not logged in Please log in to get access',401))
  
 //2)validate token
     const decoded = await util.promisify(jwt.verify)(token,process.env.JWT_SECRET)
      
//3)check is user still exists
        const currentUser = await User.findById(decoded.id)
        if(!currentUser)
        return next(new AppError('User belonging to this token no longer exists',401))
    

// 4)check if user changed password after token was issued
        if(currentUser.changedPasswordAfter(decoded.iat)){
            return next(new AppError('User recently changed password',401))
        }
               
           req.user = currentUser;
           res.locals.user = currentUser;

           next();

})

exports.isLoggedIn = async(req,res,next)=>{
    //  console.log(req.cookies)
    // if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
       if(req.cookies.jwt){
      try{
        const decoded = await util.promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET)
        
        const currentUser = await User.findById(decoded.id)
         if(!currentUser) {
         return next();
         }

         if(currentUser.changedPasswordAfter(decoded.iat)){
            return next()
        }
             
        res.locals.user = currentUser;
        return next();
        
    }catch(err){
          return next();
     }

    }
    next();

}




exports.restrictTo = (...roles) =>{
    return (req,res,next) =>{
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action!',403))
        }
        next();
    }
}

//////////FORGOT PASSWORD///////////////
exports.forgotPassword = catchAsync( async (req,res,next)=>{
    const user = await User.findOne({email:req.body.email})
     if(!user) return next(new AppError('no user found with this email address',401))
       
//2)Generate random token
    //  const resetToken =  User.createPasswordResetToken;
    //     await user.save({ validateBeforeSave : false })
          const resetToken  = crypto.randomBytes(32).toString('hex');
          user = crypto.createHash('sha256').update(resetToken).digest('hex')
        //  console.log({resetToken} , user.passwordResetToken)
          user.passwordResetExpires = Date.now() + 10*60*1000;
            
          await user.save({validateBeforeSave:false})

const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

// console.log(resetURL)
const message = `Forgot your password! sumbit a patch request with your new passsword ans passwordConfirm to
                           ${resetURL}\n If you didn't forgot please ignore this email`

    // console.log('above try catch block')

    try{   
      await sendEmail({
        email:user.email,
        subject:'Your password reset token (valid for 10 mins only)',
        message
    })

res.status(201).json({
    status:'success',
    message:'Token sent to mail'

})
}catch(err){
    
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({validateBeforeSave:false})
    return next(new AppError('There was an error sending the email. Try Again later.',500))
}


    })//forogot password



///////////RESET PASSWORD////////////
exports.resetPassword = catchAsync(async(req,res,next)=>{

const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

 const user =  await User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}})
 
 if(!user) return next(new AppError('Token is invalid or expired',400))
 
 user.password = req.body.password;
 user.confirmPassword = req.body.confirmPassword;
 user.passwordResetToken = undefined;
 user.passwordResetExpires = undefined;

 await user.save({validateBeforeSave:true});
       
 createSendToken(user,201,res);

})


///////////UPDATE PASSWORD//////////////
exports.updatePassword = catchAsync( async (req,res,next) =>{
     
    const user = await User.findById(req.user._id).select('+password');
               
      if(!await(user.correctPassword(req.body.passwordCurrent,user.password)))
    return next(new AppError('Incorrent current password! please enter correct current password',401))
    
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        
       if(! (user.password === user.passwordConfirm))
        return next(new AppError('Passwords do not match',400))

        await user.save()
         
  //user .findByIdAndUpdate can't be used as UserSchema middleware will not work 
   //as they work only on save and create
   createSendToken(user,200,res);
           


})