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

function validateTodo() {
  var content = $('#todo-content').val();
  var time = $('#datetimepicker').val();
  var location = $('#location').val();
  
  if(!isEmpty(content) && !isEmpty(time) && !isEmpty(location)) {
    saveTodo(content, time, location);
  }
  
  var msg = '';
  if(isEmpty(content)) {
    msg = msg + 'Empty content. ';
  }
  
  if(isEmpty(time)) {
    msg = msg + 'Choose a due time. ';
  }

  if(isEmpty(location)) {
    msg = msg + 'Choose a location. ';
  }
  
  showMessageInAddModal(msg);
}

// Ajax call to /todo/add
function saveTodo(content, time, location) {
  $.post('/todo/add', {content: content, time: time, location: location})
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

  var options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };

  var dateTime = new Date(newTodo.due_time);
  var ele = '<li class="list-group-item">' + newTodo.content + ' - ' + dateTime.toLocaleString('en-US', options)
            + ' - ' + newTodo.stat + ' - ' + newTodo.location + '</li>';
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