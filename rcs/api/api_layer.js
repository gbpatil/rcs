/* *******************************************
* api/api_layer.js
* Remote Content Server (RCS)
* Copyright (c) Saba Software, Inc.
* All Rights Reserved
* Company Confidential
******************************************* */

/*
	 Member methods of SCORM API
*/

var currentlyUsedAPI = null;

/* used by content compliance testing tool */
var complianceTestData = "<complianceTestData>";
var complianceEnd = "</complianceTestData>";
var initialError = true;

var exitValue = null;
var processing = false;

/*
This method is used by both 1.2 and 1.3
In 1.2 all the 1.3 specific error codes point to the same General Error 101
In 1.3 they point to actual different codes
The method doesn't actually communicate with LMS. All the data is already populated onLoad
This is done to support NS, since in NS we can't submit the form and get the result withing one method
*/
function initialize(arg)
{

	currentlyUsedAPI = this;

	// content compliance testing mode
	if (checkContentComplianceTest)
	{
		complianceTestData = "<complianceTestData>";
		complianceEnd = "</complianceTestData>";
		initialError = true;
	}

	dbg("api_layer.js: calling initialize");

	this.errorManager.setCurrentErrorCode(this.errorManager.kNoErrorCode);

	//check if param is "" but only for strict compliance
	if (scormCompliant && arg != "")
	{
		//dbg("arg is wrong");
		this.errorManager.setCurrentErrorCode(this.errorManager.kInvalidArgumentErrorCode);
		return kFalse;
	}

	//this method should not be called twice
	// TKessler 30-Apr-2014:
	// However poorly constructed content may in fact call this twice
	// So we're going to ignore it when they do
	/*
	if (this.communicationState == kCommunicationStateInitialized)
	{
		//dbg("is initialized");
		this.errorManager.setCurrentErrorCode(this.errorManager.kAlreadyInitializedCode);

		// content compliance testing mode
		if (checkContentComplianceTest)
		{
			var commandIssue = "<test>true</test><complianceTestData issue=\"LMSInitializeAlreadyCalled\">true</complianceTestData>";
			var result = communicate(commandIssue);
		}
		return kFalse;
	}
	*/
	//this method should not be called after the content terminated the session
	if (this.communicationState == kCommunicationStateFinished)
	{
		//dbg("is finished");
		this.errorManager.setCurrentErrorCode(this.errorManager.kContentInstanceTerminatedCode);
		return kFalse;
	}

	var command = this.commandWizard.buildGetParamCommand();

	var response = communicate(command);

	dbg("response=" + response)


	//communication error
	if (response == null)
	{
		//dbg("no response");
		this.errorManager.setCurrentErrorCode(this.errorManager.kGeneralInitializationFailureCode);

		if (checkContentComplianceTest)
		{
			initialError = false;
		}
		return kFalse;
	}

	dbg("before processing initial data")
	scorm_version = this.scormVersion;

	var processingSucceeded = this.dataModelInterface.processInitialData(response, this.errorManager);

	//DMI may fail to interpret the data
	if (!processingSucceeded)
	{
		//dbg("bad response");
		this.errorManager.setCurrentErrorCode(this.errorManager.kGeneralInitializationFailureCode);

		if (checkContentComplianceTest)
		{
			initialError = false;
		}

		return kFalse;
	}

	this.communicationState = kCommunicationStateInitialized;
	this.errorManager.clearCurrentErrorCode();

	dbg("api_layer.js: finish init")
	return kTrue;
}


//called when content tries to terminate the user session
function terminate(arg)
{
	// "processing" is used as concurrency lock
	if(processing) {
		return true;
	}
	processing = true;

	dbg("!!!!!!!!!!!! terminating by content");
	if (this.communicationState == kCommunicationStateFinished)
	{
		dbg("framework already executed terminate, no need to repeat the call");
		processing = false;
		return "true";
	}
	var res = this.commonTerminate(arg);
	if(res == kFalse) {
		processing = false;
		return res;
	}
	dbg("!!!!!!!!!!!! FINISHED COMMON TERMINATE");
	this.completeUserSession(true);
	this.communicationState = kCommunicationStateFinished;

	processing = false;
	return res;
}


