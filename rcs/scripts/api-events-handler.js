/* ******************************************
* api-events-handler.js
* Remote Content Server (RCS)
* Copyright (c) Saba Software, Inc.
* All Rights Reserved
* Company Confidential
******************************************* */

var // References for the SCORM API object
API = null,
API_1484_11 = null;


// The postmessaging api is being used to allow cross domain communication
// between the frame and its parent when the frame is being loaded from a remote
// content server.
//
// This is a proof of concept; we first attempt to replace the current
// functioning with a postmessaging alternative. This then will be tested
// against a true remote content server. If it works, we attempt to
// differentiate between the two approaches as needed.

// var targetWindow = (window != window.parent)? window.parent : window.opener;
// Consider either this window is opened in new-window (window.opener) or in an inline iframe (window.parent).
var targetWindow = window.opener ? window.opener : window.parent;
var sabaCertificate = QueryString("remote_content_cert");


var shell = function () {
    var
        url = unescape(QueryString("lms_url")),
        parent = this.parent || this.opener,
        messageType = {
            NAVIGATE: 'navigate',
            LOG: 'log',
            RECORD: 'record',
            ERROR: 'error',
            REGISTER_LISTENER: 'registerListener',
            SEND_SABA_CERTIFICATE: 'sabaCertificate'
        };

    return {
        navigate: function (request, source) {
            var messageToSend = {
                messageType: messageType.NAVIGATE,
                requestData: request,
                sourceData: source
            };
            messageToSend = JSON.stringify(messageToSend);
            try {
                targetWindow.postMessage(messageToSend, url);    
            } catch (e) {
                console.log('error occured while using postMessage method' + e);
            }   
        },

        log: function (command) {
            var messageToSend = {
                messageType: messageType.LOG,
                commandData: command
            };
            messageToSend = JSON.stringify(messageToSend);
            try {
                targetWindow.postMessage(messageToSend, url);    
            } catch (e) {
                console.log('error occured while using postMessage method' + e);
            }
        },

        record: function (command) {
            var messageToSend = {
                messageType: messageType.RECORD,
                commandData: command
            };
            messageToSend = JSON.stringify(messageToSend);
            try {
                targetWindow.postMessage(messageToSend, url);    
            } catch (e) {
                console.log('error occured while using postMessage method' + e);
            }
        },

        error: function (error) {
            var messageToSend = {
                messageType: messageType.ERROR,
                errorData: error
            };
            messageToSend = JSON.stringify(messageToSend);
            try {
                targetWindow.postMessage(messageToSend, url);    
            } catch (e) {
                console.log('error occured while using postMessage method' + e);
            }
        },

        registerListener: function () {
            var messageToSend = {
                messageType: messageType.REGISTER_LISTENER,
                urlToUse: window.document.referrer
            };
            messageToSend = JSON.stringify(messageToSend);
            try {
                targetWindow.postMessage(messageToSend, url);    
            } catch (e) {
                console.log('error occured while using postMessage method' + e);
            }
        }
    };
}();

var
    receiveMessage = function (event) {
        var eventData;
        try {
            eventData = JSON.parse(event.data);
        } catch (e) {
            // Event data is not in json format
            eventData = event.data;
        }
        
        if (eventData.messageType === 'unloadContent') {
            return;
            /*shell.originator = originator;
            var absolutePart = window.location.href.replace(/remote_frameset.html.*$/g, '');
            if(frames.sco) {
                frames.sco.location = absolutePart + 'unload_content.html';
            }*/
        }
        
        if (eventData.messageType === 'certificate') {
            sabaCertificate =eventData.certificate;
        }
    };

if (window.addEventListener) {
    window.addEventListener("message", receiveMessage, false);
} else {
    window.attachEvent("onmessage", receiveMessage);
}

var parentWindow = null;
var isModernPlayer = null;
var isLXP = null;
try {
    parentWindow = window.opener ? window.opener.top : window.top;
    isModernPlayer = parentWindow.location.href.indexOf('/app/content-player') > -1;
    isLXP = parentWindow.location.href.indexOf('/app/lxp') > -1;
} catch (e) {
    // unable to access parent window due to CORS issue (cross domains)
}

if (!(isModernPlayer || isLXP)) { // This override methods are not required for Modern Player.
    // var inlineMode = (opener && opener.Player) ? false : true;
    var inlineMode = (window != window.parent);
    // var inlineMode = false;
    if (inlineMode) {
        shell.registerListener();
        try {
            top.close = function(native) {
                return function() {
                    if (shell && shell.navigate) {
                        shell.navigate('exit', 'content');
                    }
                    return false;
                };
            } (top.close);
        } catch(e) {
            // top.close() override not supported by browser
        }

        try {
            parent.close = function(native) {
                return function() {
                    if (shell && shell.navigate) {
                        shell.navigate('exit', 'content');
                    }
                    return false;
                };
            } (parent.close);
        } catch(e) {
            // parent.close() override not supported by browser
        }

        try {
            window.close = function(native) {
                return function() {
                    if (shell && shell.navigate) {
                        shell.navigate('exit', 'content');
                    }
                    return false;
                };
            } (window.close);
        } catch(e) {
            // window.close() override not supported by browser
        }
    }
}
