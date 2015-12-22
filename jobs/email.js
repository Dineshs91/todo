var mongoose = require('mongoose');
var crypto = require('crypto');
var Q = require('q');
var Todo = require('../models/todo.js').Todo;
var User = require('../models/user.js').User;

mongoose.connect('mongodb://localhost/tododb1');

function fetchEndingTodos() {
  var deferred = Q.defer();
  // Query with due date.
  // Get all todos with status='progress' and due date between now and now + 60s
  var nowTimestamp = Date.now();
  var futureTimestamp = new Date((nowTimestamp + 3600000));
  Todo.find({ due_time: { $gt: nowTimestamp, $lt: futureTimestamp } })
  .populate('user')
  .then(function(todos, err) {
    if(err) deferred.reject(err);
    deferred.resolve(todos);
  });

  return deferred.promise;
}

function generateToken() {
  // Generate random token
  var token = crypto.randomBytes(16).toString('hex');
  return token;
}

function constructUrl(token, action) {
  var url = 'http://localhost:3000/email/todo/' + token + '/' + action;
  return url;
}

function sendMail(email, closeUrl, postponeUrl) {
  //send mail.
}

function prepareAndSendEmail(todos) {
  for(index = 0; index < todos.length; index++) {
    // Grab the mail id.
    // Generate token.
    var todo = todos[index];
    var email = todo.user.email;
    var token = generateToken();
    // Construct url.
    var closeUrl = constructUrl(token, 'close');
    var postponeUrl = constructUrl(token, 'postpone');

    // Send mail.
    sendMail(email, closeUrl, postponeUrl);
  }
}

function start() {
  fetchEndingTodos().then(function(todos) {
    prepareAndSendEmail(todos);
  }).catch(function(err) {
    console.log(err);
  }).fin(function() {
    mongoose.connection.close();
  })
}

start();