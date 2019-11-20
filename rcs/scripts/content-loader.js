/* ******************************************
* content-loader.js
* Remote Content Server (RCS)
* Copyright (c) Saba Software, Inc.
* All Rights Reserved
* Company Confidential
******************************************* */

var
    SCORMAPIFramelaunchSco = function() {
        try {
            var url = unescape(QueryString("sco_url"));
            var scoFrame = this.frames.sco;
            this.frames.sco.document.location.href=unescape(QueryString("sco_url"));
            //SPC-80664 - Multiple Attempts doesn't get created on Panopto SCORM
            //vendorContentType values is read by api.js->commit() method to manipulate response.
            if(contentTypeVendor==='PANOPTO'){
                API.vendorContentType='PANOPTO';
            }
            
        }
        catch(e){
            //console.log(e);
        }
    },
    onSabaCertificateFound = function () {
        SCORMAPIFramelaunchSco();
    },
    showContentServerNotAvailableMessage = function () {
        // No body available to show message.
    },
    generateScormFrameset = function () {
        var sizes = "*,1";
        if (dbg == 'true') {
            sizes = "*,25%";
        }

        var scrolling = " scrolling=no ";
        if (dbg == 'true') {
            scrolling = " scrolling=auto ";
        }

        var frameset = document.createElement("frameset");
        frameset.setAttribute("name", "scormFrameset");
        frameset.setAttribute("rows", sizes);
        frameset.setAttribute("framespacing", "0");
        frameset.setAttribute("frameborder", "no");

        var scoFrame = document.createElement("frame");
        scoFrame.setAttribute("name", "sco");
        scoFrame.setAttribute("src", "loading.html");
        scoFrame.setAttribute("scrolling", "auto");
        scoFrame.setAttribute("marginwidth", "0");
        scoFrame.setAttribute("marginheight", "0");
        scoFrame.setAttribute("border", "0");
        scoFrame.setAttribute("noresize", "");        
        
        var scormAPIFrame = document.createElement("frame");
        scormAPIFrame.setAttribute("name", "scorm_api");
        scormAPIFrame.setAttribute("src", decodedScormFrameUrl); // params-extractor provides this variable
        scormAPIFrame.setAttribute("border", "0");
        scormAPIFrame.setAttribute("scrolling", scrolling.substr(scrolling.indexOf('=')+1));
        scormAPIFrame.setAttribute("noresize", "");

        frameset.appendChild(scoFrame);
        frameset.appendChild(scormAPIFrame);
        document.getElementsByTagName('html')[0].appendChild(frameset);
    },
    setSourceToFrames = function() {
        document.getElementById("content-frame").src = "loading.html";
        document.getElementById("adapter-frame").src = decodedScormFrameUrl;
    };
    
if (callBackUrl === null) {
    showContentServerNotAvailableMessage();
} else {
    // remote_frameset_modern.html is used for useIframe case. In this file
    // we use iframes in a body tag instead of generating frameset.
    if (!useIframe) {
        generateScormFrameset(); 
    }
}
