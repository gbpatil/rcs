/* *******************************************
* api/communication_layer.js
* Remote Content Server (RCS)
* Copyright (c) Saba Software, Inc.
* All Rights Reserved
* Company Confidential
******************************************* */

/*
	In Offline player this include file is supposed to be replaced by calls to ActiveX control
*/

function communicate(dataToSend)
{
	//////////////////////////////////////////////////////////////////////////////
	// This is test code, intended to replace the mechanism here with a postMessaging variant
	// var
	// 	messageToSend = {
	// 		messageType: 'communicate',
	// 		dataToSend: '<?xml version="1.0" encoding="UTF-8" ?><command>'+dataToSend+'</command>',
	// 		finalUrl: parent.decodedCallbackUrl
	// 	};

	// parent.parent.postMessage();
	// End of test code
	//////////////////////////////////////////////////////////////////////////////

	dataToSend='<?xml version="1.0" encoding="UTF-8" ?><command>'+dataToSend+'</command>';

	var finalUrl = parent.decodedCallbackUrl;
	var urlParts = (finalUrl.split('?'))[1];
	urlParts = urlParts.split('&');

	var
		scormSessionKey = urlParts[0],
		sitename = urlParts[1],
		lms_data = urlParts[2],
		cmi_entry = urlParts[3],
		sabaCertificate = 'deepLinkCertificate=' + parent.sabaCertificate,
		// sabaCertificate2 = 'SabaCertificate=' + parent.sabaCertificate,
		securityCheck = 'j_security_check=true';

	var xmlConnection = getXMLHTTPConnection();
	xmlConnection.open("POST", finalUrl, false);
	try {
		xmlConnection.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
	} catch (e) {}
	var site = (sitename.split("="))[1];
	// xmlConnection.setRequestHeader("sitename", site);
	// xmlConnection.setRequestHeader("site", site);
	// xmlConnection.setRequestHeader("Origin", window.document.domain);
	// xmlConnection.withCredentials = true;
	//console.log(sabaCertificate);
	xmlConnection.send(
		"data_to_send=" + EncodeText(dataToSend) +
		'&' + scormSessionKey +
		'&' + sitename +
		'&' + lms_data +
		'&' + cmi_entry +
		'&' + sabaCertificate +
		// '&' + sabaCertificate2 +
		'&' + securityCheck
	);
	return xmlConnection.responseText;
}


function utf8EncodeString(s)
{
	var length = s.length;
	var outStr = "";

	for (var i=0; i<length; i++)
	{

		var nextChar = s.charCodeAt(i);
		var enc = utf8Encode(nextChar);
		outStr += enc;

	}

	return outStr;

}


/*
	Converts the character into utf-8 encoded representation if the character is not latin
	@param ch character code to convert
	@return string representing the UTF8-encoded character if the character is not latin or the cheracter itself otherwise
*/
function utf8Encode(ch)
{


	var result = "";
	if (ch <= 0x7f)
	{
		result += escape(String.fromCharCode(ch));
	}
	// the second range
	else if (ch <= 0x7ff)
	{
		var byte1 = ((ch & 0x7c0) >> 6) | 0xC0;
		var hexString = toHexString(byte1);
		result+= hexString;
		var byte2 = (ch & 0x3f) | 0x80  ;
		hexString = toHexString(byte2);
		result+=hexString;
	}
	else if (ch <= 0xffff)
	{
		var byte1 = ((ch >>12) & 0xf) | 0xE0; // top 4 bits
		var hexString = toHexString(byte1); //middle 6 bits
		result+= hexString;
		var byte2 = ((ch >> 6) & 0x3f) | 0x80  ;
		hexString = toHexString(byte2);
		result+=hexString;
		var byte3 = (ch & 0x3f) | 0x80; // lower 6 bits
		result += toHexString(byte3);
	}

	//dbg("result==" + result);

	return result;
}

/*
	Creates HEX string out of byte
	@param aByte - byte
	@return %XX string
*/
function toHexString(aByte)
{
		var A = 'A'.charCodeAt(0) - 10;;
		var ZERO = '0'.charCodeAt(0);
		var hi = (aByte & 0xf0) >> 4;
		var lo = (aByte & 0x0f);
		var hiChar = (hi > 9) ? String.fromCharCode(A + hi) : String.fromCharCode(ZERO + hi);
		var loChar = (lo > 9) ? String.fromCharCode(A + lo) : String.fromCharCode(ZERO + lo);
		return ""+"%"+hiChar+loChar;
}


function EncodeText(value)
{
	return encodeURI(value).replace(/\%/g, '%25')
			.replace(/\&/g, '%26')
			.replace(/\`/g, '%60')
			.replace(/\+/g, '%252B')
			.replace(/\\/g, '%5C')
			.replace(/\{/g, '%7B')
			.replace(/\}/g, '%7D')
			.replace(/\[/g, '%5B')
			.replace(/\]/g, '%5D')
			.replace(/\"/g, '%22')
			.replace(/\;/g, '%3B')
			.replace(/\</g, '%3C')
			.replace(/\>/g, '%3E');
}


