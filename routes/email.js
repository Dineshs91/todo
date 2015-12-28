var express = require('express');
var router = express.Router();
var Q = require('q');
var mongoose = require('mongoose');
ObjectId = mongoose.Types.ObjectId;

var Todo = require('../models/todo').Todo;
var EmailAction = require('../models/emailAction').EmailAction;

mongoose.Promise = Q.Promise;

// http://localhost:3000/email/todo/{todoId}/{token}/{action}
/*
  Validation:
    - todoId
    - token
    - expires
*/
function validateToken(todoId, token) {
  var deferred = Q.defer();

  // check for token and expires.
  var nowTimestamp = Date.now()
  EmailAction.find({ $and: [ {todo_id: todoId}, {token: token}, {expires: { $lt: nowTimestamp } },
  ] }).then(function(actions) {
    if(actions == undefined) {
      deferred.reject();
    } else {
      deferred.resolve(true);
    }
  }).catch(function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
}

/*
  Validation:
    - todo should not be closed.
*/
function validateTodo(todoId) {
  var deferred = Q.defer();

  var todoObjectId = ObjectId(todoId);
  Todo.find({ $and: [ { _id: todoObjectId }, {stat: { $ne: 'closed' }} ]}).then(function(todos) {
    if(todos === undefined || todos.length === 0) {
      deferred.reject();
    }
    deferred.resolve(true);
  }).catch(function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
}

// Update todo item.
function updateTodo(todoId, action) {
  var deferred = Q.defer();
  var todoObjectId = ObjectId(todoId);
  var promise;
  var newTime = new Date((Date.now() + 86400000));

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

  validateToken(todoId, token).then(function(status) {
    return validateTodo(todoId);
  }).then(function(status) {
    if(status) {
      return updateTodo(todoId, action);
    }
  }).then(function() {
    res.render('email_action', {
      message: 'Action completed successfully.'
    });
  }).catch(function() {
    res.render('email_action', {
      message: 'Failed. Please try again later.'
    });
  });
});

module.exports = router;