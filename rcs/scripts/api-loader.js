/* ******************************************
* api-loader.js
* Remote Content Server (RCS)
* Copyright (c) Saba Software, Inc.
* All Rights Reserved
* Company Confidential
******************************************* */

var scorm_api_files = [
	"api.js"
];		

var loadSCORMAPI = function (callback) { 
	try {
		var head = document.getElementsByTagName( 'head' )[ 0 ];
		for (var i = scorm_api_files.length-1; i >= 0 ; i--) {			
			var file_to_load = scorm_api_files[i];
			var s = document.createElement( 'script' );
			var assetsHost = "/assets/content/";

			s.type = 'text/javascript';
			s.async = false;

			//console.log(file_to_load);
			//s.src = unescape(QueryString("lms_url"))+ assetsHost + file_to_load;
			s.src = document.location.href.substr(0, document.location.href.indexOf('/scorm_frame.html')+1) + file_to_load;
			head.appendChild( s );
		}
		if (callback) {
			callback();
		}
	} catch (e) { 
		//console.log(e);
	}
};

var SCORMAPIFramelaunchSco = function() {
	try{
		var url = unescape(QueryString("sco_url"));
		var scoFrame = parent.frames.sco;
		parent.frames.sco.document.location.href=unescape(QueryString("sco_url"));
	}
	catch(e){
		//console.log(e);
	}
};

//terminateContent() is called from scorm_frame.html's unload event (attribute) handler.
function terminateContent() {
	var adapter = parent.API;
	adapter && adapter.LMSFinish('');
}

//start() is called from scorm_frame.html's onload event (attribute) handler.
function start(){
	//debugger;
	/*--- adding RCS version window reference ---*/
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4) {
			if(xhttp.status == 200){
				window.rcsVersion = xhttp.responseText.substr(xhttp.responseText.indexOf('Version: ')+9, 4);
			} else {
				window.rcsVersion = "unknown";
			}
		}
	};
	xhttp.open("GET", "changelog.txt", true);
	xhttp.send();

	//console.log('loading SCORMAPI');
	//loadSCORMAPI(SCORMAPIFramelaunchSco);
	 
	// Calling this without the callback because 
	// we want to call SCORMAPIFramelaunchSco
	// only after the certificate has been loaded.
	// changed at 9:50 AM 7/11/2014 by kkaisare
	loadSCORMAPI();
}