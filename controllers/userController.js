const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory')
const multer = require('multer')
const sharp = require('sharp')
  
// const multerStorage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'public/img/users')
//     },
//     filename:(req,file,cb)=>{
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// })
 const multerStorage  = multer.memoryStorage();

//to check the uploaded file is an image
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

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto =catchAsync( async (req,res,next)=>{
   if(!req.file) 
    return next()

     req.file.filename =`user-${req.user.id}-${Date.now()}.jpeg`;

   await sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({quality:90})
        .toFile(`public/img/users/${req.file.filename}`)
        
        next();
})


const filteredObj  = (obj, ...allowedField) =>{
     const newObj = {};
     Object.keys(obj).forEach(el=>{
          if(allowedField.includes(el)) {
              newObj[el] = obj[el]
            }
     })
     return newObj
}

exports.getMe =(req,res,next)=>{
     req.params.id = req.user.id;
     next();    
}


exports.updateMe = catchAsync( async (req,res,next)=>{
   
    if(req.body.password || req.body.confirmPassword) 
    return next(new AppError('this route is not for update password',400))
      
    const filteredBody = filteredObj(req.body,'name','email')
      if(req.file) filteredBody.photo = req.file.filename  
      const user = await User.findByIdAndUpdate(req.user.id , filteredBody, 
        {
            new:true , 
            runValidators:true
        });
    
    res.status(201).json({
        status:'success',
        data:{
            user
        }
    })
})


exports.deleteMe = catchAsync(async(req,res,next)=>{
    await  User.findByIdAndDelete(req.user.id, {active:false})

    res.status(201).json({
        status:'success',
        data:"deleted"
    })
})
 
exports.createUser = (req,res)=>{
    res.status(500).json({
        status:'Error',
        message:'The route is not yet defined'
    })
}


exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User) 
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
