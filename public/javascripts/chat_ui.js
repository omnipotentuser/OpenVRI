
var SOCK_ADDR = '' ; // your socket.io address goes here

jQuery(function() {
  var pageCounter = 1;
  var dialog_width = 520;
  var rtc_engine = new RTCEngine();
  var roomName = "";
  var localId = null;


  var shiftKeyCode = {'192':'126', '49':'33', '50':'64', '51':'35', '52':'36', '53':'37', '54':'94', '55':'38', '56':'42', '57':'40', '48':'41', '189':'95', '187':'43', '219':'123', '221':'125', '220':'124', '186':'58', '222':'34', '188':'60', '190':'62', '191':'63'};
  var specialCharCode = {'8':'8', '13':'13', '32':'32', '186':'58', '187':'61', '188':'44', '189':'45', '190':'46', '191':'47', '192':'96', '219':'91', '220':'92', '221':'93', '222':'39'};

  function S4 () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  function generateID () {
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
  }

  function getURL () {
    var pathArray = window.location.href.split('/');
    var protocol = pathArray[0];
    var host = pathArray[2];
    var url = protocol + '//' + host;
    for(var i = 3; i < pathArray.length; i++){
      url += '/' + pathArray[i];
    }
    return url;
  }

  function handleRTCEvents(signaler, data){
    if (signaler){
      var pid = '';
      switch (signaler){
        case 'connected':
          console.log('handleRTCEvents: %s',  'socket connected');
          rtc_engine.join({room:roomName});
          break;
        case 'id':
          localId = data.id;
          console.log('handleRTCEvents: local id %s',  localId);
          break;
        case 'create':
          pid = data.id.slice(2,-1);
          console.log('handleRTCEvents: create peer UI layout %s', pid);
          dialog_width += 492;
          jQuery('#_openvri_dialog').dialog('option', 'width', dialog_width);
          var vSrc = ""+pid;
          var mSrc = "_openvri_message-src-"+pid;
          jQuery('#_openvri_video-body')
            .append("<video id='"+vSrc+
              "' class='_openvri_video-box' autoplay='autoplay' controls='controls'>");
          jQuery('#_openvri_message-body')
            .append("<textarea id='"+mSrc+
              "' class='_openvri_messages' disabled='disabled'>");
          break;
        case 'peerDisconnect':
          pid = data.id.slice(2,-1);
          console.log('handleRTCEvents: remove peer UI layout %s', pid);
          var vSrc = "#"+pid;
          var mSrc = "#_openvri_message-src-"+pid;
          jQuery(vSrc).remove();
          jQuery(mSrc).remove();
          dialog_width -= 492;
          jQuery('#_openvri_dialog').dialog('option', 'width', dialog_width);
          break;
        case 'readbytechar':
          var fromId = data.from_id.slice(2,-1);
          var code = data.code;
          console.log('handleRTCEvents: read char code from %s, code %s', fromId, code);
          var mSrc = "#_openvri_message-src-"+fromId;
          code = String.fromCharCode(code);
          if(code == '8'){
            jQuery(mSrc).val(jQuery(mSrc).val().slice(0,-1) );
          } else {
            jQuery(mSrc).val(jQuery(mSrc).val() + code);
          }
          jQuery(mSrc).scrollTop($(mSrc)[0].scrollHeight);
          break;
        case 'info':
          console.log('handleRTCEvents: info %s', data.msg);
          break;
        case 'error':
          console.warn('handleRTCEvents: error %s', data.msg);
          break;
        default:
          break;
      }
    }
  }

  function createFirstDisplay() {
    if( jQuery('#local-video').length  == 0 ) {
	    jQuery('#_openvri_video-body')
        .append("<video id='_openvri_local-video' class='_openvri_video-box' autoplay controls muted>");
      jQuery('#_openvri_dialog').dialog('open');
    }
  }

  jQuery('#_openvri_dialog').dialog({
    autoOpen: false,
    width: dialog_width,
    height: 768,
    modal: true,
    show:{
	    effect: "clip",
	    duration:500
    },
    hide:{
	    effect:'clip',
	    duration:500
    },
    open: function (event, ui) { 
      rtc_engine.connect(handleRTCEvents);
    },
    close: function (event, ui) {
	    document.location.href='/'; 
	    //pageCounter++;
	    //window.history.pushState(pageCounter, 'VRI Lite', '/');
    }
  });

  jQuery('#_openvri_createBtn').click(function () {
    console.log('createBtn clicked');
    roomName = generateID();
    pageCounter++;
    window.history.pushState(pageCounter, 'VRI Lite', '#' + roomName);
    createFirstDisplay();
    //jQuery('#_openvri_dialog').dialog('open');
  });

  jQuery('#_openvri_hangupBtn').click(function () {
    console.log('hangupBtn clicked');
    rtc_engine.leave();
    if(jQuery('#_openvri_inviteDialog').is(':visible'))
      jQuery('#_openvri_inviteDialog').hide(500);
    jQuery("#_openvri_dialog").dialog('close');
    jQuery('#_openvri_video-src-onkdokokok,e').remove();
  });

  jQuery('#_openvri_inviteBtn').click(function() {
    console.log('inviteBtn clicked');
    document.getElementById('_openvri_urlAddr').innerHTML = getURL();
    jQuery('#_openvri_inviteDialog').toggle(1000);
  });

    jQuery('#_openvri_closeInviteBtn').click( function() {
	if(jQuery('#_openvri_inviteDialog').is(':visible'))
	    jQuery('#_openvri_inviteDialog').toggle(500);
    });

  // Not yet implemented
  jQuery('#_openvri_clipboardBtn').click( function() {
    jQuery('#_openvri_urlAddr').select();
    //var r = document.body.createTextRange();
    //var copiedText = document.getElementById('_openvri_urlAddr');
    //r.findText(copiedText.textContent);
    window.clipboardData.setData('Text', jQuery('#_openvri_urlAddr').text());
    alert(window.clipboardData.getData('Text'));
  });

  jQuery('#local-ta').on('keydown', function(e) {
    var sc = rtc_engine.sendChar;
    var code = (e.keyCode ? e.keyCode : e.which);
    //console.log(e.type, e.which, e.keyCode);

    if( code == '37' || code == '38' || code == '39' || code == '40' ){
      e.preventDefault();
      return;
    }

    if( code  != 16 ) {// ignore shift
      if( code >= 65 && code <= 90 ) {
        if(!e.shiftKey){
          code = code + 32;
        }
        sc(code, false); //if websocket, true
      } else if(e.shiftKey && (shiftKeyCode[code] !== undefined) ){
        code = shiftKeyCode[code];
        sc(code, false); //if websocket, true
	    } else if(specialCharCode[code] !== undefined){
        code = specialCharCode[code];
        sc(code, false); //if websocket, true
      } else if ( code >= 48 && code <= 57 ) {
        sc(code, false); //if websocket, true
      } else {
        console.log('keycode not accepted');
        return;
	    };
    }
  })

  jQuery(document).ready(function() {
    var hashurl = window.location.hash;
    var hashpos = hashurl.lastIndexOf('#');
    if(hashpos != -1){
	    hashurl = hashurl.substring(hashpos + 1);
    }
    if(hashpos == -1) {
      roomName = '';
    } else if ( hashurl.length == 36 ){
      roomName = hashurl;
    } else {
      roomName = '';
    }

    if(roomName != ''){
	    createFirstDisplay();
    };
    //jQuery('#_openvri_inviteURL').hide();
  });

});
