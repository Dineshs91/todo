var mongoose = require('mongoose');

var TodoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: String,
  due_time: Date,
  stat: String
});

var Todo = mongoose.model('Todo', TodoSchema);

module.exports = {
  Todo: Todo
}