//called when the player tries to terminate the user session
function frameworkTerminate(arg)
{

	dbg("!!!!!!!!!!!! terminating by framework");
	if (this.communicationState == kCommunicationStateFinished)
	{
		dbg("content already executed terminate, no need to repeat the call");
		return "true";
	}
	var res1 = this.commonTerminate(arg);
	if(res1 == kFalse)
		return;
	this.completeUserSession(false);
	this.communicationState = kCommunicationStateFinished;
}

/*
This method is used by both 1.2 and 1.3
In 1.2 all the 1.3 specific error codes point to the same General Error 101
In 1.3 they point to actual different codes
*/
function commonTerminate(arg)
{

	dbg("api_layer.js: commonTerminate")


	this.errorManager.setCurrentErrorCode(this.errorManager.kNoErrorCode);


	//check if param is "" but only for strict compliance
	if (scormCompliant && arg != "")
	{

		//dbg("arg is wrong");
		this.errorManager.setCurrentErrorCode(this.errorManager.kInvalidArgumentErrorCode);
		return kFalse;
	}



	//this method should not be called when content is not yet initialized
	if (this.communicationState == kCommunicationStateNotInitialized)
	{
		//dbg("is not initialized");
		this.errorManager.setCurrentErrorCode(this.errorManager.kTerminationBeforeInitializationFailureCode);

		// content compliance testing mode
		if (checkContentComplianceTest)
		{
			if(initialError)
			{
				var commandIssue = "<test>true</test><complianceTestData issue=\"LMSInitializeNotCalled\">true</complianceTestData>";
				var result = communicate(commandIssue);
				initialError = false;
			}
		}
		return kFalse;
	}


	//this method should not be called twice
	if (this.communicationState == kCommunicationStateFinished)
	{
		//dbg("is finished already");
		this.errorManager.setCurrentErrorCode(this.errorManager.kTerminationAfterTerminationFailureCode);
		return kFalse;
	}

	var command = null;

	// content compliance testing mode
	if (checkContentComplianceTest)
	{
		command = this.commandWizard.buildExitAuCommand(this) + complianceTestData + complianceEnd;
		complianceTestData = "<complianceTestData>";
	}
	else
	{
		command = this.commandWizard.buildExitAuCommand(this);
	}

	var result = communicate(command);


	if (!this.commandWizard.interpretLMSConfirmation(result))
	{

		dbg("api_layer.js:bad response");
		this.errorManager.setCurrentErrorCode(this.errorManager.kGeneralTerminationFailureCode);
		return kFalse;
	}

	return kTrue;
}

