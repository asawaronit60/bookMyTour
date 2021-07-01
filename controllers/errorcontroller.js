const AppError = require("../utils/appError")

 
const handleCastErrorDB = (err)=>{
     const message = `Invalid ${err.path} : ${err.value}`
      return new AppError(message,400)
 }

const handleDuplicateFieldsDb = (err)=>{
     const value = err.errmsg.match(/(["'])(\\?.)*?\1/) 
    const message =  `Duplicate field value : ${value[0]}. Please enter another value.`
    return new AppError(message,400)
 }

 const handleValidationErrorDB = (err)=>{
     const errors  = Object.values(err.errors).map(el => el.message);
     const message = `Invalid input data. ${errors.join('. ')}`
     return new AppError(message,400);
 }

 const handleJWTError = ()=>new AppError('Invalid token error.Please login again',401); 

const handleJWTExpiredError = () => new  AppError('Your token has expired Please login again',401)

 
 const sendErrorDev = (err,req,res) =>{
  // console.log(req)

     if(req.originalUrl.startsWith('/api')){
        res.status(err.statusCode).json({
            status:err.status,
            error :err,
            message: err.message,
            stack : err.stack
        })
     }else{
         res.status(err.statusCode).render('error',{
             title:'Something went wrong!',
             msg:err.message
         })
     }
    
 }//main
 
 const sendErrorProd = (err,req,res) => {
    // A) API
    if(req.originalUrl.startsWith('/api')) {
     // A) Operational, trusted error: send message to client
      if(err.isOperational) {
        return res.status(err.statusCode).json({
          status: err.status,
          message: err.message
        });
      }
      // B) Programming or other unknown error: don't leak error details
      // 1) Log error
      console.error('ERROR ðŸ’¥', err);
      // 2) Send generic message
      return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  
    // B) RENDERED WEBSITE
    // A) Operational, trusted error: send message to client
    if(err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: ErrorEvent.message
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR ðŸ’¥', err);
    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.'
    });
  };//main





 module.exports =  (err,req,res,next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'Error'

  if(process.env.NODE_ENV === 'DEVELOPMENT')
     sendErrorDev(err,req,res);
  

  else if(process.env.NODE_ENV === 'production'){
      let error = err 
         error.message = err.message
         if(error.name==='CastError') error = handleCastErrorDB(error);
         
         if(error.code===11000) error = handleDuplicateFieldsDb(error);

        if(error.name==='ValidationError') error = handleValidationErrorDB(error);

        if(error.name==='JsonWebTokenError') error = handleJWTError()
         
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredError()
    
          sendErrorProd(error,res)
 }

  
}//main method