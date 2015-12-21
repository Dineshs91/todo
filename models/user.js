var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema ({
    email: {
        type: String,
        index: true
    },
    password: {
        type: String,
        index: true
    },
    place: String
});

var User = mongoose.model('User', UserSchema);

module.exports = {
    User: User
}