/*
This method is used by both 1.2 and 1.3
In 1.2 all the 1.3 specific error codes point to the same General Error 101
In 1.3 they point to actual different codes
*/
function commit(arg)
{
	function findPlayerCommitsTracking() {
		var messageToSend = {
			messageType: 'commitsTrackingCheck'
		};
		parent.targetWindow.postMessage(messageToSend, parent.lms_url);
		// var w = window, ix = 0;

		// while (ix < 20) {
		// 	if (w.Ext && w.Player) {
		// 		if (!w.Player.commitsTracking) {
		// 			w.Player.commitsTracking = {
		// 				failures: 0,
		// 				successTime: 0
		// 			};
		// 		}
		// 		return w.Player.commitsTracking;
		// 	}
		// 	ix++;
		// 	if (!w.parent) {
		// 		return false;
		// 	}
		// 	w = w.parent;
		// }
		// return false;
	}

	function sendCommitFailure () {
		var messageToSend = {
			messageType: 'commitsTrackingSetFailure'
		};
		parent.targetWindow.postMessage(messageToSend, parent.lms_url);
	}

	function sendCommitSuccess () {
		var messageToSend = {
			messageType: 'commitsTrackingSetSuccess'
		};
		parent.targetWindow.postMessage(messageToSend, parent.lms_url);
	}

	// var commitsTracking = findPlayerCommitsTracking();
	findPlayerCommitsTracking();

	//dbg("commit");
	this.errorManager.setCurrentErrorCode(this.errorManager.kNoErrorCode);

	//check if param is right but only for strict compliance
	if (scormCompliant && arg != "")
	{
		//dbg("arg is wrong");
		this.errorManager.setCurrentErrorCode(this.errorManager.kInvalidArgumentErrorCode);
		return kFalse;
	}

	//this method should not be called when content is not yet initialized
	if (this.communicationState == kCommunicationStateNotInitialized)
	{
		//dbg("is not initialized");
		this.errorManager.setCurrentErrorCode(this.errorManager.kCommitBeforeInitializationFailureCode);

		// content compliance testing mode
		if (checkContentComplianceTest)
		{
			if(initialError)
			{
				var commandIssue = "<test>true</test><complianceTestData issue=\"LMSInitializeNotCalled\">true</complianceTestData>";
				var result = communicate(commandIssue);
				initialError = false;
			}
		}
		return kFalse;
	}

	//this method should not be called after termination
	if (this.communicationState == kCommunicationStateFinished)
	{
		//dbg("is finished already");
		this.errorManager.setCurrentErrorCode(this.errorManager.kCommitAfterTerminationFailureCode);
		return kFalse;
	}

	if(!this.isDirty)
	{
		dbg("api_layer.js:no new data to commit, returning");
		return kTrue;
	}
	else
	{
		dbg("api_layer.js:there is some data to commit")
	}
	//dbg("tries to commit data to db");

	//get serialized data from DMI

	var command = null;

	// content compliance testing mode
	if (checkContentComplianceTest)
	{
		command = this.commandWizard.buildPutParamCommand(this) + complianceTestData + complianceEnd;
		complianceTestData = "<complianceTestData>";
	}
	else
	{
		command = this.commandWizard.buildPutParamCommand(this);
	}

	//dbg("before communicate");

	var result = communicate(command);

	dbg("after communicate");
	if (!this.commandWizard.interpretLMSConfirmation(result))
	{
		//dbg("bad response");
		this.errorManager.setCurrentErrorCode(this.errorManager.kGeneralCommitFailureCode);
		// if (commitsTracking) {
		// 	commitsTracking.failures++;
		// 	commitsTracking.successTime = 0;
		// }
		sendCommitFailure();
		return kFalse;
	}

	// if (commitsTracking) {
	// 	commitsTracking.successTime = (new Date()).getTime();
	// 	commitsTracking.failures = 0;
	// }
	sendCommitSuccess();

	dbg("before process init data")

	//processing adl.nav data for SCORM 2004, will do nothing for SCORM1.2 bacause there is no data to process
	var processingSucceeded = this.dataModelInterface.processInitialData(result, this.errorManager);

	dbg("after process init data")

	//DMI may fail to interpret the data
	if (!processingSucceeded)
	{
		//dbg("bad response");
		this.errorManager.setCurrentErrorCode(this.errorManager.kGeneralCommitFailureCode);
		return kFalse;
	}
	this.isDirty = false;

	return kTrue;
}

