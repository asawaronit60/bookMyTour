const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const APIFeatures = require('./../utils/apiFeatures')

exports.deleteOne = (Model) => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndDelete(req.params.id)

    if (!doc) {
        return next(new AppError('No document find with this id', 404))
    }

    res.status(200).json({
        status: "success",
        data: null
    })
})


exports.updateOne = (Model) => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body,{
        new: true,
        runValidators: true
    })

    if (!doc) {
        return next(new AppError('No document found with this id', 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            data: doc
        }
    })
})

exports.createOne = (Model) => catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body)

    res.status(201).json({
        status: 'Success',
        data: {
            docCreated: newDoc
        }
    })
})


exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {

    let query = Model.findById(req.params.id)
    if (popOptions) query = query.populate(popOptions)

    const doc = await query;

    if (!doc) {
        return next(new AppError('No document found with this id', 404))
    }

    res.status(201).json({
        status: "success",
        data: {
            data: doc
        }
    })
})


exports.getAll = (Model) => catchAsync(async (req, res, next) => {

    let filter = {};
    if (req.params.tourId) filter = { refTour: req.params.tourId }

    const feature = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    const doc = await feature.query;

    ///SEND RESPONSE////
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc
        }
    })
})