$(function() {
  $('#datetimepicker').datetimepicker({
    format: 'MM dd, yyyy hh:ii:ss',
    showMeridian: true,
    autoclose: true
  });

  $('[name="todoForm"]').submit(function() {
    validateTodo();
    return false;
  });

  $('.place-update').click(function() {
    updateLocation();
  });
});

function updateLocation() {
  var place = $('.user-place').val();

  $.post('/todo/place', {place: place})
  .done(function(data) {
    showLocationMessage('Location updated successfully');
  }).fail(function(err) {
    showLocationMessage('Something went wrong. Please try again');
  });
}

function validateTodo() {
  var content = $('#todo-content').val();
  var time = $('#datetimepicker').val();
  
  if(!isEmpty(content) && !isEmpty(time)) {
    saveTodo(content, time);
  }
  
  var msg = '';
  if(isEmpty(content)) {
    msg = msg + 'Empty content. ';
  }
  
  if(isEmpty(time)) {
    msg = msg + 'Choose a due time. ';
  }
  
  showMessageInAddModal(msg);
}

// Ajax call to /todo/add
function saveTodo(content, time) {
  $.post('/todo/add', {content: content, time: time})
  .done(function(data) {
    $('#addModal').modal('hide');

    clearAddTodoForm();
    appendTodo(data);
  }).fail(function(err) {
    showMessageInAddModal('Failed to save todo. Please try again.');
  })
}

function clearAddTodoForm() {
  var content = $('#todo-content').val('');
  var time = $('#datetimepicker').val('');
  showMessageInAddModal('');
}

function appendTodo(data) {
  var todos = data.todos;
  if(todos.constructor === Array) {
    var newTodo = todos[todos.length - 1];
  } else {
    var newTodo = todos;
  }
  
  var ele = '<li class="list-group-item">' + newTodo.content + ' - ' + new Date(newTodo.due_time) + ' - ' + newTodo.stat + '</li>';
  $('ul.list-group').append(ele);
}

function showLocationMessage(msg) {
  $('.location-message.message').text(msg);
}

function showMessageInAddModal(msg) {
  $('.todo-add.message').text(msg);
}

function isEmpty(val) {
  val = val.trim();
  if(val == null || val == undefined || val.length == 0)
    return true;
  return false;
}