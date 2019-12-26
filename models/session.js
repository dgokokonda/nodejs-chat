const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    session:{
        type: String
    },
    expires:{
        type: Date
    }
});

module.exports = mongoose.model('Session', schema);