const mongoose = require('mongoose');
const { Schema } = mongoose;

const exerciseSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: String
  })
  
module.exports = mongoose.model('Exercise', exerciseSchema);