/*
This method is used by both 1.2 and 1.3
In 1.2 all the 1.3 specific error codes point to the same General Error 101
In 1.3 they point to actual different codes
*/
function getValue(key)
{
	this.errorManager.setCurrentErrorCode(this.errorManager.kNoErrorCode);

	//this method should not be called when content is not yet initialized
	if (this.communicationState == kCommunicationStateNotInitialized)
	{
		//dbg("is not initialized");
		this.errorManager.setCurrentErrorCode(this.errorManager.kRetrieveDataBeforeInitializationCode);

		// content compliance testing mode
		if (checkContentComplianceTest)
		{
			if(initialError)
			{
				var commandIssue = "<test>true</test><complianceTestData issue=\"LMSInitializeNotCalled\">true</complianceTestData>";
				var result = communicate(commandIssue);
				initialError = false;
			}
		}
		return "";
	}

	//this method should not be called after termination
	if (this.communicationState == kCommunicationStateFinished)
	{
		//dbg("is finished already");
		this.errorManager.setCurrentErrorCode(this.errorManager.kRetrieveDataAfterTerminationCode);
		return "";
	}


	if(isScaledProgressScore && key == "cmi.success_status")
	{
		var value = success_status(this.dataModelInterface,this.errorManager);
		return value;
	}

	if(isCompletionThreshold && key == "cmi.completion_status")
	{
		var value = completion_status(this.dataModelInterface,this.errorManager);
		return value;
	}

	//the method retrieves the value or sets error code
	var value = this.dataModelInterface.processGet(key, this.errorManager);

	// content compliance testing mode
	if (checkContentComplianceTest)
	{
		var newElement = convertElementWithIndex(key);
		complianceTestData = complianceTestData + "<" + newElement + " element=\"" + key + "\" call=\"get\" value=\"" + xmlEncode(value) + "\" error=\"" +  this.errorManager.getCurrentErrorCode() + "\" timestamp=\"" + Date() + "\"></" + newElement + ">";
	}

	//if error code is not 0, failed to fetch the value
	if (this.errorManager.getCurrentErrorCode() != this.errorManager.kNoErrorCode) return "";

	return value;
}


/*
This method is used by both 1.2 and 1.3
In 1.2 all the 1.3 specific error codes point to the same General Error 101
In 1.3 they point to actual different codes
*/
function setValue(key, value)
{

	//RMills 7-May-2014 SPC-22020
	//Added because client SCORM package used LMSSetValue("cmi.core.exit")
	if (typeof value === "undefined") {
		value = "";
	}

	dbg("set value key=" + key + " value=" + value);
	this.errorManager.setCurrentErrorCode(this.errorManager.kNoErrorCode);

	//this method should not be called when content is not yet initialized
	if (this.communicationState == kCommunicationStateNotInitialized)
	{
		//dbg("is not initialized");
		this.errorManager.setCurrentErrorCode(this.errorManager.kStoreDataBeforeInitializationCode);

		// content compliance testing mode
		if (checkContentComplianceTest)
		{
			if(initialError)
			{
				var commandIssue = "<test>true</test><complianceTestData issue=\"LMSInitializeNotCalled\">true</complianceTestData>";
				var result = communicate(commandIssue);
				initialError = false;
			}
		}
		return kFalse;
	}

	//this method should not be called after termination
	if (this.communicationState == kCommunicationStateFinished)
	{
		//dbg("is finished already");
		this.errorManager.setCurrentErrorCode(this.errorManager.kStoreDataAfterTerminationCode);
		return kFalse;
	}


	//the method sets the data model and optionally sets the error manager
	var rt = this.dataModelInterface.processSet(key, value, this.errorManager);

	dbg("!!!!!!!!!!!! result=" + rt + " error=" + this.errorManager.getCurrentErrorCode())

	if (rt == kTrue)
	{
		// Write only cmi.exit is being captured to verify value on terminate
		// so as to decide if "Exit All" navigation request to be invoked.
		if(key == "cmi.exit" && isSCORM2004())
		{
			exitValue = value;
		}
		this.isDirty = true;
	}

	// content compliance testing mode
	if (checkContentComplianceTest)
	{
		var newElement = convertElementWithIndex(key);
		complianceTestData = complianceTestData + "<" + newElement + " element=\"" + key + "\" call=\"set\" value=\"" + xmlEncode(value) + "\" error=\"" +  this.errorManager.getCurrentErrorCode() + "\" timestamp=\"" + Date() + "\"></" + newElement + ">";
	}

	return rt;

}

function getLastError()
{
	//dbg("in get last error");
	return this.errorManager.getCurrentErrorCode();
}


function getErrorString(errorCode)
{
	//dbg("in get error string");
	var desc = this.errorManager.getErrorDescription(errorCode);
	//dbg("in get error string2");
	return desc;
}

function getDiagnostic(errorCode)
{
	//dbg("in get diagnostic");
	return this.errorManager.getErrorDiagnostic(errorCode)
}

function apiIsClean()
{
	return this.dataModelInterface.IsClean()
}

