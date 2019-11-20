/* ******************************************
* common-scripts.js
* Remote Content Server (RCS)
* Copyright (c) Saba Software, Inc.
* All Rights Reserved
* Company Confidential
******************************************* */

function getInternetExplorerVersion(){
    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).

    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat( RegExp.$1 );
    }
    return rv;
}

function getXMLHTTPConnection() {
    var xmlhttp;
    try {
        xmlhttp = new XMLHttpRequest();
    } catch (e) {
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e1) {
            try {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch(e2) {
                xmlhttp = false;
            }
        }
    }
    return xmlhttp;
}

function QueryString(key) {
    var value = null;
    for (var i=0;i<QueryString.keys.length;i++)
    {
        if (QueryString.keys[i]==key)
        {
            value = QueryString.values[i];
            break;
        }
    }
    return value;
}

QueryString.keys = [];
QueryString.values = [];

function QueryString_Parse() {
    var query = window.location.search.substring(1);
    var pairs = query.split("&");

    for (var i=0;i<pairs.length;i++)
    {
        var pos = pairs[i].indexOf('=');
        if (pos >= 0)
        {
            var argname = pairs[i].substring(0,pos);
            var value = pairs[i].substring(pos+1);
            QueryString.keys[QueryString.keys.length] = argname;
            QueryString.values[QueryString.values.length] = value;
        }
    }

}

function getCookie(Name) {
    var search = Name + "=";
    if (document.cookie.length > 0)
    {
        // if there are any cookies
        offset = document.cookie.indexOf(search);
        if (offset != -1)
        {
            // if cookie exists
            offset += search.length;
            // set index of beginning of value
            end = document.cookie.indexOf(";", offset);
            // set index of end of cookie value
            if (end == -1)
                end = document.cookie.length;
            return unescape(document.cookie.substring(offset, end));
        }
    }
}

// Sets cookie values. Expiration date is optional
function setCookie(name, value, expire)
{
    document.cookie = name + "=" + escape(value) + ((expire) ? ("; expires=" + expire.toGMTString()) : "" );
}

// populating the query string object with values
QueryString_Parse();