$(function() {
  $('[name="loginForm"]').submit(function() {
    var email = $('#login-email').val();
    var password = $('#login-password').val();
    return validateForm(email, password);
  });
  
  $('[name="signupForm"]').submit(function() {
    var email = $('#signup-email').val();
    var password = $('#signup-password').val();
    return validateForm(email, password);
  });

  selectTab();
  
  // Remove any error messages when other tab
  // is clicked.
  $('#my-tabs').click(function() {
    displayMessage('');
  });
});

function selectTab() {
  var pathname = window.location.pathname;
  if(pathname.indexOf('signup') > -1) {
    $('#my-tabs a[href="#signup"]').tab('show');
  } else {
    $('#my-tabs a[href="#login"]').tab('show');
  }
}

function validateForm(email, password) {
  var validEmail = validateEmail(email);
  var validPassword = validatePassword(password);
  
  if(validEmail && validPassword) {
    return true;
  }
  
  var msg = '';
  if (!validEmail) {
    msg = msg + 'Invalid email address. ';
  }
  
  if(!validPassword) {
    msg = msg + 'Invalid password. ';
  }
  
  displayMessage(msg);
  $('.message').text(msg);
  return false;
}

function displayMessage(msg) {
  $('.message').text(msg);
}

function validateEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  password = password.trim();

  if(password == null || password == undefined || password.length == 0)
    return false;
  return true;
}
