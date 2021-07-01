const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')


const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour must have 40 or less charecters'],
        minlength: [10, 'A tour must have 10 or less charecters'],
        // validate: [validator.isAlpha,'the name should not contain any number']
    },
    slug: {
        type: String
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size ']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty '],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either easy , medium or hard'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be 1 or above'],
        max: [5, 'Rating must be less than 5'],
        //set function will run every time a new value is saved
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                //this only points to current document on new document creation
                return val < this.price
            },
            message: 'Discount price ({VALUE}) should be less than price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    image: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false,
        select: false
    },
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type:{
                type:String,
                default:"Point"
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],

    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]//guides
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.index({ location: '2dsphere' })


tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

//////////////DOCUMENT MIDDLEWARE///////////// runs before save() and create() 

tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next();
})

//////EMBEDDING/////
// tourSchema.pre('save', async  function(next){
//  const guidesPromise = this.guides.map( async id => await User.findById(id))
//       this.guides = await Promise.all(guidesPromise);
//     next();
// })


//////////////////QUERY MIDDLEWARE//////////////////////

tourSchema.pre(/^find/, function (next) {
    //this keyword will point at the current query
    this.find({ secretTour: { $ne: true } })
    this.start = Date.now()
    next();
})

tourSchema.pre(/^find/, function (next) {
    ////in query middleware this always points to the current query
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    })
    
    next();
})


tourSchema.post(/^find/, function (docs, next) {
    console.log("took", Date.now() - this.start, " milliseconds")
    next();
})



///////////////AGGERATION MIDDLEWARE//////////////////////

// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//     console.log(this.pipeline())
//     next()
// })

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour