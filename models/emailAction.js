var mongoose = require('mongoose');

var EmailActionSchema = new mongoose.Schema({
  email: String,
  token: String,
  created: Date,
  expires: Date
});

var EmailAction = mongoose.model('EmailAction', EmailActionSchema);

module.exports = {
	EmailAction: EmailAction
}