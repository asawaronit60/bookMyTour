const mongoose = require('mongoose');
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'A tour must have a review']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'A review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A review must belong to a user']
    }
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    })



reviewSchema.index({tour:1, user:1} , {unique:true}) 

reviewSchema.pre(/^find/, function (next) {
  this.populate({
        path: 'user'
        ,
        select: 'name photo'
    })
    next();
})


reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ])

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].nRating,
            ratingsQuantity: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 0,
            ratingsQuantity: 4.5
        })
    }
}

reviewSchema.post('save', function (doc, next) {
    //this points to the current review
    this.constructor.calcAverageRatings(this.tour)
    next();
})


///deleting and updating a review////
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();
    next();
})

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
    await this.r.constructor.calcAverageRatings(this.r.tour)
    next()
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review




/*
let str =  Pulvinar taciti etiam aenean lacinia natoque interdum fringilla suspendisse nam sapien urna!
            str = str.replace(" ","") ;
*/