function apiMarkClean()
{
	dbg("in api mark clean")
	this.dataModelInterface.MarkClean()
}

/*
End member methods of SCORM API
*/

/*
Initialization methods called by API constructor
*/

function setUpMemberMethods(scormVersion, obj)
{

	//need this in 1.3 since it is called by Terminate
	obj.CommonCommit = commit;

	obj.IsClean = apiIsClean;
	obj.MarkClean = apiMarkClean;

	//will be called by frameset so we need the same method name for all the versions
	obj.FrameworkTerminate = frameworkTerminate;

	//will be called by FrameworkTerminate, LMSFinish, and Terminate
	obj.commonTerminate = commonTerminate;

	if (scormVersion == kVersion12)
	{
		obj.LMSInitialize = initialize;
		obj.LMSFinish = terminate;
		obj.LMSCommit = commit;
		obj.LMSGetValue = getValue;
		obj.LMSSetValue = setValue;
		obj.LMSGetLastError = getLastError;
		obj.LMSGetErrorString = getErrorString;
		obj.LMSGetDiagnostic = getDiagnostic;
		obj.completeUserSession = apiCompleteUserSession1_2;
	}
	else
	{
		obj.Initialize = initialize;
		obj.Terminate = terminate;
		obj.Commit = commit;
		obj.GetValue = getValue;
		obj.SetValue = setValue;
		obj.GetLastError = getLastError;
		obj.GetErrorString = getErrorString;
		obj.GetDiagnostic = getDiagnostic;
		obj.completeUserSession = apiCompleteUserSession1484_11;

	}

}

function setUpObjects(scormVersion, obj)
{

	obj.errorManager = new ErrorManager(scormVersion);

	obj.dataModelInterface = new DataModelInterface(scormVersion);

	obj.commandWizard = new CommandWizard(scormVersion);

}



/*
SCORM API OBJECT CONSTRUCTOR
*/
function scorm_api(scormVersion)
{
	this.isDirty = false;
	this.scormVersion = scormVersion;
	this.communicationState = kCommunicationStateNotInitialized;

	if (scormVersion == kVersion148411)
	{
		this.version = "1.0";
	}

	setUpMemberMethods(scormVersion, this);
	setUpObjects(scormVersion, this);
}

/*
Success_status Calculation based on scaled.score and scaled_passing_score
*/
function success_status(dataModelInterface, errorManager)
{

	var successStatus = null;
	var scaledPassingScore = dataModelInterface.processGet("cmi.scaled_passing_score", errorManager);
	var scaledScore = dataModelInterface.processGet("cmi.score.scaled", errorManager);


	// ScaledScore is not fetched or is fetched before setting it so the error code needs to be checked
	if(errorManager.getCurrentErrorCode() == errorManager.kNoErrorCode)
	{
			if(parseFloat(scaledPassingScore) > parseFloat(scaledScore))
			{
		successStatus = "failed";
			}
			else
			{
		successStatus = "passed";
			}
	}
	else
	{
			// If the scaled score is not set, set the success status to "Unknown".
			successStatus = "unknown";
			errorManager.setCurrentErrorCode(errorManager.kNoErrorCode);
	}


	 return successStatus;
}

/*
Completion_status Calculation is based on progress_measure and completion_threshold
*/
function completion_status(dataModelInterface, errorManager)
{

	var completionStatus = null;
	var completionThreshold = dataModelInterface.processGet("cmi.completion_threshold", errorManager);
	var progressMeasure = dataModelInterface.processGet("cmi.progress_measure", errorManager);


	// ProgressMeasure is not fetched or is fetched before setting it so the error code needs to be checked
	if(errorManager.getCurrentErrorCode() == errorManager.kNoErrorCode)
	{
			if(completionThreshold > progressMeasure)
			{
		completionStatus = "incomplete";
			}
			else
			{
		completionStatus = "completed";
			}
	}
	else
	{
			// If the progress_measure is not available, set the completion status to "Unknown".
			completionStatus = "unknown";
			errorManager.setCurrentErrorCode(errorManager.kNoErrorCode);
	}
	 return completionStatus;
}

