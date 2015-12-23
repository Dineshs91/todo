var mongoose = require('mongoose');
var crypto = require('crypto');
var Q = require('q');
require('mongoose').Promise = require('q').Promise;

var Todo = require('../models/todo.js').Todo;
var User = require('../models/user.js').User;
var EmailAction = require('../models/emailAction.js').EmailAction;

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
    if(err)
      deferred.reject(err);
    deferred.resolve(todos);
  });

  return deferred.promise;
}

function prepareMail(todo) {
  var deferred = Q.defer();

  var todoId = todo._id;
  var email = todo.user.email;

  // Generate random token.
  var token = crypto.randomBytes(16).toString('hex');
  var nowTimestamp = Date.now();
  var emailAction = new EmailAction({
    email: email,
    token: token,
    created: nowTimestamp,
    expires: new Date((nowTimestamp + 3600000))
  });

  // Persist email token in db.
  emailAction.save(function(mail, err) {
    if(err)
      deferred.reject(err);
    var closeUrl = constructUrl(todoId, token, 'close');
    var postponeUrl = constructUrl(todoId, token, 'postpone');

    return sendMail(token, closeUrl, postponeUrl);
  }).then(function() {
    deferred.resolve();
  }).catch(function(err) {
    console.log(err);
  });

  return deferred.promise;
}

function constructUrl(todoId, token, action) {
  var url = 'http://localhost:3000/email/todo/' +  todoId + '/' + token + '/' + action;
  return url;
}

function sendMail(email, closeUrl, postponeUrl) {
  //send mail.
  var deferred = Q.defer();
  console.log(email + '---->' + closeUrl);
  deferred.resolve();
  return deferred.promise;
}

function prepareAndSendEmail(todos) {
  var deferred = Q.defer();
  var prepareMailPromises = [];

  for(index = 0; index < todos.length; index++) {
    // Grab the mail id.
    var todo = todos[index];

    // Generate token.
    var prepareMailPromise = prepareMail(todo);
    prepareMailPromises.push(prepareMailPromise);
  }

  Q.all(prepareMailPromises).then(function(generatedTokenResolutions) {
    console.log(generatedTokenResolutions);
    deferred.resolve();
  }).catch(function(err) {
    console.log("Something went wrong when generating token [" + err + "]");
    deferred.reject();
  });

  return deferred.promise;
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