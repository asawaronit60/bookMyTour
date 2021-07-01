const path = require('path')
const express  = require('express');
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const hetmet  = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorcontroller')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const viewRouter = require('./routes/viewRoutes')
const reviewRouter = require('./routes/reviewRoutes')

const app  = express();

app.set('view engine','pug')
app.set('views' , path.join(__dirname,'views'))

                              ////////////MIDDLEWARE/////////
app.use(cookieParser())

 //serving static files
 app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended:true , limit:'10kb'}))

//set security http headers
app.use(hetmet())

//development environment
if(process.env.NODE_ENV==='DEVELOPMENT'){
app.use(morgan('dev'))
}

//rate limiter
const limiter  = rateLimit({
  max:100,
  windowMs:60*60*1000,
  message:'Too many request from this IP ,please try in an hour!'
})
 app.use('/api',limiter)

///for body parser , reading data from user
app.use(express.json( {limit:'10kb'} ))

 //data sanitization agains no sql query injection
app.use(mongoSanitize())

 //data sanitization agains XSS
app.use(xss())

// prevent parameter pollution
app.use(hpp({
  whitelist:['duration','ratingsQuantity' ,'ratingsAverage' ,'maxGroupSize','difficulty','price']
}))  
  
//cdn middleware
app.use(function(req, res, next) { 
  res.setHeader( 'Content-Security-Policy', "script-src 'self' https://cdnjs.cloudflare.com" ); 
  next();
})


//test middleware
app.use((req,res,next)=>{
    req.requestTime =  new Date().toISOString();
    next();
})
   
                             ///////////////ROUTES/////////
app.use('/',viewRouter)
app.use('/api/v1/tours',tourRouter)
app.use('/api/v1/users',userRouter)
app.use('/api/v1/reviews',reviewRouter)


app.all('*',(req,res,next)=>{
//    const err = new Error( `can't find ${req.originalUrl} on the server`)
//    err.status = 'Fail'
//    err.statusCode  = 404
  next(new AppError(`can't find ${req.originalUrl} on the server`, 404)) 
})

///Error handling middlware->Express automatically recognizes this as an error 
   /// handling middleware and execute it whenever there is an error///
// app.use((err,req,req,next)=>{
// })
//OR
app.use(globalErrorHandler)

///////////////START/////////////
module.exports = app;