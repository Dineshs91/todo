var express = require('express');
var http = require('http');
var router = express.Router();
var Q = require('q');

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
      deferred.refect(err);
    })
  }).end();

  return deferred.promise;
}

var saveTodo = function(req) {
  var content = req.body.content;
  var due_time = req.body.time;
  
  var TodoItem = new Todo({
    user: req.user.id,
    content: content,
    due_time: due_time,
    stat: 'progress'
  });
  
  TodoItem.save().then(function(todo) {
    //done
  });
};

var updatePlace = function(req) {
  var deferred = Q.defer();
  var place = req.body.place;

  User.update({ email: req.user.email }, { place: place }, function(err, user) {
    if(err)
      return handleError(err);
    deferred.resolve();
  });

  return deferred.promise;
};

router.get('/', isLoggedIn, function(req, res, next) {
  var ip = req.connection.remoteAddress;

  User.findOne({ email: req.user.email }).then(function(user) {
    if(user && !('place' in user)) {
      getLocation(ip).then(function(place) {
        User.update({ email: req.user.email }, { place: place }, function(err, user) {
          if(err)
            return handleError(err);
        });
      });
     }
     return Todo.find({ user: req.user.id });
   }).then(function(todos) {
    res.render('todo', {
      user: req.user,
      todos: todos
    });
  });
});

//Handle adding a todo
router.post('/add', isLoggedIn, function(req, res, next) {
  saveTodo(req);

  Todo.find({ user: req.user.id }).then(function(todos) {
    res.json({'todos': todos});
  });
});

router.post('/place', isLoggedIn, function(req, res, next) {
  updatePlace(req).then(function() {
    res.json({'status': 'success'});
  });
});

module.exports = router;