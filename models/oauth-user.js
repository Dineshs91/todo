var mongoose = require('mongoose');

var OAuthUserSchema = new mongoose.Schema({
  profile_id: String,
  email: String,
  access_token: String,
  refresh_token: String
});

var OAuthUser = mongoose.model('OAuthUser', OAuthUserSchema);

module.exports = {
  OAuthUser: OAuthUser
}