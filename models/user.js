var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema ({
  email: {
    type: String,
    index: true
  },
  password_hash: String,
  auth_method: String,
  profile_id: String,
  access_token: String,
  refresh_token: String,
  timestamp: Date
});

var User = mongoose.model('User', UserSchema);

module.exports = {
  User: User
}