/*
API DOM object instantiation
We will set up two instances of API: one for 1.2 and one for 1.3
*/

var lastLocation = null;

function goToLastLoacation()
{
	//dbg("redirecting to last location");
	parent.document.location.href=lastLocation;
}

/*
Called by LMSFinish() method to process the completion of user session
*/
function apiCompleteUserSession1_2(cameFromContent)
{



	//dbg(" completing user session 12 ");

	if (parent.playerVersion == kPlayerVersion1)
	{


		//old online player
		top.close();
	}
	else if(parent.playerVersion == kPlayerVersion2)
	{
		//new online player
		var navCommand = "_none_";

			//dbg("### LMSFinish originating from content. redirecting to navigator page");
			// below lines are added for auto close and auto navigate functionality for SCORM12 CR77309
			dbg('Finish call cameFromContent');
			dbg("isLastSCO " + parent.isLastSCO + "autoCloseSCORM12 " + parent.autoCloseSCORM12 + "autoNavigateSCORM12 " + parent.autoNavigateSCORM12);
			if ( ( parent.autoNavigateSCORM12 == "true" ) && (parent.isLastSCO == "false") )
			{
				dbg("autoNavigateSCORM12 and isLastSCO are true. So, navigating to next SCORM");
				navCommand = "continue";
			}

			if ( (parent.autoCloseSCORM12 == "true") && (parent.isLastSCO == "true") )
			{
				dbg("autoCloseSCORM12 and isLastSCO are true. So closing the Top frame");
				top.close();
			}

			var contentControllerUrl = "" + parent.decodedContentControllerUrl;
			var tmpUrl = contentControllerUrl + "?navigationCommand=" + navCommand + "&contextId=" + parent.contextId + "&subscriptionId=" + parent.subscriptionId +
					"&contentServerId=" + parent.contentServerId + "&contentInventoryId=" + parent.contentInventoryId;
			//dbg("### navigate to placeholder ");
			lastLocation = tmpUrl;
			setTimeout("goToLastLoacation()", 2000);

	}
	else
	{
		var request = "_none_";
		if ( ( parent.autoNavigateSCORM12 === "true" ) && (parent.isLastSCO === "false") )
		{
			request = "continue";
		}

		if ( (parent.autoCloseSCORM12 === "true") && (parent.isLastSCO === "true") )
		{
			request = "exit";
		}

		if(request === "_none_") {
			// Unload the content by loading the blank page
			parent.frames.sco.document.location.href = parent.decodedAdapterLocation + "/blank.html";
		}
		parent && parent.shell && parent.shell.navigate(request, 'adapter');
	}


	dbg("### completed completing user session 12");


}





