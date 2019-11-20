/* ******************************************
* params-extractor.js
* Remote Content Server (RCS)
* Copyright (c) Saba Software, Inc.
* All Rights Reserved
* Company Confidential
******************************************* */

////////////////////////////////////////////////////////////////////
// Workaround for intermittant Trivantis problem in IE where cookie 
// isn't reset properly
var trivantisCookie = getCookie("TrivantisSCORMTimer");
if (trivantisCookie != null) {
    setCookie("TrivantisSCORMTimer","0");
}
////////////////////////////////////////////////////////////////////

var //reading input params
    callBackUrl = QueryString("callback_url"),
    adapterLocation= QueryString("adapter_location"),
    scoId = QueryString("sco_id"),
    dbg = QueryString("debug"),
    scoUrl = QueryString("sco_url"),
    checkScormCompliance = QueryString("check_scorm_compliance"),
    contentFormatVersion = QueryString("contentFormatVersion"),
    checkContentComplianceTest = QueryString("isContentComplianceTestMode"),
    isLastSCO = QueryString("isLastSCO"),
    autoCloseSCORM12 = QueryString("autoCloseSCORM12"),
    autoNavigateSCORM12 = QueryString("autoNavigateSCORM12"),
    contentTypeVendor = QueryString("contentTypeVendor"),
    lms_url = unescape(QueryString("lms_url")),
    useIframe = QueryString("useIframe")==='true' ? true : false;

window.lms_url = unescape(QueryString("lms_url"));
    
if (isLastSCO == null) isLastSCO = "false";
if (autoCloseSCORM12 == null) autoCloseSCORM12 = "false";
if (autoNavigateSCORM12 == null) autoNavigateSCORM12 = "false";



var mode = QueryString("mode");
var isOnline = (mode == "online");
var charset = QueryString("charset");
var version = QueryString("scorm_version");
if (version == null) version="all";
var activityId = QueryString("activity_id");
if (activityId == null) activityId="n/a";
var playerVersion = QueryString("player_version");

var decodedContentControllerUrl = unescape(QueryString("content_controller_url"));
var decodedAdapterLocation = unescape(adapterLocation);
var decodedCallbackUrl = unescape(callBackUrl);

var separator = "&";
if (decodedCallbackUrl.indexOf("?") == -1) separator = "?";
var paramString="callback_url=" + callBackUrl + "&adapter_location=" + adapterLocation + "&sco_id=" + scoId + "&debug=" + dbg  + "&check_scorm_compliance=" + checkScormCompliance + "&sco_url=" + scoUrl   + "&mode=" + mode + "&charset=" + charset + "&isContentComplianceTestMode=" + checkContentComplianceTest + "&contentFormatVersion=" + contentFormatVersion;

//the URL points to the LMS response page because we need to query LMSInitialize/Initialize before content is loaded
//to make sure in NS browser we can get initial data

//these vars will be later used by other frames. Don't delete them
var decodedScoUrl = unescape(scoUrl);
var decodedContentControllerUrl = unescape(QueryString("content_controller_url"));
var decodedScormFrameUrl = "scorm_frame.html?" + paramString + "&lms_url=" + escape(lms_url);

var contextId = QueryString("context_id");
var subscriptionId = QueryString("subscription_id");
var contentServerId = QueryString("content_server_id");
var contentInventoryId = QueryString("content_inventory_id");

var logger = QueryString("logging");
logger = (logger && logger === 'true') ? true : false;
var recorder = QueryString("recording");
recorder = (recorder && recorder === 'true') ? true : false;

var faultTolerance = true, throttler = true;
