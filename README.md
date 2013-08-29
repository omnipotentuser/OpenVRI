OpenVRI
=======

Video Remote Interpreting (VRI) based on WebRTC, a 3-way connection with video, audio, and texting real time

============================================================================================================

OpenVRI is based on WebRTC, and uses Node.js as the signaling channel to exchange SDP, and texting. 
You also need to include the adapter.js from Google.

A running example of the OpenVRI application can be found at openvri.com

The VRI application is meant to be installed into any web page using a one line embed div with script.

A note: The dialog jQuery UI was created from themeroller. Insert your theme in /public/stylesheets/.

In the app.js file, in order to set your own port, you need to edit the line that asks for port, as in
app.set('port', process.env.PORT || <YOUR_PORT_NUMBER>);

Then, in /public/javascripts/chat_ui.js set the SOCK_ADDR = <www.yoursite.com:port>

finally, in /public/javascripts/openvri_embed.js, set OPENVRI_EMBED.site = <www.yoursite.com:port>

