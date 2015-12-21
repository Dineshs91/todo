$(function() {
  $('#datetimepicker').datetimepicker();

  $('[name="todoForm"]').submit(function() {
    validateTodo();
    return false;
  });
});

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
  
  showMessage(msg);
}

// Ajax call to /todo/add
function saveTodo(content, time) {
  $.post('/todo/add', {content: content, time: time})
  .done(function(data) {
    $('#addModal').modal('hide');
    
    clearTodoForm();
    appendTodo(data);
  }).fail(function(err) {
    showMessage('Failed to save todo. Please try again.');
  })
}

function clearTodoForm() {
  var content = $('#todo-content').val('');
  var time = $('#datetimepicker').val('');
}

function appendTodo(data) {
  var todos = data.todos;
  var newTodo = todos[todos.length - 1];
  
  var ele = '<li class="list-group-item">' + newTodo.content + ' - ' + Date.parse(newTodo.due_time) + ' - ' + newTodo.stat + '</li>';
  $('ul.list-group').append(ele);
}

function showMessage(msg) {
  $('.todo-add.message').text(msg);
}

function isEmpty(val) {
  val = val.trim();
  if(val == null || val == undefined || val.length == 0)
    return true;
  return false;
}