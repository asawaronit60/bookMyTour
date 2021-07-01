const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt  = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please tell us your name']
    },
    email:{
        type:String,
        required:[true,'Please provide your email'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a valid email']
    },
    photo:{
        type:String,
        default:'default.jpg'
      },
    role:{
       type:String,
       enum: ['admin', 'guide', 'lead-guide', 'user'],
       default:'user'
    },
    password:{
        type:String,
        required:[true,'Provide a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        validate:{
            //works on save and create!!
            validator:function(el){
                return el===this.password
            },
            message:' Opps! Password do not match'
        }
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
})


userSchema.pre('save',function(next){
    if(!this.isModified || this.isNew) return next();
     this.passwordChangedAt = Date.now() -1000; 
    next()
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) 
      return next()

  this.password = await bcrypt.hash(this.password,12)
  this.passwordConfirm = undefined
  next()
})
 
userSchema.pre(/^find/,function(next){
     //this points to the query in this
       this.find({active: {$ne :false}})
       next();
})


///INSTANCE METHOD///
userSchema.methods.correctPassword = async function(candidatePassword,userpassword){
    return await bcrypt.compare(candidatePassword,userpassword)
}


userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){
    //this points to current document
   if(this.passwordChangedAt){
       const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() /1000)
    
       return JWTTimeStamp < changedTimeStamp
   }
    return false;
}


userSchema.methods.createPasswordResetToken = function(){
    const resetToken  = crypto.randomBytes(32).toString('hex')

   this.passwordResetToken =crypto.createHash('sha256').update(resetToken).digest('hex')
   this.passwordResetExpires  = Date.now() +10*60*1000;
    // console.log({resetToken} , this.passwordResetToken)
    
   return resetToken;
}


const User = mongoose.model('User',userSchema)

module.exports = User