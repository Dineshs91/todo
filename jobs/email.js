var mongoose = require('mongoose');
var crypto = require('crypto');
var Q = require('q');
var nodemailer = require('nodemailer');

var Todo = require('../models/todo.js').Todo;
var User = require('../models/user.js').User;
var EmailAction = require('../models/emailAction.js').EmailAction;

var config = require('../config').config;

mongoose.connect('mongodb://localhost/tododb1');
mongoose.Promise = Q.Promise;

function fetchEndingTodos() {
  var deferred = Q.defer();
  // Query with due date.
  // Get all todos with status='progress' and due date between now and now + 60s
  var nowTimestamp = Date.now();
  var futureTimestamp = new Date((nowTimestamp + 3600000));
  Todo.find({ $and: [ {stat: { $ne: 'closed' } }, {due_time: { $gt: nowTimestamp, $lt: futureTimestamp }} ] })
  .populate('user')
  .then(function(todos) {
    deferred.resolve(todos);
  }).catch(function(err) {
    deferred.reject(err);
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
    todo_id: todoId,
    token: token,
    created: nowTimestamp,
    expires: new Date((nowTimestamp + 3600000))
  });

  // Persist email token in db.
  emailAction.save().then(function(mail) {
    var closeUrl = constructUrl(todoId, token, 'close');
    var postponeUrl = constructUrl(todoId, token, 'postpone');

    return sendMail(todo, closeUrl, postponeUrl);
  }).then(function() {
    deferred.resolve();
  }).catch(function(err) {
    console.log('[prepareMail]' + err);
    deferred.reject(err);
  });

  return deferred.promise;
}

function constructUrl(todoId, token, action) {
  var url = 'http://localhost:3000/email/todo/' +  todoId + '/' + token + '/' + action;
  return url;
}

function sendMail(todo, closeUrl, postponeUrl) {
  var email = todo.user.email;
  var todoContent = todo.content;
  var dueTime = todo.due_time;

  //send mail.
  var deferred = Q.defer();
  // Start nodemailer code.
  // Create transporter.
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: config.GMAIL_USER,
      pass: config.GMAIL_PASSWORD
    }
  });

  var mailOptions = {
    from: config.GMAIL_USER,
    to: email,
    subject: 'Your todo is nearing due time. Please take action',
    html: '<h2>Todo</h2>' +
          'Todo: <h4>' + todoContent + '</h4> is nearing its due time <strong>' + dueTime + '</strong>&nbsp;' +
          '<a href=' + closeUrl + '>close</a>&nbsp;' +
          '<a href=' + postponeUrl + '>postpone</a>&nbsp;'
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if(err)
      deferred.reject(err);
    deferred.resolve();
  });

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

  Q.all(prepareMailPromises).then(function() {
    deferred.resolve();
  }).catch(function(err) {
    console.log("Something went wrong when generating token [" + err + "]");
    deferred.reject();
  });

  return deferred.promise;
}

function start() {
  fetchEndingTodos().then(function(todos) {
    return prepareAndSendEmail(todos);
  }).catch(function(err) {
    console.log('[start]' + err);
  }).fin(function() {
    mongoose.connection.close();
  })
}

start();