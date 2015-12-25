var express = require('express');
var http = require('http');
var router = express.Router();
var Q = require('q');
var mongoose = require('mongoose');

mongoose.promise = Q.promise;

var User = require('../models/user').User;
var Todo = require('../models/todo').Todo;

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated())
    return next();
  
  res.redirect('/login');
}

function getLocation(ip) {
  if(ip == '::1')
      ip = '49.207.189.50';

  var deferred = Q.defer();

  http.request('http://freegeoip.net/json/' + ip, function(response) {
    response.on('data', function(chunk) {
      res = JSON.parse(chunk);
      city = res.city;

      deferred.resolve(city);
    });

    response.on('error', function(err) {
      deferred.reject(err);
    })
  }).end();

  return deferred.promise;
}

var saveTodo = function(req) {
  var deferred = Q.defer();

  var content = req.body.content;
  var due_time = new Date(req.body.time);
  var location = req.body.location;

  var TodoItem = new Todo({
    user: req.user.id,
    content: content,
    location: location,
    due_time: due_time,
    stat: 'progress'
  });
  
  TodoItem.save().then(function(todo) {
    deferred.resolve();
  }).catch(function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

router.get('/', isLoggedIn, function(req, res, next) {
  var ip = req.connection.remoteAddress;
  var location = '';

  getLocation(ip).then(function(place) {
    location = place;
    return Todo.find({ user: req.user.id });
   }).then(function(todos) {
    res.render('todo', {
      user: req.user,
      todos: todos,
      location: location
    });
  }).catch(function(err) {
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
});

//Handle adding a todo
router.post('/add', isLoggedIn, function(req, res, next) {
  saveTodo(req).then(function() {
    return Todo.find({ user: req.user.id });
  }).then(function(todos) {
    res.json({'todos': todos});
  }).catch(function(err) {
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
});

module.exports = router;