/*
Called by Terminate() method to process the completion of user session
Never applies to the old player
Follows the following logic:

if there is a pending nav request originating from content
	redirect to SequencedPlayerNavigator and pass the request
otherwise (no pending nav request)
	if Terminate gets called by content
		replace the frameset with placeholder page
	otherwise (Terminate gets called by frameset on unload)
		do nothing and let TOC, VCR, CLOSE button to perform their actions
*/
function apiCompleteUserSession1484_11(cameFromContent)
{
	var source = null;
	if (parent.playerVersion == kPlayerVersion1)
	{


		//old online player
		top.close();
	}
	else if(parent.playerVersion == kPlayerVersion2)
	{
		var contentControllerUrl = "" + parent.decodedContentControllerUrl;

		var navRequest = null;
		//We need to get the adl.nav.request originated from content if this SCO is terminated by content
		if(cameFromContent)
		{
			navRequest = this.GetValue("adl.nav.request");
			if(navRequest != null && navRequest != "" && navRequest != "_none_")
				source = "content";
		}

		// If cmi.exit is set by the content, initiate explicit navigation request that overwrites
		// any pending navigation request coming from content or user.
		if(exitValue == "time-out" || exitValue == "logout")
		{
			source = "scormadapter";
			navRequest = "exitAll";

			// For SCORM 2004 Ed 2 content, "Suspend All" is associated with logout.
			if(contentFormatVersion != kSCORM2004Ed3Version && exitValue == "logout")
				navRequest = "suspendAll";
		}


		//If termiate() call is originated from framework, the navRequest should be null, but it should be handled
		//by TOC, VCR, CLOSE controls.
		if (navRequest == null || navRequest == "" || navRequest == "_none_")
		{
			//content didn't set any navigation requests
			//schedule redirect to placeholder. VCR and toc will ovverride this action if the request came from them
			/* var tmpUrl = contentControllerUrl + "?navigationCommand=_none_" + "&contextId=" + parent.contextId + "&subscriptionId=" + parent.subscriptionId +
			"&contentServerId=" + parent.contentServerId + "&contentInventoryId=" + parent.contentInventoryId;
			lastLocation = tmpUrl;
			setTimeout("goToLastLoacation()", 2000); */

			// For Assessment content, send the navigation request so that SCO is unloaded
			// For Assessment's contentFormatVersion is 1.2 while API version is 1484_11
			if(contentFormatVersion == kSCORM12)
			{
				var tmpUrl = contentControllerUrl + "?navigationCommand=_none_" + "&contextId=" + parent.contextId + "&subscriptionId=" + parent.subscriptionId +
				"&contentServerId=" + parent.contentServerId + "&contentInventoryId=" + parent.contentInventoryId + "&source=" + source;
				lastLocation = tmpUrl;
				setTimeout("goToLastLoacation()", 2000);
			}
			// This fix has been reverted. After a decision is reached for NAV request, this fix should be re-visited.
			/*
			else
			{
				//DEF0325106 - Trigger Rollup in case of browser close
				source = "content";
				var popupUrl=contentControllerUrl.substring(0,contentControllerUrl.lastIndexOf('/'));
				popupUrl=popupUrl+"/"+"SequencedPlayerAbruptCompletion.rdf";
				var tmpUrl = popupUrl + "?navigationCommand=exitAll"  + "&contextId=" + parent.contextId + "&subscriptionId=" + parent.subscriptionId +
				"&contentServerId=" + parent.contentServerId + "&contentInventoryId=" + parent.contentInventoryId + "&source=" + source;
				window.open(tmpUrl,"SaveSessionData","height=100, width=200, resizable=0");
			}
			*/

		}
		else
		{
			//redirect according to the nav request set by content
			//ignore whatever has been set by VCR controls or TOC
			var tmpUrl = contentControllerUrl + "?navigationCommand=" + escape(navRequest) + "&contextId=" + parent.contextId + "&subscriptionId=" + parent.subscriptionId +
			"&contentServerId=" + parent.contentServerId + "&contentInventoryId=" + parent.contentInventoryId + "&source=" + source;
			parent.document.location.href = tmpUrl;
		}

	}
	else
	{
		var navRequest = this.GetValue("adl.nav.request");

		if (navRequest == null || navRequest == "" || navRequest == "_none_")
		{
			return false;
		}

		if(cameFromContent){
			source = "content";
		}else{
			source = "adapter";
		}
		parent && parent.shell && parent.shell.navigate(navRequest, source);
	}


}

/*
 This method is used by content compliance testing tool for
 converting elements with index into without index elements
 e.g converts cmi.interactions.0.id to cmi.interactions.id
*/
function convertElementWithIndex(element)
{
	var element = element.split(".");
	var output = "";

	var counter = 1;
	var match = "false"
	for (var i = 0; i < element.length; i++)
	{
		var initial = "true"
		for (var j=0; j < element[i].length; j++)
		{
			var code = element[i].charCodeAt(j);
			// ascii value for 0 to 9 digits
			if (code > 47 && code < 58)
			{
				match = "true";
			}
			else
			{
				if (match == "true")
				{
					match = "false";
				}

				output = output + element[i];

				if(i != (element.length - 1))
				output = output + ".";

				j = element[i].length;
			}
		}
	}

	return output;
}

parent.API = new scorm_api(kVersion12);
parent.API_1484_11 = new scorm_api(kVersion148411);

