
var OPENVRI_EMBED = {}; // namespace

OPENVRI_EMBED.site = 'http://embed.openvri.com';

OPENVRI_EMBED.partial;

OPENVRI_EMBED.loadDependencies = function() {

  var body = document.getElementsByTagName('body')[0];
  console.log(body);
  if (typeof jQuery == 'undefined') {

    var jquery = document.createElement('script');
    jquery.setAttribute('type', 'text/javascript');
    jquery.setAttribute('src', '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js');
    body.appendChild(jquery);
  }


  if (typeof jQuery == 'undefined' || typeof jQuery.ui == 'undefined') {

    var wait = function() {
      if (typeof jQuery == 'undefined') {
        setTimeout(wait, 10);
      } else {
        var jqueryUI = document.createElement('script');
        jqueryUI.setAttribute('type', 'text/javascript');
        jqueryUI.setAttribute('src', '//ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js');

        body.appendChild(jqueryUI);

      }
    };

    wait();
  }


  if (true) {
    var socketIO = document.createElement('script');
    socketIO.setAttribute('type', 'text/javascript');
    socketIO.setAttribute('src', OPENVRI_EMBED.site+'/socket.io/socket.io.js');
    body.appendChild(socketIO);
  }

}

OPENVRI_EMBED.loadStylesheets = function() {
  var stylesheets = [OPENVRI_EMBED.site+'/stylesheets/style.css', OPENVRI_EMBED.site+'/stylesheets/jquery-ui-1.10.3.custom/css/openvri-theme/jquery-ui-1.10.3.custom.min.css'];

  for (var i = 0; i < stylesheets.length; i++) {
    jQuery('head').append('<link rel="stylesheet" type="text/css" href="' + stylesheets[i] + '" />');
  }
}


OPENVRI_EMBED.loadScripts = function() {

  var scripts = [OPENVRI_EMBED.site+'/javascripts/adapter.js', OPENVRI_EMBED.site+'/javascripts/chat.js', OPENVRI_EMBED.site+'/javascripts/chat_ui.js'];

  for (var i = 0; i < scripts.length; i++) {
    jQuery('body').append('<script type="text/javascript" src="'+scripts[i]+'"></script>');
  }

}

OPENVRI_EMBED.loadPartial = function(callback) {
  jQuery.ajax({
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
      jQuery('#_openvri_content').html(OPENVRI_EMBED.partial);
    } else {
      jQuery('#_openvri_content').text('Cannot retrieve data from server. Please contact us at contact@openhack.net for resolution.');
    }
    callback();
  });

}

window.onload = function() {

  OPENVRI_EMBED.loadDependencies();

  OPENVRI_EMBED.wait = function() {

    if (typeof jQuery == 'undefined' || typeof jQuery.ui == 'undefined' || typeof io == 'undefined') {
      setTimeout(OPENVRI_EMBED.wait, 10);
    } else {
      OPENVRI_EMBED.loadStylesheets();
      OPENVRI_EMBED.loadButton(function() {
        OPENVRI_EMBED.loadScripts();
        jQuery('#_openvri_content').show();
      });
    }
  };

  OPENVRI_EMBED.wait();
};

