
var OPENVRI_EMBED = {}; // namespace

OPENVRI_EMBED.site = 'http://openvri.com:1337';

OPENVRI_EMBED.partial;

OPENVRI_EMBED.loadDependencies = function() {

  var body = document.getElementsByTagName('body')[0];
  if (jQuery === undefined) {

    var jquery = document.createElement('script');
    jquery.setAttribute('type', 'text/javascript');
    jquery.setAttribute('src', 'http://code.jquery.com/jquery-1.9.1.js');
    body.appendChild(jquery);
  }


  if (jQuery.ui === undefined) {
    var jqueryUI = document.createElement('script');
    jqueryUI.setAttribute('type', 'text/javascript');
    jqueryUI.setAttribute('src', 'http://code.jquery.com/ui/1.10.3/jquery-ui.js');
    body.appendChild(jqueryUI);
  }


  if (true) {
    var socketIO = document.createElement('script');
    socketIO.setAttribute('type', 'text/javascript');
    socketIO.setAttribute('src', '//cdnjs.cloudflare.com/ajax/libs/socket.io/0.9.16/socket.io.min.js');
    body.appendChild(socketIO);
  }

}

OPENVRI_EMBED.loadStylesheets = function() {
  var stylesheets = [OPENVRI_EMBED.site+'/stylesheets/style.css', OPENVRI_EMBED.site+'/stylesheets/jquery-ui-1.10.3.custom/css/openvri-theme/jquery-ui-1.10.3.custom.min.css'];

  for (var i = 0; i < stylesheets.length; i++) {
    $('head').append('<link rel="stylesheet" type="text/css" href="' + stylesheets[i] + '" />');
  }
}


OPENVRI_EMBED.loadScripts = function(callback) {
  if(callback === undefined) callback = function() {};

  var wait = function() {
    if (typeof jQuery == 'undefined' || typeof io == 'undefined' || typeof jQuery.ui == 'undefined') {
      setTimeout(wait, 10);
    } else {
      var scripts = [OPENVRI_EMBED.site+'/javascripts/adapter.js', OPENVRI_EMBED.site+'/javascripts/chat.js', OPENVRI_EMBED.site+'/javascripts/chat_ui.js'];

      for (var i = 0; i < scripts.length; i++) {
        $('body').append('<script type="text/javascript" src="'+scripts[i]+'"></script>');
      }

    callback();
    }
  };


  wait();
}

OPENVRI_EMBED.loadPartial = function(callback) {
  $.ajax({
          type: 'GET',
          url: OPENVRI_EMBED.site + '/partial_embed'
  }).done(function(html) {
    OPENVRI_EMBED.partial = html;
    return callback(null);

  }).fail(function() {
    return callback('err');
  });
}

OPENVRI_EMBED.loadButton = function(callback) {
  if (callback === undefined) callback = function() {};
  OPENVRI_EMBED.loadPartial(function(err) {
    if (!err) {
      $('#_openvri_content').html(OPENVRI_EMBED.partial);
    } else {
      $('#_openvri_content').text('Cannot retrieve data from server. Please contact us at contact@openhack.net for resolution.');
    }

    callback();

  });
}

OPENVRI_EMBED.loadDependencies();
OPENVRI_EMBED.loadStylesheets();
OPENVRI_EMBED.loadButton(function() {
  console.log($('#_openvri_content').html());
  OPENVRI_EMBED.loadScripts(function() {
    $('#_openvri_content').show();
  });
});
