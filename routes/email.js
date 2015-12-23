var express = require('express');
var router = express.Router();
var Q = require('q');
var mongoose = require('mongoose');

var Todo = require('../models/todo').Todo;
var EmailAction = require('../models/emailAction').EmailAction;

mongoose.Promise = Q.Promise;

// http://localhost:3000/email/todo/{todoId}/{token}/{action}
function validateToken(token) {
  var deferred = Q.defer();

  // check for token and expires.
  var nowTimestamp = Date.now()
  EmailAction.find({ $and: [{token: token }, {expires: { $lt: nowTimestamp } }] }).then(function(actions, err) {
    if(err)
      deferred.reject();
    if(actions == undefined) {
      deferred.resolve(false);
    } else {
      deferred.resolve(true);
    }
  });

  return deferred.promise;
}

// Update todo item.
function updateTodo(todoId, action) {
  var deferred = Q.defer();
  var todoObjectId = new mongoose.Types.ObjectId(todoId);
  var promise;
  var newTime = new Date((Date.now() + 864000000));

  if(action == 'close') {
    var stat = 'closed';
    promise = Todo.update({ _id: todoObjectId }, { stat: stat });
  } else if(action == 'postpone') {
    promise = Todo.update({ _id: todoObjectId }, { due_time: newTime });
  }

  promise.then(function() {
    deferred.resolve();
  }).catch(function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
}

// Handle user actions from email
router.get('/todo/:todoId/:token/:action', function(req, res) {
  var todoId = req.params.todoId;
  var token = req.params.token;
  var action = req.params.action;

  validateToken(token).then(function(status) {
    if(status) {
      updateTodo(todoId, action).then(function() {
        res.send('success');
      }).catch(function() {
        res.send('failed. Please try again later');
      });
    }
  });
});

module.exports = router;