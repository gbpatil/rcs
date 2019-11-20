/* *******************************************
* api.js 
* version 1.7
* Remote Content Server (RCS)
* Copyright (c) Saba Software, Inc.
* All Rights Reserved
* Company Confidential
******************************************* */

// utils.js
var kVersion12 = "1_2";
var kVersion148411 = "1484_11";
var kSCORM2004Ed3Version = "1.3.1";
var kSCORM12 = "1.2";
var isScaledProgressScore = false;
var isCompletionThreshold = false;

var kXmlDeclaration = "<?xml version=\"1.0\"?>";

var kTrue = "true";
var kFalse = "false";

var kCommunicationStateNotInitialized = "Not Initialized";
var kCommunicationStateInitialized = "Initialized";
var kCommunicationStateFinished = "Finished";

var kFakeSuccessResponse = "version=3.1,error=0";
var kFakeFailResponse = "version=3.1,error=1";

var kPlayerVersion1 = 1;
var kPlayerVersion2 = 2;

var openForInitialization = false;
var scorm_version = kVersion12;
function isSCORM2004() 
{
	return scorm_version == kVersion148411;
}


var debug_flag = QueryString("debug");

function dbg( dbg_value )
{
	if (debug_flag == "true") 
	{
		alert("debug-->" + dbg_value);
	}
}
function debugLog(debugString)
{
	try{
		if (window.console){
			window.console.log(debugString);
		}
	}catch(e){}	
}
function xmlEncode(value)
{

	//making sure this is a string
	value = "" + value;
	value = value.replace(/\&/g,"&amp;");
	value = value.replace(/\</g,"&lt;");
	value = value.replace(/\>/g,"&gt;");
	value = value.replace(/\"/g,"&quot;");
	return value;
}

var scormCompliant = (QueryString("check_scorm_compliance") == "true") ? true : false;
dbg("scormCompliant=" + scormCompliant);

// used by content compliance testing tool
var checkContentComplianceTest = (QueryString("isContentComplianceTestMode") == "true") ? true : false;
dbg("isContentComplianceTestMode=" + checkContentComplianceTest);


var mode = QueryString("mode");
var isOnline = (mode == "online");

dbg("mode=" + mode)   

var contentFormatVersion = QueryString("contentFormatVersion");

var kElementMemberType = "element";
var kContainerMemberType = "container";
var kCountableContainerMemberType = "countable_container";

var charset = QueryString("charset");


// command_wizard.js
function CommandWizard(scormVersion)
{
	this.scormVersion = scormVersion;
	this.kGetParamCommand = "g";
	this.kPutParamCommand = "p";
	this.kExitAuCommand = "e";
	this.buildGetParamCommand = cbBuildGetParamCommand;
	this.buildPutParamCommand = cbBuildPutParamCommand;
	this.buildExitAuCommand = cbBuildExitAuCommand;
	this.interpretLMSConfirmation = cbInterpretLMSConfirmation;
}



function cbBuildGetParamCommand()
{
	var out = "<n>" + this.kGetParamCommand + "</n>";
	out += "<v>" + this.scormVersion + "</v>";
	out += "<test>" + checkContentComplianceTest + "</test>"; // content compliance testing mode

	return out;
}


function cbBuildPutParamCommand(apiInstance)
{

	var dataModelInterface = apiInstance.dataModelInterface;

	var out = "<n>" + this.kPutParamCommand + "</n>";
	out += "<v>" + this.scormVersion + "</v>";
	out += "<test>" + checkContentComplianceTest + "</test>"; // content compliance testing mode
	out += "<a>" + escape(parent.activityId) + "</a>";
	out += "<b>" + dataModelInterface.root.show(0) + "</b>";
	
	return out;
}

function cbBuildExitAuCommand(apiInstance)
{

	var dataModelInterface = apiInstance.dataModelInterface;

	var out = "<n>" + this.kExitAuCommand + "</n>";
	out += "<v>" + this.scormVersion + "</v>";
	out += "<test>" + checkContentComplianceTest + "</test>"; // content compliance testing mode
	out += "<a>" + escape(parent.activityId) + "</a>";
	if(apiInstance.isDirty)
		out += "<b>" + dataModelInterface.root.show(0) + "</b>";

	return out;
}

function cbInterpretLMSConfirmation(confirmation)
{
	if (confirmation.indexOf("error=0") > -1) return true;
	return false;
}

// data_model_validator.js
/****************** SCORM 1.2 vocabularies *********************************/

var statusVocabulary = new Array("passed", "completed", "failed", "incomplete", "browsed", "not attempted");
var statusVocabularyRelaxed = new Array("p", "c", "f", "i", "b", "n");

var exitVocabulary = new Array("time-out", "suspend", "logout", "");
var exitVocabularyRelaxed = new Array("t", "s", "l", "");

var interactionTypeVocabulary = new Array("true-false","choice","fill-in","matching","performance","sequencing","likert","numeric");
var interactionTypeVocabularyRelaxed = new Array("t","c","f","m","p","s","l","n");

var interactionResultVocabulary = new Array("correct","wrong","unanticipated","neutral");
var interactionResultVocabularyRelaxed = new Array("c","w","u","n");

/******************* SCORM 1.3 vocabularies *********************************/

var completion_status148411Vocabulary = new Array ("unknown", "completed", "incomplete", "not attempted");
var completion_status148411VocabularyRelaxed = new Array();

var exit148411Vocabulary = new Array("time-out", "suspend", "logout", "", "normal");
var exit148411VocabularyRelaxed = new Array();

var interactionType148411Vocabulary = new Array("true-false","choice","fill-in","long-fill-in","matching","performance","sequencing","likert","numeric","other");
var interactionType148411VocabularyRelaxed = new Array();

var interactionResult148411Vocabulary = interactionResultVocabulary;
var interactionResult148411VocabularyRelaxed = interactionResultVocabularyRelaxed;

var success_status148411Vocabulary = new Array("unknown", "passed", "failed");
var success_status148411VocabularyRelaxed = new Array();

var adlNavRequest148411Vocabulary = new Array("continue", "previous", "exit", "exitAll", "abandon", "abandonAll", "_none_");
var adlNavRequest148411VocabularyRelaxed = new Array();

var adlNavRequest148411ed3Vocabulary = new Array("continue", "previous", "exit", "exitAll", "abandon", "abandonAll", "_none_", "suspendAll");
var adlNavRequest148411ed3VocabularyRelaxed = new Array();

var adlNavRequestValid148411Vocabulary = new Array("true", "false", "unknown");
var adlNavRequestValid148411VocabularyRelaxed = new Array();

/****************** End vocabulary definitions *******************************/
/****************** SCORM 1.2 validation functions ******************************/

function checkVocabulary(value, vocabularyName, errorManager)
{

	if (!scormCompliant && !(vocabularyName == "adlNavRequest148411" || vocabularyName == "adlNavRequest148411ed3"))
	{
		value = value.toLowerCase();
	}



	var array = null;

	var evalExp = "array=" + vocabularyName + "Vocabulary";


	eval(evalExp);



	for(var i=0; i<array.length; i++)
	{


		if (array[i] == value) return;
	}

	if (!scormCompliant)
	{
		eval("array=" + vocabularyName + "VocabularyRelaxed");
		for(var i=0; i<array.length; i++)
		{
			if (array[i] == value.toLowerCase()) return;
		}
	}

	setTypeMismatch(errorManager);
}

function checkCMIBoolean(value, errorManager)
{
	if (value == 'true' || value == 'false') return;
	setTypeMismatch(errorManager);
}

function checkCMIDecimalOrBlank(value, errorManager)
{
	if (value == "") return;
	checkCMIDecimal(value, errorManager)
}

function checkCMIDecimal(value, errorManager)
{
	var regExp = /^-?[0-9]+(\.[0-9]+)?$/;
	checkRegExp(value, regExp, errorManager);
}

function checkCMIIdentifier(value, errorManager)
{
	if(scormCompliant)
	{
		checkRegExp(value, /^[\041-\176]{1,255}$/, errorManager);
	}
	else
	{
		if (value.length <= 255) return;
		setTypeMismatch(errorManager);
	}
}

function checkCMIInteger(value, errorManager)
{
	checkRegExp(value, /^[0-9]+$/, errorManager);
	if (errorManager.getCurrentErrorCode() !=  errorManager.kNoErrorCode) return;

	var intValue = parseInt(value);
	if (intValue < 0 || intValue > 65536) setTypeMismatch(errorManager);
}

function checkCMISInteger(value, errorManager)
{

	checkRegExp(value, /^-?[0-9]+$/, errorManager);
	if (errorManager.getCurrentErrorCode() !=  errorManager.kNoErrorCode) return;
	var intValue = parseInt(value);
	if (intValue < -32768 || intValue > 32768) setTypeMismatch(errorManager);
}


function checkCMIString255(value, errorManager)
{
	checkASCII(value, errorManager);
	if (errorManager.getCurrentErrorCode() !=  errorManager.kNoErrorCode) return;

	if (value.length <= 255) return;
	setTypeMismatch(errorManager);
}

function checkCMIString4096(value, errorManager)
{

	checkASCII(value, errorManager);
	if (errorManager.getCurrentErrorCode() !=  errorManager.kNoErrorCode) return;


	if (value.length <= 65536) return;
	setTypeMismatch(errorManager);
}

function checkCMIString4096WithText(value, errorManager)
{
    if (value.length <= 4096) return;
	setTypeMismatch(errorManager);
}


function checkCMITime(value, errorManager)
{
	checkRegExp(value, /^[0-2][0-9]:[0-5][0-9]:[0-5][0-9](\.[0-9]{1,2})?$/, errorManager);
	if (errorManager.getCurrentErrorCode() !=  errorManager.kNoErrorCode) return;

	var ah = value.split(":");
	var hours = parseInt(ah[0]);
	if (hours > 24) setTypeMismatch(errorManager);
}

function checkCMITimespan(value, errorManager)
{
	checkRegExp(value, /^[0-9]{2,4}:[0-9][0-9]:[0-9][0-9](\.[0-9]{1,2})?$/, errorManager);
}

function checkCMIFeedback(value, errorManager)
{
	if (value.length <= 255) return;
	setTypeMismatch(errorManager);
}

function checkASCII(value, errorManager)
{

	for (var i=0; i<value.length; i++)
	{
		var code = value.charCodeAt(i);
		if (code > 255)
		{
			setTypeMismatch(errorManager);
			break;
		}
	}
}

function checkRegExp(value, regExp, errorManager)
{
	//reset the error code to kNoErrorCode
	errorManager.setCurrentErrorCode(errorManager.kNoErrorCode);
	if (regExp.test(value))
	{
		return;
	}
	setTypeMismatch(errorManager);
}


function checkLessonStatus(value, errorManager)
{
	checkVocabulary(value, "status", errorManager);

	if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode) return;

	if (!openForInitialization && value=="not attempted")
	{

		//allow not attempted to be set only during initialization
		errorManager.setCurrentErrorCode(errorManager.kIncorrectDataTypeCode);
	}
}

function checkInteractionResult(value, errorManager)
{

	checkVocabulary(value, "interactionResult", errorManager);
	if (errorManager.getCurrentErrorCode() == errorManager.kNoErrorCode) return;
	errorManager.setCurrentErrorCode(errorManager.kNoErrorCode);
	checkCMIDecimal(value, errorManager);
}

function checkNormalizedScore(value, errorManager)
{
	if (value == "") return;
	checkCMIDecimalOrBlank(value, errorManager)
	if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode) return;
	checkRange(value, 0,100, errorManager);
}

function checkAudio(value, errorManager)
{

	checkCMISInteger(value, errorManager);
	if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode) return;
	checkRange(value, -1,100, errorManager);
}

function checkSpeed(value, errorManager)
{
	checkCMISInteger(value, errorManager);
	if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode) return;
	return checkRange(value, -100,100, errorManager);
}

function checkText(value, errorManager)
{
	checkCMISInteger(value, errorManager);
	if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode) return;
	return checkRange(value, -1,1, errorManager);
}

function checkRange(value, min, max, errorManager)
{
	var integer = parseInt(value);
	if (integer >= min && integer <=max) return;
	setOutOfRange(errorManager);
}

/***************************************** End SCORM 1.2 validation functions *************************/

/***************************************** SCORM 1.3 validation functions ******************************/

Array.prototype.contains = function (val) {
	var i =0;
	var len = this.length;
	while (i < len ) {
		if (this[i] == val)
			return true;
		 i++;
	}
	return false;
}


/* validator function for long_identfier_type - 4000 length*/
function check_long_identifier_4000(value, errorManager)
{
	check_long_identifier(value, errorManager, 4000);
}

/* validator function for localized_string_type - 4096 length */
function check_localized_string_4096(value, errorManager)
{
	checkLocalizedString(value, errorManager, 4096);
}

function check_localized_string_255(value, errorManager)
{
	checkLocalizedString(value, errorManager, 255);
}

/* functions for characterstring types with different lengths */
function checkISO_10646_1_255(value, errorManager)
{
	if( value && value.length > 255)
		setTypeMismatch(errorManager);
}

function checkISO_10646_1_4096(value, errorManager)
{
	if(value && value.length > 4096)
		setTypeMismatch(errorManager);
}

function checkISO_10646_1_65536(value, errorManager)
{
	if(value && value.length > 65536)
		setTypeMismatch(errorManager);
}

function checkISO_10646_1_1000(value, errorManager)
{
	if(value && value.length > 1000)
		setTypeMismatch(errorManager);
}

function check_time_second_10_0(value, errorManager)
{
//YYYY[-MM[-DD[Thh[:mm[:ss[.s[TZD]]]]]]]
//where 1970 <= YYYY <= 2038
	var reg = "^((19[789][0-9])|(20[0-2][0-9])|(203[0-8]))(-(1[0-2]|0[1-9])(-(0[1-9]|[12][0-9]|3[01])(T([01][0-9]|2[0-3])(:([0-4][0-9]|5[0-9])(:([0-4][0-9]|5[0-9])(\\.\\d{1,2}(Z|([+-]([01][0-9]|2[0-3])(:([0-4][0-9]|5[0-9]))?))?)?)?)?)?)?)?$";
	checkRegExp(value, new RegExp(reg), errorManager);
}

function check_time_interval_second_10_2(value, errorManager)
{
	//P[yY][mM][dD][T[hH][mM][s[.s]S]]
	var ptReg = "^.*[^PT]$";
	if(!value.match(new RegExp(ptReg)))
	{
		setTypeMismatch(errorManager);
		return;
	}
	var reg = "^P(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+(\\.\\d{1,2})?S)?)?$";
	checkRegExp(value, new RegExp(reg), errorManager);
}

function check_real_10_7(value, errorManager)
{
	var reg = "^[\\+\\-]?((\\d+)|(\\d*\\.\\d+))$";
	checkRegExp(value, new RegExp(reg), errorManager);
}


function check_real_10_7_minus_1_plus_1(value, errorManager)
{
	check_real_10_7(value, errorManager);
	//check range
	//checkRange(value, -1, 1, errorManager);
	if (errorManager.getCurrentErrorCode() == errorManager.kNoErrorCode)
	{
		var reg = "^[\\+\\-]?((1(\\.[0]+)?)|(0\\.[0-9]+)|0)$";
		var regExp = new RegExp(reg);
		if (!regExp.test(value))
			setOutOfRange(errorManager);
	}
}
function check_real_10_7_0_1(value, errorManager)
{
	check_real_10_7(value,errorManager);
	if (errorManager.getCurrentErrorCode() == errorManager.kNoErrorCode)
	{
		var reg = "^(\\+)?((1(\\.[0]+)?)|(0\\.[0-9]+)|0)$";
		var regExp = new RegExp(reg);
		if (!regExp.test(value))
			setOutOfRange(errorManager);
	}

} //real 10,7 0..1

function check_real_10_7_0_more(value, errorManager)
{
	check_real_10_7(value,errorManager);
	if (errorManager.getCurrentErrorCode() == errorManager.kNoErrorCode)
	{
		if(value.indexOf('-') == 0)
			setOutOfRange(errorManager);
	}
} //real 10,7 0..*

function checkInteractionResult148411(value, errorManager)
{
	var reg = "^(correct|incorrect|unanticipated|neutral|([\\+\\-]?((\\d+)|(\\d*\\.\\d+))))$";
	checkRegExp(value, new RegExp(reg), errorManager);
} //lov or real 10.7

function checkCorrectResponses(value, errorManager,type)
{
	return checkInteractionResponse(false, value,errorManager,type);
}

function checkLearnerResponse(value, errorManager, type)
{
	return checkInteractionResponse(true, value,errorManager,type);
}

/*================ internal functions ======================*/
function check_long_identifier(value, errorManager, length)
{
	//var reg = "^(urn:[a-zA-Z0-9]([a-zA-Z0-9\\-]{1,31}:)?[\041-\176]{1,255}$";
	//var reg = "^[\041-\176]{1,255}$";

	if(scormCompliant && value.indexOf('urn:')==0)
	{
		reg = 	 "^urn:[a-zA-Z0-9][a-zA-Z0-9\\-]{1,31}:([a-zA-Z0-9\050-\057\041-\045\072\073\075\077\100\137\047]|%[0-9A-Fa-f][0-9A-Fa-f])+$";
	}
	else
		reg = "^[\041-\176]{1,"+length+"}$";
	checkRegExp(value, new RegExp(reg), errorManager);

}


//to get around with SCORM Conformance test suite 1.3.3
var badLanguageTypes = new Array ("{lang=exg}", "{lang=sp}", "{lang=ruq-JM}", "{lang=frl}");

function checkLocalizedString(value, errorManager, stringLength)
{
	if (stringLength == null) stringLength = 255;


	//var reg = "^\\{((case_matters=(.*))|(lang=(.*)))\\}";
	var reg = "^\\{lang=(.*)\\}";
	var reExp = new RegExp(reg);
	var rest_value = value;
	if(reExp.test(value))
	{
		//language_type ::= langcode {"-" subcode}*
		//langcode: there are two-letter codes and three-letter codes
		//          the value "i" is reserved for registrations defined by IANA
		//          the value "x" is reserved for private use
		//var re1 = "^(\\{((case_matters=(true|false))|(lang=(i|x|([a-zA-Z]{2,3}))(-(\\d{3,5}|[a-zA-Z]{2,8}))*))\\})+";
		var re1 = "^\\{lang=(i|x|([a-zA-Z]{2,3}))(-(\\d{3,5}|[a-zA-Z]{2,8}))*\\}";
		var reExp2 = new RegExp(re1);
		var foundArr = reExp2.exec(value);
		if(foundArr == null)
		{
			setTypeMismatch(errorManager);
			return;
		}
		else
		{
			rest_value = RegExp.rightContext;
			var matched = RegExp.lastMatch;
			if(scormCompliant && badLanguageTypes.contains(matched))
			{
				setTypeMismatch(errorManager);
				return;
			}
		}
	}
	var re2 = ".{0," + stringLength + "}$";
	checkRegExp(rest_value, new RegExp(re2), errorManager);
}


function checkInteractionResponse(forLearner, value, errorManager, type)
{
	if(!scormCompliant)
		return;
	var reg = null;
	var short_identifier_type = "[a-zA-Z0-9\041-\045\047\050-\057\072\073\075\077\100\137\176]{1,255}";

	// unreserved | escaped | ":" | "@" | "&" | "=" | "+" | "$" | ","
	//                        072   100   046   075   053   044   054
	// unreserverd = alphanum | mark
	// mark = "-" | "_" | "." | "!" | "~" | "*" | "'" | "(" | ")"
	//        055   137   056   041   176   052   047   050   051
	//041 044 046 047 050 051 052 053 054 055 056 072 075 100 137 176
	//var short_identifier_type = "[a-zA-Z0-9\050-\057\041-\045\072\073\075\077\100\137\047]{1,255}";
	if(type == "true-false")
	{
		reg = "^(true|false)$";
	}
	else if (type == "choice")
	{
		var validated = true;
		//The set of short_identifier_types may contain zero or more short_identifier_types.
		//If a set of short_identifier_types is empty, it represents that the correct response
		//is no choice.
		if(value == "")
			return;
		var choices = value.split('[,]');
		var all_choices = new Array();
		for(i=0; i < choices.length; i++)
		{
			var c = choices[i];
			var reg = "^"+short_identifier_type+"$";
			var reExp = new RegExp(reg);
			if(reExp.test(c) && !all_choices.contains(c))
			{
				all_choices.push(c);
			}
			else
			{
				validated = false;
				break;
			}
		}
		if(!validated)
			setTypeMismatch(errorManager);
		return;
	}
	else if (type == "numeric")
	{
		if(!forLearner)
		{
			var numbers = value.split('[:]');
			if(numbers.length <= 1)
			{
				setTypeMismatch(errorManager);
				return;
			}
			var n1 = null;
			var n2 = null;
			if(numbers[0] != "" )
			{
				check_real_10_7(numbers[0], errorManager)
				if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)
					return;
				n1 = parseFloat(numbers[0]);
			}
			if(numbers[1] != "" )
			{
				check_real_10_7(numbers[1], errorManager)
				if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)
					return;
				n2 = parseFloat(numbers[1]);
			}
			if( n1 != null && n2 != null && n1 > n2)
				setTypeMismatch(errorManager);
		}
		else
			return check_real_10_7(value, errorManager);
	}
	else if (type == "likert")
	{
		reg = "^"+short_identifier_type+"$";
	}
	else if (type == "matching")
	{
		reg = "^"+short_identifier_type+"\\[\\.\\]"+short_identifier_type+"(\\[,\\]"+short_identifier_type+"\\[\\.\\]"+short_identifier_type+")*$";
	}
	else if (type == "fill-in")
	{
		var rest_value = value;
		if(!forLearner)
		{
			//Check for reserved delimiters: case_matters and order_matters for correct_responses
			var reg = "^\\{((case_matters=(.*))|(order_matters=(.*)))\\}";
			//var reg = "^\\{((lang=(.*))?((case_matters=(.*))|(order_matters=(.*)))+)\\}";
			var reExp = new RegExp(reg);
			if(reExp.test(value))
			{
				var re1 = "^(\\{((case_matters=(true|false))|(order_matters=(true|false)))\\})+";
				var reExp2 = new RegExp(re1);
				var foundArr = reExp2.exec(value);
				if(foundArr == null)
				{
					setTypeMismatch(errorManager);
					return;
				}
				else
				{
					rest_value = RegExp.rightContext;
				}
			}
		}
		var validated = true;
		var choices =rest_value.split('[,]');
		var all_choices = new Array();
		for(i=0; i < choices.length; i++)
		{
			var c = choices[i];
			checkLocalizedString(c, errorManager, 255);
			if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)
			{
				validated = false;
				break;
			}
		}
		if(!validated)
			setTypeMismatch(errorManager);
		return;
	}
	else if (type == "long-fill-in")
	{
		var rest_value = value;
		if(!forLearner)
		{
			var reg = "^\\{case_matters=(.*)\\}";
			//var reg = "^\\{((lang=(.*))?((case_matters=(.*))|(order_matters=(.*)))+)\\}";
			//var reg = "^\\{((lang=(.*))|(order_matters=(.*)))?(case_matters=(.*))+\\}";
			var reExp = new RegExp(reg);
			if(reExp.test(value))
			{
				var re1 = "^(\\{case_matters=(true|false)\\})";
				var reExp2 = new RegExp(re1);
				var foundArr = reExp2.exec(value);
				if(foundArr == null)
				{
					setTypeMismatch(errorManager);
					return;
				}
				else
				{
					rest_value = RegExp.rightContext;
				}
			}
		}
		checkLocalizedString(rest_value, errorManager, 4000);
		if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)
		{
			setTypeMismatch(errorManager);
		}
		return;

	}
	else if (type == "performance")
	{
		var rest_value = value;
		if(!forLearner)
		{
			var reg = "^\\{order_matters=(.*)\\}";
			var reExp = new RegExp(reg);
			if(reExp.test(value))
			{
				var re1 = "^\\{order_matters=(true|false)\\}";
				var reExp2 = new RegExp(re1);
				var foundArr = reExp2.exec(value);
				if(foundArr == null)
				{
					setTypeMismatch(errorManager);
					return;
				}
				else
				{
					rest_value = RegExp.rightContext;
				}
			}
		}
		var validated = true;
		var records =rest_value.split('[,]');
		for(i=0; i < records.length; i++)
		{
			var c = records[i];
			if(c == "")
			{
				validated = false;
				break;
			}
			var pair = c.split('[.]');
			//can have only two elements: step_name and step_answer
			if(pair.length <= 1 || pair.length >= 3)
			{
				validated = false;
				break;
			}
			//check pair[0] - step name
			if(pair[0] == "" && pair[1] == "")
			{
				validated = false;
				break;
			}
			if(pair[0] != "")
			{
				var r1 = "^"+short_identifier_type+"$";
				var re1 = new RegExp(r1);
				if(!re1.test(pair[0]))
				{
					validated = false;
					break;
				}
			}
			if(pair[1] != "")
			{
				var r2 = "^((([\\+\\-]?((\\d+)|(\\d*\\.\\d+)))?\\[:\\]([\\+\\-]?((\\d+)|(\\d*\\.\\d+)))?)|(.){0,255})$";
				var re2 = new RegExp(r2);
				if(!re2.test(pair[1]))
				{
					validated = false;
					break;
				}
			}

		}
		if(!validated)
		{
			setTypeMismatch(errorManager);
		}
		return;
	}
	else if (type == "sequencing")
	{
		reg = "^"+short_identifier_type+"(\\[,\\]"+short_identifier_type+")*$";
	}
	if(reg != null)
		checkRegExp(value, new RegExp(reg), errorManager);
}

function check_language_type(value, errorManager)
{
	if(value == "")
		return;
	var reg = "^(i|x|([a-zA-Z]{2,3}))(-(\\d{3,5}|[a-zA-Z]{2,8}))*$";
	checkRegExp(value, new RegExp(reg), errorManager);
}

function check_adl_nav_request148411(value, errorManager)
{

	if(contentFormatVersion == kSCORM2004Ed3Version)
		checkVocabulary(value, "adlNavRequest148411ed3", errorManager);
	else
		checkVocabulary(value, "adlNavRequest148411", errorManager);

	if (errorManager.getCurrentErrorCode() == errorManager.kNoErrorCode) return;

	errorManager.setCurrentErrorCode(errorManager.kNoErrorCode);

	var re = "^\\{target=[a-zA-Z0-9_][a-zA-Z0-9_.-]*\\}choice$";
	checkRegExp(value, new RegExp(re), errorManager);

	if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)  errorManager.setCurrentErrorCode(errorManager.kIncorrectDataTypeCode);


}

/***************************************** End SCORM 1.3 validation functions *************************/

function setTypeMismatch(errorManager)
{
	errorManager.setCurrentErrorCode(errorManager.kIncorrectDataTypeCode);
}

function setOutOfRange(errorManager)
{
	errorManager.setCurrentErrorCode(errorManager.kOutOfRangeCode);
}

// data_element.js
dbg("data_element.js: loaded data element");


/*
This file defines the classes responsible for representing the data model in the memory
The model is instantiated in data_model_interface.js

Element is an entry in the data model representing a single name-value pair
for example in SCORM 1.2 "student_name" is an element inside the container "cmi"
Elements have the following properties:
value,
validator function
vocabulary - if the element in list of values
witeable
readable
implemented - some elements may not be implemented by this runtime but they still must be present 
so that runtime knows that they are valid elements

Conainers are the compound onbjects that may contain other elements and containers. 
Container may be simple and countable. Simple container is just a holder for a bunch of unique elements. 
Countable container is a simple container with additional ability to store arrays of elements. 
The latter is needed in situations like interactions container.

Countable containers implement the method getValue(_count). Countable containers are created by instantiating a simple container, 
converting it into countable container with convertToCountableContainer() function and specifying an array item templeate -
the container that will be cloned when the next counted element (like interaction) needs to be instantiated.
To understand what I've just said :-) look at data_model_interface.js constructor where I create a data model tree

Elements belong to containers. Containers start from the root container. For example here is a structure for 
cmi.core.score.max element: root [ cmi [ core [ score [ max ] ] ] ] where root, cmi, core and score are containers
placed inside each other

GetValue and SetValue are propagated inside the container tree until the right element is found. If element is not found
the owning container sets up the an error message, the same happlens if the set value is not valid.
*/

/*
Limitations of current implementation
1. We are assuming that SCORM 1.2 Data Model Value Not Initialized (403) will never happen with our adapter
*/

/********************************** Start Element *********************************/


/*
Member functions
*/
function elementIsWriteable() { return this.writeable; }
function elementIsReadable() { return this.readable; }
function elementIsImplemented() { return this.implemented; }
function elementIsInitialized() { return this.initialized; }  
function elementIsMandatory() { return this.mandatory; }
function elementIsImplemented() { return this.implemented; }
function elementGetVocabularyType() { return this.vocabularyType; }
function elementGetValue() { return this.value; }
function elementGetType() { return this.type; }

function elementSetValue(value)
{

	dbg("elementSetValue=" + value)

	if (!openForInitialization) this.isDirty = true;
	this.value = value;
	this.initialized = true;

	dbg("elementSetValue2=" + this.value)

}

//clones the element
function elementClone()
{
	var clonedElement = new Element(this.getValue(),this.getType(),this.getVocabularyType(),this.isWriteable(),this.isReadable(),this.isMandatory(), this.isImplemented());
	if (this.initialized) clonedElement.initialized = true;
	return clonedElement;
}



//displays the element
function elementShow(offset)
{
	return "<v>" + xmlEncode(this.getValue()) + "</v>";
}


function elementIsClean()
{
	return !this.isDirty;
}

function elementMarkClean(cln)
{
	this.isDirty = !cln;
}

function elementInitialize()
{
	this.initialized = true;
}


/*
End member functions
*/

/*
Constructors
*/

function Element(value, type, vocabularyType, writeable, readable, mandatory, implemented)
{

	this.value = "";

	this.IsClean = elementIsClean;
	this.MarkClean = elementMarkClean;

	this.isDirty = false;

	//dbg("in element constructor");

	this.memberType = kElementMemberType;

	//value of the element
	this.value = value;

   // The type of the element
	this.type = type;
   
   // The vocabulary type
	this.vocabularyType = vocabularyType;

   // Whether or not the element can be set by an AU
	this.writeable = writeable;

   // Whether or not the element can be seen by an AU
	this.readable = readable;
   
   // Whether or not the element is mandatory
	this.mandatory = mandatory;

   // Whether or not the LMS has implemented the element
	this.implemented = implemented;

   // Whether or not the LMS has initialized the element
	this.initialized = (value != "");
	
	
   
	this.isWriteable = elementIsWriteable;
	this.isReadable = elementIsReadable;
	this.isImplemented = elementIsImplemented;
	this.isInitialized = elementIsInitialized;
	this.isMandatory = elementIsMandatory;
	this.isImplemented = elementIsImplemented;
	this.getVocabularyType = elementGetVocabularyType;
	this.getValue = elementGetValue;
	this.getType = elementGetType;
	this.setValue = elementSetValue;
	this.clone = elementClone;
	this.show = elementShow;
	this.initialize = elementInitialize;

	this.createCommentsElement = elementCreateCommentsElement;
}


/********************************** End Element ***************************************/
/********************************** Start Comments Element*****************************/

/*
	Element cmi.comments is different from Element since SetValue should create a 
	concatenation of old and new value but <= 4096 characters.
*/

function elementCreateCommentsElement()
{
	this.setValue = commentsElementSetValue;
	this.processSetValue = elementSetValue;
}


function commentsElementSetValue(value)
{
	var oldVal = this.getValue();
	var newVal = oldVal + value;
	if (newVal.length > 4096) newVal = newVal.substring(0,4096);
	this.processSetValue(newVal);
}

/********************************** End Comments Element ***************************************/
/********************************** Start Simple Container*****************************/

function Container(name)
{

	//dbg("in container constructor " + name);
	this.memberType = kContainerMemberType;

	//needed instead instanceof operator in java
	this.name = name;
	
	//defines the prerequiste data element whose value must be set before any other elements can be set.
	//For example, the cmi.interactions.n.id must be set before the other elements can be set	
	this.firstToSetElementKey = null;

	//once elements and containers are added to this container
	//these holders will be updated
	this.elements = new Object();
	this.elementKeys = new Array();
	this.containers = new Object();
	this.containerKeys = new Array();
	
	this.setItem = cntSetItem;
	
	//this one is needed for CountableContainer to call a superclass function since there is no "super" in javascript
	this.cntGetValue = cntGetValue;
	//this one will be overwritten by countable container if we decide to conver the container into countable container
	this.getValue = cntGetValue;

	//this one is needed for CountableContainer to call a superclass function since there is no "super" in javascript
	this.cntSetValue = cntSetValue;
	//this one will be overwritten by countable container if we decide to conver the container into countable container
	this.setValue = cntSetValue;
	
	this.setFirstToSetElementKey = function(key) {this.firstToSetElementKey = key;}
	this.isFirstElementSet = cntIsFirstElementSet;
	
	//this will convert a simple container into a countable container
	this.createCountableContainer = cntCreateCountableContainer;

	//creates a special container for adl.nav.request_valid
	this.createAdlRequestValidContainer= cntCreateAdlRequestValidContainer;
	
	this.clone = cntClone;
	this.cntClone = cntClone;
	this.show = cntShow;
	//this.cntShow = cntShow;
	//will be overridden by countable container
	this.showExtension = cntShowExtension;

	this.IsClean = cntIsClean;
	this.MarkClean = cntMarkClean;

	//hack to remember the interaction type for cmi.interactions.n.correct_responses.m.pattern
	this.interactionType = null;
	this.setInteractionType = function(itype) {this.interactionType = itype;}
	this.getInteractionType = function() { return this.interactionType; }
	
	//dbg("ended container constructor");
}


//check if the prerequisite element has been set before the key
//If the key is the prerequisite element itself, ignore it and return true.
function cntIsFirstElementSet(key)
{
	var rtn = true;
	if((this.firstToSetElementKey != null) && (this.firstToSetElementKey != key))
	{
		var element = this.elements[this.firstToSetElementKey];
		if( element != null )
		{
			var value = element.getValue();
			if(value != null && value != "")
				rtn = true;
			else
				rtn = false;
		}
	}
	return rtn;
}

function cntShowExtension(offset)
{
	return "";
}

function cntIsClean()
{

	for (var i=0; i<this.elementKeys.length; i++)
	{

		if (!this.elements[this.elementKeys[i]].IsClean()) return false;
	}
	for (var i=0; i<this.containerKeys.length; i++)
	{
		if (!this.containers[this.containerKeys[i]].IsClean()) return false;
	}	
	return true;
	
}

function cntMarkClean()
{

	//dbg("cntMarkClean");

	for (var i=0; i<this.elementKeys.length; i++)
	{

		this.elements[this.elementKeys[i]].MarkClean();
	}

	//dbg("cntMarkClean 2");

	for (var i=0; i<this.containerKeys.length; i++)
	{
		this.containers[this.containerKeys[i]].MarkClean();
	}		

	//dbg("cntMarkClean 3");

}

//Displaying the container for debug purposes only
function cntShow(offset)
{

	var out ="";

	for (var i=0; i<this.elementKeys.length; i++)
	{
		if (this.elements[this.elementKeys[i]].isWriteable())
		{
			hasElements = true;
			out += "<e>" + this.elementKeys[i] + this.elements[this.elementKeys[i]].show(offset + 3) + "</e>";
		}
	}

	for (var i=0; i<this.containerKeys.length; i++)
	{
		out += "<c>" + this.containerKeys[i] + "";
		out += this.containers[this.containerKeys[i]].show(offset + 3);
		out += "</c>";
	}	
	out += this.showExtension(offset + 1);
	

	return out;
}

/*
Creating the exact copy of the container with all the data inside it
*/
function cntClone()
{
	var output = new Container("");
	
	//first copy lists of element and container names
	output.containerKeys = this.containerKeys;
	output.elementKeys = this.elementKeys;
	
	//browse through container names and copy containers
	for (var i=0; i<this.containerKeys.length; i++)
	{
		//clone each container
		var cln = this.containers[this.containerKeys[i]].clone();
		output.containers[this.containerKeys[i]] = cln;
	}
	
	//browse through element names and copy elements
	for (var i=0; i<this.elementKeys.length; i++)
	{
		var cln = this.elements[this.elementKeys[i]].clone();
		output.elements[this.elementKeys[i]] =  cln;
	}
	
	//chainging the name so that it makes sence for debug. This name is not used b business logic
	output.name = this.name + Math.random();
	//also copy the firstToSetElementKey and interactionType
	output.firstToSetElementKey = this.firstToSetElementKey;
	output.interactionType = this.interactionType;
	return output;
}

//allows to set Element, Container or CountableContainer as an item
function cntSetItem(key, item)
{
	//dbg("in set item")
	if (item.memberType == kElementMemberType) 
	{
		this.elementKeys[this.elementKeys.length] = key;
		this.elements[key] = item;
	}
	else if (item.memberType == kContainerMemberType || item.memberType == kCountableContainerMemberType) 
	{
		this.containerKeys[this.containerKeys.length] = key;
		this.containers[key] = item;
	}
	else alert("data element: unknown type " + item.memberType);
	//dbg("finished setting item");
}


/*
The container must get value of either element or inner container or inner countable container
Assumes that after Initialize() all the appropriate data model elements are initialized
*/

function cntGetValue(key, errorManager)
{
	dbg("container get value in simple container key=" + key + " container name=" + this.name);

	if(key == "")
	{
		errorManager.setCurrentErrorCode(errorManager.kGeneralGetFailureCode);
		return "";
	}


	//first try elements
	//2do: add "element has no _count (_children)" handler
	var elem = this.elements[key];
	if (elem != null)
	{
		//found exact element
			
		//check if the element is implemented
		if (!elem.isImplemented())
		{
			//note that in SCORM 1.2 this points to 401 in SCORM 1.3 this points to 402
			errorManager.setCurrentErrorCode(errorManager.kNotImplementedErrorCode);
			return "";
		}	
				
		//check if it is readable
		if (!elem.isReadable())
		{
			errorManager.setCurrentErrorCode(errorManager.kElementIsWriteOnlyCode);
			return "";
		}
		
		//check if it is initialized
		if (!elem.isInitialized())
		{
			errorManager.setCurrentErrorCode(errorManager.kNotInitializedErrorCode);
			return "";
		}
				
		//get the value
		return this.elements[key].getValue();
	}
	
	//then try containers
	//containers won't have exact match but the key should start with a container name
	for (var i=0; i<this.containerKeys.length; i++)
	{
		if (key.indexOf(this.containerKeys[i]) == 0)
		{
			//found the container whose name is in the beginning of the key
			//need to delegate the next steps to this container
			var cont = this.containers[this.containerKeys[i]];
			var dotPosition = key.indexOf(".");
			var newKey = key.substring(dotPosition + 1, key.length);
			return cont.getValue(newKey, errorManager);
		}
	}
	
	//if _children element is not set up explicitly
	//set a separate error code for children
	if (key == "_children")
	{
		errorManager.setCurrentErrorCode(errorManager.kElementCannotHaveChildrenCode);
		return "";
	}
	//non countable container cannot have count
	//this will be overridden by countable container
	if (key == "_count")
	{
		errorManager.setCurrentErrorCode(errorManager.kElementCannotHaveCountCode);
		return "";
	}



	//so far it is not an element, not a container, not a _count or _children word
	//let's check if the element name is used as a container e.g. somebody
	//tries to call cmi.launch_data._children
	var dot2position = key.indexOf(".")
	if (dot2position > -1)
	{
		var firstPart = key.substring(0, dot2position);
		var lastPart = key.substring(dot2position + 1, key.length);
		var elem2 = this.elements[firstPart];
		if (elem2 != null)
		{
			//attempt to treat element as container
			if (lastPart == "_count")
			{
				dbg("%%%%%%%%%%%%%%%% here")
				errorManager.setCurrentErrorCode(errorManager.kElementCannotHaveCountCode);
				return "";
			}
			else if (lastPart == "_children")
			{
				dbg("%%%%%%%%%%%%%%%% here 1")
				errorManager.setCurrentErrorCode(errorManager.kElementCannotHaveChildrenCode);
				return "";
			}
			
		}
		
	}

	
	dbg("no such element " + key )	
	//no such element
	//Handle the case where we should generate an error code "401" for LMSGetValue("xyz.score.result") for 1.2 
	if( this.name == "root")
	{
		errorManager.setCurrentErrorCode(errorManager.kNotValideDataModelElement);
	}
	else
		errorManager.setCurrentErrorCode(errorManager.kNotDefinedErrorCode);
	return "";
	
}

/*
The container must set value of either element or inner container or inner countable container
*/
function cntSetValue(key, value, errorManager)
{
	//dbg("started set value in container " + this.name + " key=" + key + " value=" + value);
	
	if (isSCORM2004() && key == "")
	{
		errorManager.setCurrentErrorCode(errorManager.kGeneralSetFailureCode);
		return kFalse;
	}
	
	
	//check if there is an atempt to set a keyword
	if (key == "_children" || key == "_count" || key == "_version")
	{
		//it is prohibited to set keywords
		//in SCORM 1.3 it maps to "element is read only" error code
		errorManager.setCurrentErrorCode(errorManager.kElementIsKeywordCode);
		return kFalse;
	}
	
	//first try elements
	var elem = this.elements[key];
	//get the interaction type if available. We need to pass the interaction type the the validate function
	//for correct_responses and learner_response data elements
	var intType = null;
	if ( elem != null)
	{
		//found exact element
		//2do: run validator
		
		dbg("@@@elem != null " + key)
		if(isSCORM2004() && !this.isFirstElementSet(key))
		{
			//The required element not being set yet..
			errorManager.setCurrentErrorCode(errorManager.kDataModelDependencyNotEstablished);
			return kFalse;
		}
		//hack to take care of cmi.interactions.n.learner_response
		//that requires both cmi.interactions.id and cmi.interactions.type being set before
		if(isSCORM2004())
		{
			if(key == 'learner_response')
			{
				var type = this.elements["type"];
				if(type != null)
				{
					intType = type.getValue();
					if(intType == null || intType == "")
					{
						//The required element not being set yet..
						errorManager.setCurrentErrorCode(errorManager.kDataModelDependencyNotEstablished);
						return kFalse;
					}
				}
			} 
			else if (key == 'pattern')
			{
				//remember the interaction type so that we can validate the pattern later
				dbg('setting pattern for '+this.name+': type='+this.getInteractionType());
				intType = this.getInteractionType();
			}
		}
		//check if it is writeable
		if (!elem.isWriteable() && !openForInitialization)
		{
			//element is not writeable
			errorManager.setCurrentErrorCode(errorManager.kElementIsReadOnlyCode);
			return kFalse;
		}
		
		
		
		//validation
		var validationFunction = elem.getType();
		if (validationFunction != null && validationFunction != "")
		{
		
			//do actual validation
			if (validationFunction == "checkVocabulary")
			{
				//checking LOV
				checkVocabulary(value, elem.getVocabularyType(), errorManager);
				//check if error manager returned an error
				//I do this instead of returning false because in SCORM 1.3 there are type mismatch and out-of-range errors
				//and they need to be detected during validation
				
				//dbg("after check " + errorManager.getCurrentErrorCode());
				
				if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)
				{
					//failed validation, the right error code it set up by the validation function
					return kFalse;
				}
				
				//dbg("after check");
				
			}
			else
			{
				
				var valExpression = null;
				//interaction response validator depends on the interaction type
				if ((validationFunction == "checkCorrectResponses") || (validationFunction == "checkLearnerResponse"))
				{
					valExpression = validationFunction + "(value, errorManager, intType)"
				} 
				else
					valExpression =validationFunction + "(value, errorManager)"
					
				//dbg("va function but not vocabulary " + valExpression );
				eval(valExpression);
				if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)
				{
					//dbg("Failed element validation")
					//failed validation, the right error code it set up by the validation function
					return kFalse;
				}

			}
		}
		
		//dbg("before value=" + value)
		//passed the validation set the value
		if (!openForInitialization) this.isDirty = true;

		dbg("setting value=" + value);

		elem.setValue(value);
		return kTrue;

	}
	
	//dbg("didn't find elements " + key)
	
	//then try containers
	//containers won't have exact match but the key should start with a container name
	for (var i=0; i<this.containerKeys.length; i++)
	{
		if (key.indexOf(this.containerKeys[i]) == 0)
		{
			//check if the required element has been set or not before processing 
			//this container
			if(isSCORM2004() && !this.isFirstElementSet(key))
			{
				//The required element not being set yet..
				errorManager.setCurrentErrorCode(errorManager.kDataModelDependencyNotEstablished);
				return kFalse;
			}
			
			var dotPosition = key.indexOf(".");
			var newKey = key.substring(dotPosition + 1, key.length);
			
			var intType = null;
			//correct_responses can not be set unless both interactions.id and interactions.type elements are set
			if(isSCORM2004() && key.indexOf('correct_responses.') == 0)
			{
				var type = this.elements["type"];
				if(type != null)
				{
					intType = type.getValue();
					if(intType == null || intType == "")
					{
						//The required element type not being set yet..
						errorManager.setCurrentErrorCode(errorManager.kDataModelDependencyNotEstablished);
						return kFalse;
					}
					dbg('set interactiontype for correct_responses container:'+intType);
					this.containers[this.containerKeys[i]].setInteractionType(intType);
				}
				// There is only one correct response for true-false/likert/numeric/other type interaction. Set error code to "351" if
				// a SCO tries to store an additional pattern
				if(newKey.indexOf("0.") != 0 && 
					(intType == 'true-false' || intType == 'likert' || intType == 'numeric' || intType == 'other'))
				{
					errorManager.setCurrentErrorCode(errorManager.kGeneralSetFailureCode);
					return kFalse;
				}
			}
			//found the container whose name is in the beginning of the key
			//need to delegate the next steps to this container
			var cont = this.containers[this.containerKeys[i]];
			return cont.setValue(newKey, value, errorManager);
		}
	}

	//dbg("didn't find containers " + key)
	
	//no such element
	//Handle the case where we should generate an error code "401" for LMSGetValue("xyz.score.result") for 1.2 
	if( this.name == "root")
	{
		errorManager.setCurrentErrorCode(errorManager.kNotValideDataModelElement);
	}
	else
		errorManager.setCurrentErrorCode(errorManager.kNotDefinedErrorCode);
	return kFalse;
	
}
/********************************** End Simple Container*****************************/
/********************************** Start Countable Container************************/

/*
Converts a simple container to the one that has a numbered array (like interactions)
addes the actual array member and overwrites getValue and setValue methods so they
can get and set from numbered array
*/
function cntCreateCountableContainer()
{
	//dbg("in create countable container")
	this.memberType = kCountableContainerMemberType;
	
	//each child must be a container or countable container
	this.childArray = new Array();
	//this variable stores a prototype for future array members
	this.arrayItemTemplate = null;
	
	//overriding setValue and getValue of a superclass
	this.getValue = cocntGetValue;
	this.setValue = cocntSetValue;
	this.clone = cocntClone;
	
	//overwrrides the method of the container to provide indexed array info and indexer template
	this.showExtension = cocntShowExtension;
	
	//method used for testing, in real life this will be done by setValue()
	this.appendChild = cocntAppendChild;
	
	this.setArrayItemTemplate = cocntSetArrayItemTemplate;
	
	//dbg("ended create countable container");
}

function cocntShowExtension(offset)
{
	var out = "";

	out += "<a>" + this.childArray.length;
	for (var i=0; i<this.childArray.length; i++)
	{
		out += "<i>";
		out+= this.childArray[i].show(offset + 1);
		out += "</i>";
	}
	out += "</a>";

	return out;
}

function cocntClone()
{
	var output = this.cntClone();
	output.createCountableContainer();
	var template = this.arrayItemTemplate.clone();
	template.setInteractionType(this.getInteractionType());
	output.setArrayItemTemplate(this.arrayItemTemplate.clone());
	for (var i=0; i<this.childArray.length; i++)
	{
		output.childArray[i] = this.childArray[i].clone();
	}
	return output;
}

/*
Overrides getValue() of a container
First tries to fetch data from countable array, them calls super.getValue()
*/
function cocntGetValue(key, errorManager)
{
	//dbg("countable get value of subclass key=" + key + " container=" + this.name);
	
	var dotPosition = key.indexOf(".");
	var firstPart = key.substring(0,1);
	var allDigits = "0123456789";
		
	if (key == "_count")
	{
		//dbg("returning count")
		return "" + this.childArray.length;
	}
	else if(allDigits.indexOf(firstPart) > -1)
	{
		//dbg("found a digit")
		//this is an indexer
		//first let's make sure we have that many items in the array
		var wholeDigit = key.substring(0,dotPosition);		
		var nmb = parseInt(wholeDigit);
		
		//dbg("nmb=" + nmb + " fp=" + firstPart)



		if (this.childArray.length < nmb+1)
		{

			//there are no array items with such an index
			//in theory we should have returned "invalid argument" but ADL
			//wants us to return Write-only in case the test tries to get interaction parameters
			//this is why we are checking if the element is write-only using 
			//the template container/element
			if(!isSCORM2004())
			{
				var tmpItem = this.arrayItemTemplate.clone();
	
				var newKey = key.substring(dotPosition+1, key.length);		
				tmpItem.getValue(newKey, errorManager);
	
				if (errorManager.getCurrentErrorCode() == errorManager.kElementIsWriteOnlyCode || errorManager.getCurrentErrorCode() == errorManager.kNoErrorCode)
				{
					return "";
				}
			}
			//schang: CR71829 - changed from kInvalidArgumentErrorCode to kGeneralGetFailureCode
			errorManager.setCurrentErrorCode(errorManager.kGeneralGetFailureCode);
			return "";
		}

		//get here if index is OK, fetch the container
		var item = this.childArray[nmb];
		var newKey = key.substring(dotPosition+1, key.length);
		return item.getValue(newKey, errorManager);
	}
	else
	{
		//dbg("call superclass")
		//treat yourself as a container. If nothing is found here, error code will be set up
		return this.cntGetValue(key, errorManager)
	}
}

/*
overrides setValue() of a container
*/
function cocntSetValue(key, value, errorManager)
{
	//dbg("de: countable set value of subclass key=" + key + " container=" + this.name + " value=" + value);
	
	var dotPosition = key.indexOf(".");
	var firstPart = key.substring(0,1);
	var allDigits = "0123456789";
		
	if(allDigits.indexOf(firstPart) > -1)
	{
		//dbg("found a digit")
		//this is an indexer
		//first let's make sure we have that many items in the array

		var wholeDigit = key.substring(0,dotPosition);		
		var nmb = parseInt(wholeDigit);
		

		//the index is too large e.g. array size=2 and index=5
		//dbg("de: child array length=" + this.childArray.length + " nmb=" + nmb);
		if (this.childArray.length < nmb)
		{
			/*	in content compliance testing mode, we are setting error code 210,
				so that we can give proper error messages from testing tool
			*/
			if (checkContentComplianceTest)
			{
				errorManager.setCurrentErrorCode("210");
			}
			else
			{
				//dbg("de: array is small")
				//the index is too large 2do: set the right error code
				errorManager.setCurrentErrorCode(errorManager.kElementsetOutOfOrderCode);

				//dbg("de: ats array size=" + this.childArray.length);
			}

			return kFalse;
		}


		if (this.childArray.length == nmb)
		{

			//dbg("de: need to create new item for " + key + " " + value)

			//2do: create new entry
			//dbg("template=" + this.arrayItemTemplate.show());
			var copy = this.arrayItemTemplate.clone();
			//pass along the interactionType to the copied container so that it can keep that information
			if(copy.memberType != kElementMemberType)
			{
				copy.setInteractionType(this.interactionType);
			}

			var newKey1 = key.substring(dotPosition+1, key.length);

			//before we add the item to array we need to make sure it doesn't throw error code during the attempt to set it
			copy.setValue(newKey1, value, errorManager);

			if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)
			{
				//failed to se the value for some reason
				//dbg("de: failed to set the value of the new array item " + newKey1 + " " + value);

				//dbg("de: failed to create new item array size=" + this.childArray.length);

				return kFalse;
			}
			
			//Enforce the uniqueness for interactions.n.correct_responses.m.pattern for interaction types 'choice' and 
			//'sequencing'
			var isDuplicated =false;
			if(isSCORM2004() && scormCompliant && 
				(this.name.indexOf('correct_responses') == 0) && (newKey1 == 'pattern')) 
			{
				var i;
				//the order of items is not significant for choice
				if (this.interactionType == 'choice')
				{
					var newChoices = value.split('[,]').sort().toString();
					for(i=0; i <= this.childArray.length-1; ++i)
					{
						var choices = this.childArray[i].getValue('pattern').split('[,]').sort().toString();
						if(newChoices == choices)
						{
							dbg('duplicate pattern:'+value);
							isDuplicated = true;
							break;
						}
					}
				}
				//the order of items is significant for sequencing
				if (this.interactionType == 'sequencing' )
				{
					for(i=0; i <= this.childArray.length-1; ++i)
					{
						if (this.childArray[i].getValue('pattern') == value)
						{
							dbg('duplicate pattern:'+value);
							isDuplicated = true;
							break;
						}
					}
				}
			}
			
			//Enforce the uniqueness for cmi.interactions.n.objectives.m.id and cmi.objectives.n.id data element	
			if(isSCORM2004() && scormCompliant && 
				((this.name.indexOf('objectives') == 0) || (this.name.indexOf('interaction_objectives')) == 0) && (newKey1 == 'id')) 
			{
				for(i=0; i <= this.childArray.length-1; ++i)
				{
					if (this.childArray[i].getValue('id') == value)
					{
						dbg('duplicate pattern:'+value);
						isDuplicated = true;
						break;
					}
				}
			}
			//end of checking uniqueness 
			if(!isDuplicated)
			{
				//add new item to the array
				this.childArray[this.childArray.length] = copy;			
				dbg("de: successded create new item array size=" + this.childArray.length);
				return kTrue;
			}
			else
			{
				errorManager.setCurrentErrorCode(errorManager.kGeneralSetFailureCode);
				return kFalse;
			}
		}


		//dbg("array size is OK no new item needed");
		var newKey = key.substring(dotPosition+1, key.length);
		
		//Enforce the uniqueness for interactions.n.correct_responses.m.pattern for interaction types 'choice' and 
		//'sequencing'
		var isDuplicated = false;
		var isChanged = false;
		if(isSCORM2004() && scormCompliant && 
			(this.name.indexOf('correct_responses') == 0) && (newKey == 'pattern')) 
		{
			var i;
			//the order of items is not significant for choice
			if (this.interactionType == 'choice')
			{
				var newChoices = value.split('[,]').sort().toString();
				for(i=0; i <= this.childArray.length-1; ++i)
				{
					//ignore the original existing one....
					if( i == nmb )
						continue;
					var choices = this.childArray[i].getValue('pattern').split('[,]').sort().toString();
					dbg('choices['+i+']='+choices);
					if(newChoices == choices)
					{
						dbg('duplicate pattern:'+value);
						isDuplicated = true;
						break;
					}
				}
			}
			//the order of items is significant for sequencing
			if (this.interactionType == 'sequencing' )
			{
				for(i=0; i <= this.childArray.length-1; ++i)
				{
					//ignore the original existing one....
					if( i == nmb )
						continue;
					if (this.childArray[i].getValue('pattern') == value)
					{
						dbg('duplicate pattern:'+value);
						isDuplicated = true;
						break;
					}
				}
			}
		}
		//Enforce the uniqueness for cmi.interactions.n.objectives.m.id and cmi.objectives.n.id data element	
		if(isSCORM2004() && scormCompliant && 
			((this.name.indexOf('objectives') == 0) || (this.name.indexOf('interaction_objectives')) == 0) && (newKey == 'id')) 
		{
			dbg('checking for objectives uniqueness: name=' +this.name);
			for(i=0; i <= this.childArray.length-1; ++i)
			{
				//ignore the original existing one....
				if( i == nmb )
				{
					//Enforce the immutableness only for SCORM 2004 ED3 so that once it is set can't be reset to another value
					if((contentFormatVersion == kSCORM2004Ed3Version) && (this.name.indexOf('objectives') == 0))
					{
						// Check only for objectives.id and not for interaction_objectives.id
						if (this.childArray[nmb].getValue('id') != value)
						{
							dbg('Changed pattern:');
							isChanged = true;
							break;
						}
					}
					continue;
				}
				if (this.childArray[i].getValue('id') == value)
				{
					dbg('duplicate pattern:'+value);
					isDuplicated = true;
					break;
				}
			}
		}

		if(isDuplicated || isChanged)
		{
			errorManager.setCurrentErrorCode(errorManager.kGeneralSetFailureCode);
			return kFalse;
		}
		var item = this.childArray[nmb];
		dbg("new key=" + newKey + " " + item.memberType);

		//dbg("de: default case new item array size=" + this.childArray.length);

		return item.setValue(newKey, value, errorManager);
		

	}
	else
	{
		//dbg("de: call superclass")
		//treat yourself as a container. If nothing is found here, error code will be set up
		return this.cntSetValue(key, value, errorManager);
	}
}

/*
used only for testing of setValue without the need to call getValue
*/
function cocntAppendChild(container)
{
	this.childArray[this.childArray.length] = container;
}

function cocntSetArrayItemTemplate(container)
{
	this.arrayItemTemplate = container;
}

/*************************************** end countable container ************************************************/
/************************************** begin adl.nav.request_valid container ***********************************/

function cntCreateAdlRequestValidContainer()
{

	this.getValue = rvcntGetValue;
	this.setValue = rvcntSetValue;
	this.allowedRequests = new Array();

}

function rvcntGetValue(key, errorManager)
{

	//key maybe only 'continue', 'previous', or 'choice.{target=<value>}'
	if (key != "continue" && key != "previous" && key.indexOf("choice.{target=") == -1)
	{
		dbg("ADL: !!! not a valid key ");
		errorManager.setCurrentErrorCode(errorManager.kIncorrectDataTypeCode);
		return "";
	}

	if (this.allowedRequests[key] == null) 
	{
		dbg("ADL: !!! couldnt find " + key);
		return "unknown";
	}
	else 
	{
		dbg("ADL: !!! found " + key + "=" + this.allowedRequests[key]);	
		return this.allowedRequests[key];
	}

	
}

//since requests can be of type choice{target=xxx}, instead of creating element objects
//just store the possible request in named array
//Initialize() will set the array up
function rvcntSetValue(key, value, errorManager)
{

	dbg("ADL: setting " + key + "=" + value);

	errorManager.setCurrentErrorCode(errorManager.kNoErrorCode);


	if (!openForInitialization) 
	{
		dbg("ADL: not open for initialization");
		errorManager.setCurrentErrorCode(errorManager.kElementIsReadOnlyCode);
		return kFalse;
	}

	checkVocabulary(value, "adlNavRequestValid148411", errorManager)

	if (errorManager.getCurrentErrorCode() != errorManager.kNoErrorCode)
	{
		dbg("ADL: didnt pass vocabulary");
		errorManager.setCurrentErrorCode(errorManager.kElementIsReadOnlyCode);
		return kFalse;
	}
	
	dbg("ADL: SET");
	
	this.allowedRequests[key] = value;

	return kTrue;
	
}

/************************************** end adl.nav.request_valid container ***********************************/



// error_manager.js
/*
	Member methods for ErrorManager object
*/

function getCurrentErrorCode() 
{
	return this.currentErrorCode;
}
	
function setCurrentErrorCode(code) 
{
	this.currentErrorCode = code;
}


function clearCurrentErrorCode() 
{
	this.currentErrorCode = this.errors["0"][0];
}


function getErrorDescription(code) 
{
	if (code == null || code == "") return "";
	var error = this.getErrorElement(code);
	//if this is an invalid error code, return empty string
	if(error == null) return "";
	var desc = error[1];
	return desc;
	
	
}

function getErrorDiagnostic(code) 
{
	if (code == null || code == "") return "";
	var error = this.getErrorElement(code);
	//if this is an invalid error code, return empty string
	if(error == null) return "";
	var diag = error[2];
	//if diag returns empty, we can use description field
	if(diag == "")
		diag = error[1];
	return diag;
}

function getErrorElement(code)
{
	var thisEl = this.errors[code];
	if(thisEl == 'undefined')
	{
		thisEl = null;
	}
	return 	thisEl;
}

/*
End member methods for ErrorManager object
*/

/*
Constructor for ErrorManager object
*/
function ErrorManager(scormVersion)
{
	this.kNoErrorCode = "0";
	this.currentErrorCode = this.kNoErrorCode;
	this.errors = new Object();

	this.errors[""] = new Array("", "", "");
	
	this.errors[this.kNoErrorCode] = new Array(this.kNoErrorCode, "No error", "The previous LMS API Function call completed successfully.");
	
	//initializing error records
	if (scormVersion == kVersion12)
	{



		this.kGeneralExceptionCode = "101";
		//fake 1.3 codes used in order to reuse Initialize() function
		this.kGeneralInitializationFailureCode = this.kGeneralExceptionCode;
		this.kAlreadyInitializedCode = this.kGeneralExceptionCode;
		this.kContentInstanceTerminatedCode = this.kGeneralExceptionCode;
		//fake 1.3 codes used in order to reuse Terminate() function
		this.kGeneralTerminationFailureCode = this.kGeneralExceptionCode;
		this.kTerminationAfterTerminationFailureCode = this.kGeneralExceptionCode;
		//fake 1.3 codes used in order to reuse Commit() function
		this.kGeneralCommitFailureCode = this.kGeneralExceptionCode;
		this.kCommitAfterTerminationFailureCode = this.kGeneralExceptionCode;
		//fake 1.3 codes used in order to reuse GetValue() function
		this.kNotInitializedErrorCode = this.kGeneralExceptionCode;
		
		//fake 1.3 codes used in order to reuse SetValue() function
		//probably our API will never use this code
		this.kGeneralSetFailureCode = this.kGeneralExceptionCode;
		
		this.errors[this.kGeneralExceptionCode] = new Array(this.kGeneralExceptionCode, "General Exception", "General exception occurred.");
	
		this.kInvalidArgumentErrorCode="201";
		this.errors[this.kInvalidArgumentErrorCode] = new Array(this.kInvalidArgumentErrorCode, "Invalid argument error", "Element specified does not exist.");
		this.kElementsetOutOfOrderCode = this.kInvalidArgumentErrorCode;		

		this.kElementCannotHaveChildrenCode = "202";
		this.kElementCannotHaveCountCode = "203";
		this.errors[this.kElementCannotHaveChildrenCode] = new Array(this.kElementCannotHaveChildrenCode, "Element cannot have children", "Element can not have children.");
		this.errors[this.kElementCannotHaveCountCode] = new Array(this.kElementCannotHaveCountCode, "Element not an array - Cannot have count", "Element is not an array. It can not have count.");
		
		this.kLMSNotInitializedCode = "301";
		//fake 1.3 codes used in order to reuse Terminate() function
		this.kTerminationBeforeInitializationFailureCode = this.kLMSNotInitializedCode;
		//fake 1.3 codes used in order to reuse Commit() function
		this.kCommitBeforeInitializationFailureCode = this.kLMSNotInitializedCode;
		//fake 1.3 codes used in order to reuse GetValue() function
		this.kRetrieveDataBeforeInitializationCode = this.kLMSNotInitializedCode;
		this.kRetrieveDataAfterTerminationCode = this.kGeneralExceptionCode;
		//fake 1.3 codes used in order to reuse SetValue() function
		this.kStoreDataBeforeInitializationCode=this.kLMSNotInitializedCode;
		this.kStoreDataAfterTerminationCode=this.kGeneralExceptionCode;
		
		this.errors[this.kLMSNotInitializedCode] = new Array(this.kLMSNotInitializedCode, "Not initialized", "Communication with LMS is not initialized.");
	 
		this.kNotImplementedErrorCode = "401";
		this.kNotValideDataModelElement = this.kNotImplementedErrorCode;
		this.kNotDefinedErrorCode = this.kInvalidArgumentErrorCode;
		//probably our API will never use this code
		this.kGeneralGetFailureCode = this.kInvalidArgumentErrorCode;
		this.errors[this.kNotImplementedErrorCode] = new Array(this.kNotImplementedErrorCode, "Not implemented error", "The specified element is not implemented.");
		this.kElementIsKeywordCode = "402";
		this.errors[this.kElementIsKeywordCode] = new Array(this.kElementIsKeywordCode, "Invalid set value, element is a keyword", "Invalid set value, element is a keyword.");
		
		this.kElementIsReadOnlyCode="403";
		this.errors[this.kElementIsReadOnlyCode] = new Array(this.kElementIsReadOnlyCode, "Element is read only", "Element is read only.");
		
		this.kElementIsWriteOnlyCode="404";
		this.errors[this.kElementIsWriteOnlyCode] = new Array(this.kElementIsWriteOnlyCode, "Element is write only", "Element is write only.");
		
		this.kIncorrectDataTypeCode = "405";
		this.kOutOfRangeCode = this.kIncorrectDataTypeCode;
		this.errors[this.kIncorrectDataTypeCode] = new Array(this.kIncorrectDataTypeCode, "Incorrect Data Type", "The specified value is incorrect.");
	}
	else
	{
		this.kGeneralExceptionCode = "101";
		this.errors[this.kGeneralExceptionCode] = new Array(this.kGeneralExceptionCode, "General Exception", "");
		
		// initialization codes
		this.kGeneralInitializationFailureCode = "102";
		this.errors[this.kGeneralInitializationFailureCode] = new Array(this.kGeneralInitializationFailureCode, "General Initialization Failure", "");
		this.kAlreadyInitializedCode = "103";
		this.errors[this.kAlreadyInitializedCode] = new Array(this.kAlreadyInitializedCode, "Already Initialized", "");
		this.kContentInstanceTerminatedCode = "104";
		this.errors[this.kContentInstanceTerminatedCode] = new Array(this.kContentInstanceTerminatedCode, "Content Instance Terminated", "");
		
		//termination codes
		this.kGeneralTerminationFailureCode = "111";
		this.errors[this.kGeneralTerminationFailureCode] = new Array(this.kGeneralTerminationFailureCode, "General Termination Failure", "");
		this.kTerminationBeforeInitializationFailureCode = "112";
		this.errors[this.kTerminationBeforeInitializationFailureCode] = new Array(this.kTerminationBeforeInitializationFailureCode, "Termination Before Initialization", "");
		this.kTerminationAfterTerminationFailureCode = "113";
		this.errors[this.kTerminationAfterTerminationFailureCode] = new Array(this.kTerminationAfterTerminationFailureCode, "Termination After Termination", "");
		
		//setter and getter codes
		this.kRetrieveDataBeforeInitializationCode = "122";
		this.errors[this.kRetrieveDataBeforeInitializationCode] = new Array(this.kRetrieveDataBeforeInitializationCode, "Retrieve Data Before Initialization", "");
		this.kRetrieveDataAfterTerminationCode = "123";
		this.errors[this.kRetrieveDataAfterTerminationCode] = new Array(this.kRetrieveDataAfterTerminationCode, "Retrieve Data After Termination", "");
		this.kStoreDataBeforeInitializationCode = "132";
		this.errors[this.kStoreDataBeforeInitializationCode] = new Array(this.kStoreDataBeforeInitializationCode, "Store Data Before Initialization", "");
		this.kStoreDataAfterTerminationCode = "133";
		this.errors[this.kStoreDataAfterTerminationCode] = new Array(this.kStoreDataAfterTerminationCode, "Store Data After Termination", "");
		
		//commit codes
		this.kCommitBeforeInitializationFailureCode = "142";
		this.errors[this.kCommitBeforeInitializationFailureCode] = new Array(this.kCommitBeforeInitializationFailureCode, "Commit Before Initialization", "");
		this.kCommitAfterTerminationFailureCode = "143";
		this.errors[this.kCommitAfterTerminationFailureCode] = new Array(this.kCommitAfterTerminationFailureCode, "Commit After Termination", "");		
		
		this.kInvalidArgumentErrorCode = "201";
		this.errors[this.kInvalidArgumentErrorCode] = new Array(this.kInvalidArgumentErrorCode, "General Argument Error", "");
		
		//general RTE command failure codes
		//probably our API will never use this code
		this.kGeneralGetFailureCode = "301";
		this.kElementCannotHaveChildrenCode = this.kGeneralGetFailureCode;
		this.kElementCannotHaveCountCode = this.kGeneralGetFailureCode;
		this.errors[this.kGeneralGetFailureCode] = new Array(this.kGeneralGetFailureCode, "General Get Failure", "");
		//probably our API will never use this code
		this.kGeneralSetFailureCode = "351";
		this.kElementsetOutOfOrderCode = this.kGeneralSetFailureCode;
		this.errors[this.kGeneralSetFailureCode] = new Array(this.kGeneralSetFailureCode, "General Set Failure", "");
		this.kGeneralCommitFailureCode = "391";
		this.errors[this.kGeneralCommitFailureCode] = new Array(this.kGeneralCommitFailureCode, "General Commit Failure", "");
	 
		//syntax related failure codes
		this.kNotDefinedErrorCode = "401";
		this.errors[this.kNotDefinedErrorCode] = new Array(this.kNotDefinedErrorCode, "Undefined Data Model Element", "");
		this.kNotValideDataModelElement = this.kNotDefinedErrorCode;
		this.kNotImplementedErrorCode = "402";
		this.errors[this.kNotImplementedErrorCode] = new Array(this.kNotImplementedErrorCode, "Unimplemented Data Model Element", "");
		this.kNotInitializedErrorCode = "403";
		this.errors[this.kNotInitializedErrorCode] = new Array(this.kNotInitializedErrorCode, "Data Model Element Is Not Initialized", "");
		this.kElementIsReadOnlyCode = "404";
		this.kElementIsKeywordCode = this.kElementIsReadOnlyCode;
		this.errors[this.kElementIsReadOnlyCode] = new Array(this.kElementIsReadOnlyCode, "Data Model Element Is Read Only", "");
		this.kElementIsWriteOnlyCode="405";
		this.errors[this.kElementIsWriteOnlyCode] = new Array(this.kElementIsWriteOnlyCode, "Data Model Element Is Write Only", "");
		
		this.kIncorrectDataTypeCode = "406";
		this.errors[this.kIncorrectDataTypeCode] = new Array(this.kIncorrectDataTypeCode, "Data Model Element Type Mismatch", "");
		this.kOutOfRangeCode = "407";
		this.errors[this.kOutOfRangeCode] = new Array(this.kOutOfRangeCode, "Data Model Element Value Out Of Range", "");
		this.kDataModelDependencyNotEstablished = "408";
		this.errors[this.kDataModelDependencyNotEstablished] = new Array(this.kDataModelDependencyNotEstablished, "Data Model Dependency Not Established", "");
	}

	//creating member methods
    this.getCurrentErrorCode = getCurrentErrorCode;
	this.setCurrentErrorCode = setCurrentErrorCode;
	this.clearCurrentErrorCode = clearCurrentErrorCode;
	this.getErrorDescription = getErrorDescription;
	this.getErrorDiagnostic = getErrorDiagnostic;
	this.getErrorElement = getErrorElement;
}


// data_model_interface.js
/*

Using the Element object: 
To create a new element call the following constructor:

var myElement = new Element("<initial value always string!>", "<validation function - optional>", "<vocabulary only for checkVocabulary validation function>", writeable (true/false), readable (true/false), true, true);

If initial value is "" and you need the element to be initialized from the vary beginning, call 

myElement.initialize()

If the value is other than "", constructor will initialize the element for you
To add the element to a container call the following method against container

myContainer.setItem("<element name>", myElement);

Convention is to indent the element according to its depth in the data model and
to always use ";" at the end of the line. Please make sure your variable names are unique since JavaScript supports
global variables.


*/


function DataModelInterface(scormVersion)
{
	this.processInitialData = dmiProcessInitialData;
	this.processGet = dmiProcessGet;
	this.processSet = dmiProcessSet;
	this.IsClean = dmiIsClean;
	this.MarkClean = dmiMarkClean;
	this.prepareDataForCommit = dmiPrepareDataForCommit;
	//creating a top-most container
	this.root = new Container("root");	
	if (scormVersion == kVersion12)
	{
/*************************************************** Setting up 1.2 data model *********************************/	
	
		//creating a cmi container
		var cmi = new Container("cmi");
		this.root.setItem("cmi", cmi);
		
		//dbg(this.root.show());
			
			//creating a core container
			var core = new Container("core");
			cmi.setItem("core", core);
			
				//creating a _children element inside core container
				var core_children = new Element("student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time", "", "", false, true, true, true);
				core.setItem("_children", core_children);
				
				//creating a student_id element inside core container
				var student_id = new Element("", "", "", false, true, true, true);
				core.setItem("student_id", student_id);				
				
				//creating a student_name element inside core container
				var student_name = new Element("", "", "", false, true, true, true);
				core.setItem("student_name", student_name);								
				
				//creating a lesson_location element inside core container
				var lesson_location = new Element("", "checkCMIString255", "", true, true, true, true);
				lesson_location.initialize();
				core.setItem("lesson_location", lesson_location);												

				//creating a credit element inside core container
				var credit = new Element("", "", "", false, true, true, true);
				core.setItem("credit", credit);												
				
				//creating a lesson_status element inside core container
				var lesson_status = new Element("", "checkLessonStatus", "", true, true, true, true);
				core.setItem("lesson_status", lesson_status);	
				
				//creating a entry element inside core container
				var entry = new Element("", "", "", false, true, true, true);
				core.setItem("entry", entry);																				
				
				//score container inside core container
				var core_score = new Container("score");
				core.setItem("score", core_score);
				
					//creating a _children element inside score container
					var core_score_children = new Element("raw,max,min", "", "", false, true, true, true);
					core_score.setItem("_children", core_score_children);																				

					//creating a raw element inside score container
					var core_score_raw = new Element("", "checkNormalizedScore", "", true, true, true, true);
					core_score_raw.initialize();
					core_score.setItem("raw", core_score_raw);																				
					
					//creating a max element inside score container
					var core_score_max = new Element("", "checkNormalizedScore", "", true, true, true, true);
					core_score_max.initialize();
					core_score.setItem("max", core_score_max);																				

					//creating a min element inside score container
					var core_score_min = new Element("", "checkNormalizedScore", "", true, true, true, true);
					core_score_min.initialize();
					core_score.setItem("min", core_score_min);																									
				
				//creating a total_time element inside core container
				var total_time = new Element("", "", "", false, true, true, true);
				core.setItem("total_time", total_time);																				
				
				//creating a lesson_mode element inside core container
				var lesson_mode = new Element("", "", "", false, true, true, true);
				core.setItem("lesson_mode", lesson_mode);																				
				
				//creating a exit element inside core container
				var exit = new Element("", "checkVocabulary", "exit", true, false, true, true);
				core.setItem("exit", exit);																				

				//creating a session_time element inside core container
				var session_time = new Element("", "checkCMITimespan", "", true, false, true, true);
				core.setItem("session_time", session_time);	
				
			//creating a suspend_data element inside cmi container
			var suspend_data = new Element("", "checkCMIString4096", "", true, true, true, true);
			cmi.setItem("suspend_data", suspend_data);																				
			
			//creating a launch_data element inside cmi container
			var launch_data = new Element("", "", "", false, true, true, true);
			launch_data.initialize();
			cmi.setItem("launch_data", launch_data);																							
			
			//creating a comments element inside cmi container
			var comments = new Element("", "checkCMIString4096", "", true, true, true, true);
			comments.initialize();
			comments.createCommentsElement();
			cmi.setItem("comments", comments);			
			
			//creating a comments from lms element inside cmi container
			var comments_from_lms = new Element("", "checkCMIString4096", "", false, true, true, true);
			comments_from_lms.initialize();
			cmi.setItem("comments_from_lms", comments_from_lms);
			
			//creating an objectives countable container inside cmi container
			//_count element will be created automatically
			var objectives = new Container("objectives");
			objectives.createCountableContainer();
			cmi.setItem("objectives", objectives);
			
				//creating a _children element inside objectives container
				var obj_children = new Element("id,score,status", "", "", false, true, true, true);
				objectives.setItem("_children", obj_children);
				
				//creating a template container used for N-th objective
				var obj_template_container = new Container("objectives_template");
				objectives.setArrayItemTemplate(obj_template_container);
				
					//creating id element inside the template container
					var obj_templ_id = new Element("", "checkCMIIdentifier", "", true, true, true, true);
					obj_template_container.setItem("id", obj_templ_id);
					
					//score container inside the template container
					var obj_templ_score = new Container("objectives_templ_score");
					obj_template_container.setItem("score", obj_templ_score);
				
						//creating a _children element inside score container
						var obj_templ_score_children = new Element("raw,max,min", "", "", false, true, true, true);
						obj_templ_score.setItem("_children", obj_templ_score_children);																				

						//creating a raw element inside score container
						var obj_templ_score_raw = new Element("", "checkNormalizedScore", "", true, true, true, true);
						obj_templ_score.setItem("raw", obj_templ_score_raw);																				

						//creating a max element inside score container
						var obj_templ_score_max = new Element("", "checkNormalizedScore", "", true, true, true, true);
						obj_templ_score.setItem("max", obj_templ_score_max);
						
						//creating a min element inside score container
						var obj_templ_score_min = new Element("", "checkNormalizedScore", "", true, true, true, true);
						obj_templ_score.setItem("min", obj_templ_score_min);											

					
					//creating status element inside the template container
					var obj_templ_status = new Element("", "checkVocabulary", "status", true, true, true, true);
					obj_template_container.setItem("status", obj_templ_status);		
					
					
			//creating a student data container
			var student_data = new Container("student_data");
			cmi.setItem("student_data", student_data);			
			
				//creating a _children element inside student_data container
				var student_data_children = new Element("mastery_score,max_time_allowed,time_limit_action", "", "", false, true, true, true);
				student_data.setItem("_children", student_data_children);														
				
				//creating a mastery_score element inside student_data container
				var student_data_mastery_score = new Element("", "", "", false, true, true, true);
				student_data.setItem("mastery_score", student_data_mastery_score);																		
				
				//creating a max time allowed element inside student_data container
				var student_data_max_time_allowed = new Element("", "", "", false, true, true, true);
				student_data.setItem("max_time_allowed", student_data_max_time_allowed);	
				
				//creating a time limit action element inside student_data container
				var student_data_time_limit_action = new Element("", "", "", false, true, true, true);
				student_data.setItem("time_limit_action", student_data_time_limit_action);					
				
			//creating a student preference container
			var student_preference = new Container("student_preference");
			cmi.setItem("student_preference", student_preference);			
			
				//creating a _children element inside student preference container
				var student_preference_children = new Element("audio,language,speed,text", "", "", false, true, true, true);
				student_preference.setItem("_children", student_preference_children);														
				
				//creating a audo element inside student preference container
				var student_preference_audio = new Element("0", "checkAudio", "", true, true, true, true);
				student_preference.setItem("audio", student_preference_audio);																						
				
				//creating a audo element inside student preference container
				var student_preference_language = new Element("", "checkCMIString255", "", true, true, true, true);
				student_preference_language.initialize();
				student_preference.setItem("language", student_preference_language);
				
				//creating a audo element inside student preference container
				var student_preference_speed = new Element("0", "checkSpeed", "", true, true, true, true);
				student_preference.setItem("speed", student_preference_speed);

				//creating a audo element inside student preference container
				var student_preference_text = new Element("0", "checkText", "", true, true, true, true);
				student_preference.setItem("text", student_preference_text);								
				
			//creating an interactions container
			var interactions = new Container("interactions");
			interactions.createCountableContainer();
			cmi.setItem("interactions", interactions);			
			
				//creating a _children element inside interactions container
				var int_children = new Element("id,objectives,time,type,correct_responses,weighting,student_response,result,latency", "", "", false, true, true, true);
				interactions.setItem("_children", int_children);	
				
				//creating a template container used for N-th interaction
				var int_template_container = new Container("interaction_template");
				interactions.setArrayItemTemplate(int_template_container);
				
					//creating id element inside the template container
					var int_templ_id = new Element("", "checkCMIIdentifier", "", true, false, true, true);
					int_template_container.setItem("id", int_templ_id);
					
					//interaction objectives 					
					//creating an objectives countable container inside interaction template container
					//_count element will be created automatically
					var int_objectives = new Container("interaction_objectives");
					int_objectives.createCountableContainer();
					int_template_container.setItem("objectives", int_objectives);
							
						//creating a template container used for N-th objective
						var int_obj_template_container = new Container("interaction_objectives_template");
						int_objectives.setArrayItemTemplate(int_obj_template_container);
				
							//creating id element inside the template container
							var int_obj_templ_id = new Element("", "checkCMIIdentifier", "", true, false, true, true);
							int_obj_template_container.setItem("id", int_obj_templ_id);
					
					//creating time element inside the template container
					var int_templ_time = new Element("", "checkCMITime", "", true, false, true, true);
					int_template_container.setItem("time", int_templ_time);					
	
					//creating type element inside the template container
					var int_templ_type = new Element("", "checkVocabulary", "interactionType", true, false, true, true);
					int_template_container.setItem("type", int_templ_type);						

					//interaction correct responses					
					//creating an correct responses countable container inside interaction template container
					//_count element will be created automatically
					var correct_responses = new Container("correct_responses");
					correct_responses.createCountableContainer();
					int_template_container.setItem("correct_responses", correct_responses);
							
						//creating a template container used for N-th response
						var correct_responses_template_container = new Container("responses_template");
						correct_responses.setArrayItemTemplate(correct_responses_template_container);
				
							//creating pattern element inside the template container
							var correct_responses_pattern = new Element("", "checkCMIFeedback", "", true, false, true, true);
							correct_responses_template_container.setItem("pattern", correct_responses_pattern);

					//creating weighting element inside the template container
					var int_templ_weighting = new Element("", "checkCMIDecimal", "", true, false, true, true);
					int_template_container.setItem("weighting", int_templ_weighting);										
					
					//creating student_response element inside the template container
					var int_templ_student_response = new Element("", "checkCMIFeedback", "", true, false, true, true);
					int_template_container.setItem("student_response", int_templ_student_response);															

					//creating result element inside the template container
					var int_templ_result = new Element("", "checkInteractionResult", "", true, false, true, true);
					int_template_container.setItem("result", int_templ_result);																									
					
					//creating latency element inside the template container
					var int_templ_latency = new Element("", "checkCMITimespan", "", true, false, true, true);
					int_template_container.setItem("latency", int_templ_latency);	

					//creating text element inside the template container
					var int_templ_text = new Element("", "checkCMIString4096WithText", "", true, false, true, true);
					int_template_container.setItem("text", int_templ_text);	
					

/***********************************************End Setting up 1.2 data model *********************************/																								
																					
	}
	else
	{
/************************************************** Setting up 1.3 data model *********************************/																									

		//creating an adl container
		var adl = new Container("adl");
		this.root.setItem("adl", adl);

			//creating adl.nav container
			var adl_nav = new Container("nav");
			adl.setItem("nav", adl_nav);

				//creating adl.nav.request
				var adl_nav_request = new Element("_none_", "check_adl_nav_request148411", "", true, true, true, true);
				adl_nav.setItem("request", adl_nav_request);							

				//creating adl.nav.request_valid
				var adl_nav_request_valid = new Container("request_valid");
				//the container request_valid should be able to accept subelements and choice arguments
				//so we are overwriting a number of methods
				adl_nav_request_valid.createAdlRequestValidContainer();
				adl_nav.setItem("request_valid", adl_nav_request_valid);							
		
		


		//creating a cmi container
		var cmi = new Container("cmi");
		this.root.setItem("cmi", cmi);

			var cmi_version = new Element("1.0", "", "", false, true, true, true);
			cmi.setItem("_version", cmi_version);
			var cmi_version1 = new Element("1.0", "", "", false, true, true, true);
			cmi.setItem("version", cmi_version1);

		
			//creating comments from learner countable container inside cmi container
			//_count element will be created automatically
			var comments_from_learner = new Container("comments_from_learner");
			comments_from_learner.createCountableContainer();
			cmi.setItem("comments_from_learner", comments_from_learner);
			
				//creating a _children element inside objectives container
				var comments_from_learner_children = new Element("comment,location,timestamp", "", "", false, true, true, true);
				comments_from_learner.setItem("_children", comments_from_learner_children);
				
				//creating a template container used for N-th comment
				var comments_from_learner_template_container = new Container("lcomments_template");
				comments_from_learner.setArrayItemTemplate(comments_from_learner_template_container);
				
					//creating comment element inside the template container
					var lcomment_comment = new Element("", "check_localized_string_4096", "", true, true, true, true);
					comments_from_learner_template_container.setItem("comment", lcomment_comment);
					
					//creating location element inside the template container
					var lcomment_location = new Element("", "checkISO_10646_1_255", "", true, true, true, true);
					comments_from_learner_template_container.setItem("location", lcomment_location);					
					
					//creating date time element inside the template container
					var lcomment_timestamp = new Element("", "check_time_second_10_0", "", true, true, true, true);
					comments_from_learner_template_container.setItem("timestamp", lcomment_timestamp);										
			
			
			//creating comments from lms countable container inside cmi container
			//_count element will be created automatically
			var comments_from_lms = new Container("comments_from_lms");
			comments_from_lms.createCountableContainer();
			cmi.setItem("comments_from_lms", comments_from_lms);
			
				//creating a _children element inside objectives container
				var comments_from_lms_children = new Element("comment,location,timestamp", "", "", false, true, true, true);
				comments_from_lms.setItem("_children", comments_from_lms_children);
				
				//creating a template container used for N-th comment
				var comments_from_lms_template_container = new Container("lmscomments_template");
				comments_from_lms.setArrayItemTemplate(comments_from_lms_template_container);
				
					//creating comment element inside the template container
					var lmscomment_comment = new Element("", "check_localized_string_4096", "", false, true, true, true);
					comments_from_lms_template_container.setItem("comment", lmscomment_comment);
					
					//creating location element inside the template container
					var lmscomment_location = new Element("", "checkISO_10646_1_255", "", false, true, true, true);
					comments_from_lms_template_container.setItem("location", lmscomment_location);					
					
					//creating date time element inside the template container
					var lmscomment_timestamp = new Element("", "check_time_second_10_0", "", false, true, true, true);
					comments_from_lms_template_container.setItem("timestamp", lmscomment_timestamp);										

			//creating a completion_status element inside cmi container
			var completion_status = new Element("", "checkVocabulary", "completion_status148411", true, true, true, true);
			cmi.setItem("completion_status", completion_status);	

			//creating a completion_threshold element inside cmi container
			var completion_threshold = new Element("", "", "", false, true, true, true);
			completion_threshold.initialize();
			cmi.setItem("completion_threshold", completion_threshold);	


			//creating a credit element inside cmi container
			var credit = new Element("", "", "", false, true, true, true);
			cmi.setItem("credit", credit);	
				
			//creating a entry element inside cmi container
			var entry = new Element("ab-initio", "", "", false, true, true, true);
			cmi.setItem("entry", entry);	
				
			//creating a exit element inside cmi container
			var exit = new Element("", "checkVocabulary", "exit148411", true, false, true, true);
			cmi.setItem("exit", exit);					

			//creating an interactions container
			var interactions = new Container("interactions");
			interactions.createCountableContainer();
			cmi.setItem("interactions", interactions);			
			
			//creating a _children element inside interactions container
			var int_children = new Element("id,type,objectives,timestamp,correct_responses,weighting,learner_response,result,latency,description", "", "", false, true, true, true);
			interactions.setItem("_children", int_children);	
				
			//creating a template container used for N-th interaction
			var int_template_container = new Container("interaction_template");
			interactions.setArrayItemTemplate(int_template_container);
				
				//creating id element inside the template container
				var int_templ_id = new Element("", "check_long_identifier_4000", "", true, true, true, true);
				int_template_container.setItem("id", int_templ_id);
				//the id element is the prerequisite for all other elelments.
				int_template_container.setFirstToSetElementKey("id");
					
				//creating type element inside the template container
				var int_templ_type = new Element("", "checkVocabulary", "interactionType148411", true, true, true, true);
				int_template_container.setItem("type", int_templ_type);						
					
				//interaction objectives 					
				//creating an objectives countable container inside interaction template container
				//_count element will be created automatically
				var int_objectives = new Container("interaction_objectives");
				int_objectives.createCountableContainer();
				int_template_container.setItem("objectives", int_objectives);
							
					//creating a template container used for N-th objective
					var int_obj_template_container = new Container("interaction_objectives_template");
					int_objectives.setArrayItemTemplate(int_obj_template_container);
			
					//creating id element inside the template container
					var int_obj_templ_id = new Element("", "check_long_identifier_4000", "", true, true, true, true);
					int_obj_template_container.setItem("id", int_obj_templ_id);
					int_obj_template_container.setFirstToSetElementKey("id");
				
				//creating time element inside the template container
				var int_templ_timestamp = new Element("", "check_time_second_10_0", "", true, true, true, true);
				int_template_container.setItem("timestamp", int_templ_timestamp);					
	
				//interaction correct responses					
				//creating an correct responses countable container inside interaction template container
				//_count element will be created automatically
				var correct_responses = new Container("correct_responses");
				correct_responses.createCountableContainer();
				int_template_container.setItem("correct_responses", correct_responses);
							
					//creating a template container used for N-th response
					var correct_responses_template_container = new Container("responses_template");
					correct_responses.setArrayItemTemplate(correct_responses_template_container);
			
					//creating pattern element inside the template container
					var correct_responses_pattern = new Element("", "checkCorrectResponses", "", true, true, true, true);
					correct_responses_template_container.setItem("pattern", correct_responses_pattern);

				//creating weighting element inside the template container
				var int_templ_weighting = new Element("", "check_real_10_7", "", true, true, true, true);
				int_template_container.setItem("weighting", int_templ_weighting);										
					
				//creating student_response element inside the template container
				var int_templ_learner_response = new Element("", "checkLearnerResponse", "", true, true, true, true);
				int_template_container.setItem("learner_response", int_templ_learner_response);															

				//creating result element inside the template container
				var int_templ_result = new Element("", "checkInteractionResult148411", "", true, true, true, true);
				int_template_container.setItem("result", int_templ_result);																									
					
				//creating latency element inside the template container
				var int_templ_latency = new Element("", "check_time_interval_second_10_2", "", true, true, true, true);
				int_template_container.setItem("latency", int_templ_latency);	
					
				//creating description element inside the template container
				var int_templ_description = new Element("", "check_localized_string_255", "", true, true, true, true);
				int_template_container.setItem("description", int_templ_description);	

				//creating text element inside the template container
				var int_templ_text = new Element("", "checkCMIString4096WithText", "", true, true, true, true);
				int_templ_text.initialize();
				int_template_container.setItem("text", int_templ_text);	

					
					
			//creating a launch_data element inside cmi container
			var launch_data = new Element("", "checkISO_10646_1_4096", "", false, true, true, true);
			cmi.setItem("launch_data", launch_data);																							
				
			//creating a student_id element inside cmi container
			var learner_id = new Element("", "check_long_identifier_4000", "", false, true, true, true);
			cmi.setItem("learner_id", learner_id);				
				
			//creating a student_name element inside cmi container
			var learner_name = new Element("", "check_localized_string_255", "", false, true, true, true);
			cmi.setItem("learner_name", learner_name);								
				
			//creating a student preference container
			var learner_preference = new Container("learner_preference");
			cmi.setItem("learner_preference", learner_preference);			
			
				//creating a _children element inside student preference container
				var learner_preference_children = new Element("audio_level,language,delivery_speed,audio_captioning", "", "", false, true, true, true);
				learner_preference.setItem("_children", learner_preference_children);														
				
				//creating a audo element inside student preference container
				var learner_preference_audio = new Element("0", "check_real_10_7_0_more", "", true, true, true, true);
				learner_preference.setItem("audio_level", learner_preference_audio);																						
				
				//creating a audo element inside student preference container
				var learner_preference_language = new Element("", "check_language_type", "", true, true, true, true);
				learner_preference.setItem("language", learner_preference_language);
				
				//creating a audo element inside student preference container
				var learner_preference_speed = new Element("0", "check_real_10_7_0_more", "", true, true, true, true);
				learner_preference.setItem("delivery_speed", learner_preference_speed);

				//creating a audo element inside student preference container
				var learner_preference_audio_captioning = new Element("0", "checkText", "", true, true, true, true);
				learner_preference.setItem("audio_captioning", learner_preference_audio_captioning);								
				
				
			//creating a lesson_location element inside cmi container
			var location = new Element("", "checkISO_10646_1_1000", "", true, true, true, true);
			cmi.setItem("location", location);												

			//creating a max time allowed element inside cmi container
			var student_data_max_time_allowed = new Element("", "check_time_interval_second_10_2", "", false, true, true, true);
			cmi.setItem("max_time_allowed", student_data_max_time_allowed);	


			//creating a lesson_mode element inside cmi container
			var mode = new Element("", "", "", false, true, true, true);
			cmi.setItem("mode", mode);																				

			//creating an objectives countable container inside cmi container
			//_count element will be created automatically
			var objectives = new Container("objectives");
			objectives.createCountableContainer();
			cmi.setItem("objectives", objectives);
			
				//creating a _children element inside objectives container
				var obj_children = new Element("id,score,success_status,completion_status,description,progress_measure", "", "", false, true, true, true);
				objectives.setItem("_children", obj_children);
				
				//creating a template container used for N-th objective
				var obj_template_container = new Container("objectives_template");
				objectives.setArrayItemTemplate(obj_template_container);
				
					//creating id element inside the template container
					var obj_templ_id = new Element("", "check_long_identifier_4000", "", true, true, true, true);
					//schang: CR71829 - commented out the initialize() call here so that it will flag an error if id was set to
					//an empty string.
					//obj_templ_id.initialize();
					obj_template_container.setItem("id", obj_templ_id);
					obj_template_container.setFirstToSetElementKey("id");
					
					//score container inside the template container
					var obj_templ_score = new Container("objectives_templ_score");
					obj_template_container.setItem("score", obj_templ_score);
				
						//creating a _children element inside score container
						var obj_templ_score_children = new Element("raw,max,min,scaled", "", "", false, true, true, true);
						obj_templ_score.setItem("_children", obj_templ_score_children);																				

						//creating a raw element inside score container
						var obj_templ_score_raw = new Element("", "check_real_10_7", "", true, true, true, true);
						obj_templ_score.setItem("raw", obj_templ_score_raw);																				

						//creating a max element inside score container
						var obj_templ_score_max = new Element("", "check_real_10_7", "", true, true, true, true);
						obj_templ_score.setItem("max", obj_templ_score_max);
						
						//creating a min element inside score container
						var obj_templ_score_min = new Element("", "check_real_10_7", "", true, true, true, true);
						obj_templ_score.setItem("min", obj_templ_score_min);											

						//creating a scaled element inside score container
						var obj_templ_score_scaled = new Element("", "check_real_10_7_minus_1_plus_1", "", true, true, true, true);
						obj_templ_score.setItem("scaled", obj_templ_score_scaled);											

					
					//creating success status element inside the template container
					var obj_templ_success_status = new Element("unknown", "checkVocabulary", "success_status148411", true, true, true, true);
					obj_template_container.setItem("success_status", obj_templ_success_status);	

					//creating completion status element inside the template container
					var obj_templ_completion_status = new Element("unknown", "checkVocabulary", "completion_status148411", true, true, true, true);
					obj_template_container.setItem("completion_status", obj_templ_completion_status);	

					//creating description element inside the template container
					var obj_templ_description = new Element("", "", "", true, true, true, true);
					obj_template_container.setItem("description", obj_templ_description);	

					//creating progress measure element inside the template container
					var obj_templ_progress_measure = new Element("", "check_real_10_7_0_1", "", true, true, true, true);
					obj_template_container.setItem("progress_measure", obj_templ_progress_measure);	


			//creating a mastery_score element inside cmi container
			var cmi_progress_measure = new Element("", "check_real_10_7_0_1", "", true, true, true, true);
			cmi.setItem("progress_measure", cmi_progress_measure);																		


			//creating a mastery_score element inside cmi container
			var scaled_passing_score = new Element("", "", "", false, true, true, true);
			cmi.setItem("scaled_passing_score", scaled_passing_score);																		
				
			//score container inside cmi container
			var cmi_score = new Container("score");
			cmi.setItem("score", cmi_score);
				
				//creating a _children element inside score container
				var cmi_score_children = new Element("raw,max,min,scaled", "", "", false, true, true, true);
				cmi_score.setItem("_children", cmi_score_children);																				

				//creating a raw element inside score container
				var cmi_score_raw = new Element("", "check_real_10_7", "", true, true, true, true);
				cmi_score.setItem("raw", cmi_score_raw);																				
					
				//creating a max element inside score container
				var cmi_score_max = new Element("", "check_real_10_7", "", true, true, true, true);
				cmi_score.setItem("max", cmi_score_max);																				

				//creating a min element inside score container
				var cmi_score_min = new Element("", "check_real_10_7", "", true, true, true, true);
				cmi_score.setItem("min", cmi_score_min);	
				
				//creating a scaled element inside score container
				var cmi_score_scaled = new Element("", "check_real_10_7_minus_1_plus_1", "", true, true, true, true);
				cmi_score.setItem("scaled", cmi_score_scaled);					
				
			//creating a session_time element inside cmi container
			var session_time = new Element("", "check_time_interval_second_10_2", "", true, false, true, true);
			cmi.setItem("session_time", session_time);	

			//creating a success_status element inside cmi container
			var success_status = new Element("", "checkVocabulary", "success_status148411", true, true, true, true);
			cmi.setItem("success_status", success_status);	

			//creating a suspend_data element inside cmi container
			if(contentFormatVersion == kSCORM2004Ed3Version)
			{
				var suspend_data = new Element("", "checkISO_10646_1_65536", "", true, true, true, true);
				cmi.setItem("suspend_data", suspend_data);																				
			}
			else
			{
				var suspend_data = new Element("", "checkISO_10646_1_4096", "", true, true, true, true);
				cmi.setItem("suspend_data", suspend_data);																				
			}
			
			//creating a time_limit_action element inside cmi container
			var time_limit_action = new Element("", "", "", false, true, true, true);
			cmi.setItem("time_limit_action", time_limit_action);	
																								
				
			//creating a total_time element inside cmi container
			var total_time = new Element("PT0H0M0S", "check_time_interval_second_10_2", "", false, true, true, true);
			total_time.initialize();
			cmi.setItem("total_time", total_time);																				
				

/********************************************** End Setting up 1.3 data model *********************************/																								
	}
	
}

function dmiProcessInitialData(responseFromLms, errorManager)
{

	dbg("process init data 1");

	openForInitialization = true;

	var dataArray = responseFromLms.split("&");
	
	var err = 1;

	for (var i=0; i<dataArray.length; i++)
	{

		if (dataArray[i]=="error=0") 
		{
			err=0;
			break;
		}
	}

	if (err != 0)
	{
		openForInitialization = false;
		return false;
	}
	for (var i=1; i<dataArray.length; i++)
	{
		var nameValuePair = dataArray[i].split("=");
	
		if (nameValuePair.length == 1)
		{
			nameValuePair[1] = "";
		}

		var value = nameValuePair[1].replace(/\+/g," ");
		value = decode_utf8(unescape(value));		
		
		var key = unescape(nameValuePair[0])
		

		errorManager.setCurrentErrorCode(errorManager.kNoErrorCode);
		
		if(isSCORM2004() && (contentFormatVersion == kSCORM2004Ed3Version) && (key == "cmi.scaled_passing_score") && (value != ""))
		{
			isScaledProgressScore = true;
		}
		
		if(isSCORM2004() && (contentFormatVersion == kSCORM2004Ed3Version) && (key == "cmi.completion_threshold") && (value != ""))
		{
			isCompletionThreshold = true;
		}
		
		//For SCORM2004, if the value is empty string, don't try to set the item
		//Otherwise, it will change the status from non-initialized to initialized
		if(!isSCORM2004() || value != "")
			this.root.setValue(key, value, errorManager);
	}
	
	openForInitialization = false;
	return true;
}

function dmiProcessGet(key, errorManager)
{
	errorManager.setCurrentErrorCode("0");
	return this.root.getValue(key, errorManager);
}

function dmiProcessSet(key, value, errorManager)
{
	errorManager.setCurrentErrorCode("0");
	return this.root.setValue(key, value, errorManager);		
}

function dmiPrepareDataForCommit()
{
	
	return "here is the data";
}

function dmiIsClean()
{
	return this.root.IsClean();
}

function dmiMarkClean()
{
	//dbg("in dmi mark clean");
	this.root.MarkClean()
}
    //utf8==>unicode
 function decode_utf8(utftext) { 
      var plaintext = "";  var i=0;  var c=c1=c2=0;  
     // while loop, because some indications are jumped over 
      while(i<utftext.length) 
          { 
           c = utftext.charCodeAt(i);  
          if (c<128) { 
              plaintext += String.fromCharCode(c);  
               i++; }  
           else if((c>191) && (c<224)) { 
               c2 = utftext.charCodeAt(i+1);  
               plaintext += String.fromCharCode(((c&31)<<6)|(c2&63));  
               i+=2; }  
           else { 
               c2 = utftext.charCodeAt(i+1);  c3 = utftext.charCodeAt(i+2);  
               plaintext += String.fromCharCode(((c&15)<<12)|((c2&63)<<6)|(c3&63));  
               i+=3; }  
           } 
       return plaintext;  
   }  


// communication_layer.js
/*
	In Offline player this include file is supposed to be replaced by calls to ActiveX control
*/

/*
	SPC-27254: [Content] High Internal 500 Error rate reported by Newrelic instead of Error 404
	
	We want to stop communicating with the LMS when a call fails with a server 403/500 error.
	This is not an LMS level error but a server level one, so we do not get a valid LMS error code.

	To keep track of the error, we use a global variable communicationWithServerFailed, and set it 
	to false by default.

	-- Kapil Kaisare <kkaisare@saba.com>
*/
var communicationWithServerFailed = false;



function communicate(dataToSend)
{
	// console.log('communicate');
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
	debugLog("api.js: communicate() : Communication Start");
	dataToSend='<?xml version="1.0" encoding="UTF-8" ?><command>'+dataToSend+'</command>';

	var finalUrl = parent.decodedCallbackUrl;
	debugLog("api.js: communicate() : finalUrl:"+finalUrl);
	var urlParts = (finalUrl.split('?'))[1];
	urlParts = urlParts.split('&');

	var
		scormSessionKey = urlParts[0],
		sitename = urlParts[1],
		lms_data = urlParts[2],
		cmi_entry = urlParts[3],
		sabaCertificate = 'deepLinkCertificate=' + parent.sabaCertificate,
		sabaCertificate2 = 'remote_content_cert=' + parent.sabaCertificate,
		securityCheck = 'j_security_check=true',
		rcsVersion = 'rcsversion=' + window.rcsVersion; //--- scorm_frame.html has this reference

	var xmlConnection = getXMLHTTPConnection();
	var ie = (function(){
		var undef,
			v = 3,
			div = document.createElement('div'),
			all = div.getElementsByTagName('i');

		while (
			div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
			all[0]
		);
		return v > 4 ? v : undef;
	}());
	if ( ie == 9 ) {
		// console.log( 'ie9 creation' ); 
		//xmlConnection =  new ActiveXObject("WinHttp.WinHttpRequest.5.1");
		//xmlConnection.Open("POST", finalUrl + "&" + sabaCertificate2, false);
	} else {
		debugLog("api.js: communicate() : Open xmlConnection --> POST --> finalUrl== "+finalUrl + "SabaCertificate=="+sabaCertificate2);
		xmlConnection.open("POST", finalUrl + "&" + sabaCertificate2, false);
	}
	try {
		if ( ie == 9 ) {
			// console.log( 'ie9 header' ); 
			//xmlConnection.SetRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
		} else {
			debugLog("api.js: communicate() : Set request header");
			xmlConnection.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
		}
	} catch (e) {
		debugLog("api.js: communicate() : Not able to set request header");
	}
	var site = (sitename.split("="))[1];
	// xmlConnection.setRequestHeader("sitename", site);
	// xmlConnection.setRequestHeader("site", site);
	// xmlConnection.setRequestHeader("Origin", window.document.domain);
	// xmlConnection.withCredentials = true;
	
	/*
		SPC-27254: [Content] High Internal 500 Error rate reported by Newrelic instead of Error 404
		
		We want to stop communicating with the LMS when a call fails with a server 403/500 error.
		This is not an LMS level error but a server level one, so we do not get a valid LMS error code.

		We allow the send call to go through only if the global variable communicationWithServerFailed
		is false.

		We set the global variable communicationWithServerFailed to true if the request failed with 
		a 403 or 500 error. 

		-- Kapil Kaisare <kkaisare@saba.com>
	*/
	if ( !communicationWithServerFailed ) {
		debugLog("api.js: communicate() : No Server error like 403/500");
		if (ie == 9) {
			/**/
			var receivedData = null;
			var xdr = new XDomainRequest();
			if (xdr) {
				xmlConnection = xdr;
			    xmlConnection.onerror = function () {
			    	dbg("api.js: Error calling x domain Request.");
			    };
			    
			   // xmlConnection.ontimeout = timeo;
			    xmlConnection.onload = function (){
					//Receveid data 
			    	receivedData = xmlConnection.responseText;
			    };
			    //xmlConnection.open('POST',finalUrl + "&" + sabaCertificate2);
				debugLog("api.js: communicate() : Open xmlConnection for IE9--> POST method with finalUrl== "+finalUrl + "SabaCertificate=="+sabaCertificate2);
			    xmlConnection.open('POST',finalUrl + "&" + sabaCertificate2 
			    + "&data_to_send=" + EncodeText(dataToSend) +
				'&' + scormSessionKey +
				'&' + sitename +
				'&' + lms_data +
				'&' + cmi_entry +
				'&' + sabaCertificate +
				'&' + sabaCertificate2 +
				'&' + securityCheck +
				'&' + rcsVersion);
			    
				debugLog("api.js: communicate() : Send method call for IE9 when we do not have XDomainRequest");
			    xmlConnection.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
			    xmlConnection.send("data_to_send=" + EncodeText(dataToSend) +
				'&' + scormSessionKey +
				'&' + sitename +
				'&' + lms_data +
				'&' + cmi_entry +
				'&' + sabaCertificate +
				'&' + sabaCertificate2 +
				'&' + securityCheck +
				'&' + rcsVersion);
				
				setTimeout("fakeWaitForIE9()", 1000);
				while (receivedData == null){
					fakeWaitForIE9();
				}
			    return receivedData;
			} else {
			  // Using the old method to get the data. 
			  debugLog("api.js: communicate() : Send maethod call for IE9 when we do not have XDomainRequest");
				xmlConnection.Send(
				"data_to_send=" + EncodeText(dataToSend) +
				'&' + scormSessionKey +
				'&' + sitename +
				'&' + lms_data +
				'&' + cmi_entry +
				'&' + sabaCertificate +
				'&' + sabaCertificate2 +
				'&' + securityCheck +
				'&' + rcsVersion
				);
			}

			
			if ( xmlConnection.Status == 404 || xmlConnection.Status == 403 || xmlConnection.Status == 500) {
				debugLog("api.js: communicate() : Communication With Server is Failed for IE9");
				communicationWithServerFailed = true;
			}

			return xmlConnection.ResponseText()
		} else {
			debugLog("api.js: communicate() : Send method call when browser is not IE9");
			xmlConnection.send(
				"data_to_send=" + EncodeText(dataToSend) +
				'&' + scormSessionKey +
				'&' + sitename +
				'&' + lms_data +
				'&' + cmi_entry +
				'&' + sabaCertificate +
				'&' + sabaCertificate2 +
				'&' + securityCheck +
				'&' + rcsVersion
			);
			
			if ( xmlConnection.status == 404 || xmlConnection.status == 403 || xmlConnection.status == 500) {
				debugLog("api.js: communicate() : Communication With Server Failed when browser is other than IE9");
				communicationWithServerFailed = true;
			}
			debugLog("api.js: communicate() : xmlConnection status:"+xmlConnection.status);
			return xmlConnection.responseText;
		}
	}
	debugLog("api.js: Communication End");
}

function fakeWaitForIE9(){

	//TO CHeck the 
	var conn = getXMLHTTPConnection();
	conn.open("POST", "/production/rcs/loading.html", false);
	conn.send("temp=data");

	return ;
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


// api_layer.js
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
	debugLog("api.js: terminate(): Terminating by content");
	if (this.communicationState == kCommunicationStateFinished) 
	{
		dbg("framework already executed terminate, no need to repeat the call");
		debugLog("api.js: terminate(): Framework already executed terminate, no need to repeat the call");
		processing = false;
		return "true";
	}
	debugLog("api.js: terminate(): Calling commonTerminate method from terminate");
	var res = this.commonTerminate(arg);	
	if(res == kFalse) {
		debugLog("api.js: terminate(): Common terminate is not successful");
		processing = false;
		return res;
	}
	dbg("!!!!!!!!!!!! FINISHED COMMON TERMINATE");
	debugLog("api.js: terminate(): Finished successfully common terminate");
	this.completeUserSession(true);
	this.communicationState = kCommunicationStateFinished;
	
	processing = false;
	debugLog("api.js: terminate(): Successful complition of terminate method=="+res);
	return res;
}


//called when the player tries to terminate the user session
function frameworkTerminate(arg)
{

	dbg("!!!!!!!!!!!! terminating by framework");
	debugLog("api.js: frameworkTerminate() : Start terminating by framework");
	if (this.communicationState == kCommunicationStateFinished) 
	{
		dbg("content already executed terminate, no need to repeat the call");
		debugLog("api.js: frameworkTerminate() : Content already executed terminate, no need to repeat the call");
		return "true";
	}
	var res1 = this.commonTerminate(arg);	
	if(res1 == kFalse)
		return;
	debugLog("api.js: frameworkTerminate() : CommonTerminate is successfull");
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

	dbg("api_layer.js: commonTerminate");
	debugLog("api.js: commonTerminate(): CommonTerminate method execution start");

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
		debugLog("api.js: commonTerminate: common Terminate start");
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
	debugLog("api.js: commit(): Execution of commit method start");
	function findPlayerCommitsTracking() {
		debugLog("api.js: commit(): FindPlayerCommitsTracking() method");
		var w = window, ix = 0;
		
		while (ix < 20) {
			if (w.Ext && w.Player) {
				if (!w.Player.commitsTracking) {
					w.Player.commitsTracking = {
						failures: 0,
						successTime: 0
					};
				}
				return w.Player.commitsTracking;
			}
			ix++;
			if (!w.parent) {
				return false;
			}
			w = w.parent;
		}
		return false;
	}
	
	// var commitsTracking = findPlayerCommitsTracking();  
	
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
		debugLog("api.js: commit(): content is not yet initialized");
		this.errorManager.setCurrentErrorCode(this.errorManager.kCommitBeforeInitializationFailureCode);

		// content compliance testing mode
		if (checkContentComplianceTest)
		{
			debugLog("api.js: commit(): content compliance testing mode");
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
		debugLog("api.js: commit(): content communication already fininshed");
		this.errorManager.setCurrentErrorCode(this.errorManager.kCommitAfterTerminationFailureCode);
		return kFalse;
	}	

	if(!this.isDirty)
	{
		dbg("api_layer.js:no new data to commit, returning");
		debugLog("api.js: commit(): No new data to commit, returning");
		return kTrue;
	}
	else
	{
		dbg("api_layer.js:there is some data to commit");
		debugLog("api.js: commit(): There is some data to commit");
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

	//SPC-80664 - Multiple Attempts doesn't get created on Panopto SCORM
	//Currently Panopto SCORM is non-scoring content. So it sends lesson_status as 'completed'.
	//In future, if Panopto SCORM is updated as Scoring Content, 
	//we'll need to have additional status check for following status: 'PASSED', 'FAILED'
	if(	parent.API.vendorContentType==='PANOPTO' && 
		currentlyUsedAPI.LMSGetValue('cmi.core.lesson_status')==='completed' && 
		currentlyUsedAPI.LMSGetValue('cmi.core.lesson_location')!==''){
		/* 
		We need to do following:
		command = command.replace('core<e>lesson_location<v>xxxxxxt4.612</v>', 'core<e>lesson_location<v></v>');
		command = command.replace('<e>lesson_status<v>completed</v></e><e>exit<v>suspend</v>', 'exit<v></v>');
		*/
		command = replaceCommandValues(command, 'core<e>lesson_location<v>');
		command = replaceCommandValues(command, '<e>lesson_status<v>completed</v></e><e>exit<v>');		
		debugLog("api.js: cleared cmi.core.lesson_location for Panopto SCORM");
	}

	//dbg("before communicate");
	debugLog("api.js: commit(): Before Communicate");
	var result = communicate(command);
	var playerAccess = (window != window.parent)? window.parent : window.opener;

	dbg("after communicate");
	debugLog("api.js: commit(): After Communicate");
	if (!this.commandWizard.interpretLMSConfirmation(result)) 
	{	
		//dbg("bad response");
		debugLog("api.js: commit(): Interpreted LMS Confirmation (Bad Response)");
		this.errorManager.setCurrentErrorCode(this.errorManager.kGeneralCommitFailureCode);
		//playerAccess.postMessage({
		//	messageType: 'commitsTrackingSetFailure'	
		//	}, unescape(QueryString("lms_url"))
		//);
		return kFalse;
	}
	
	//playerAccess.postMessage({
	//	messageType: 'commitsTrackingSetSuccess'	
	//}, unescape(QueryString("lms_url")));

	dbg("before process init data");
	debugLog("api.js: commit() : Before processing Initial Data");
	//processing adl.nav data for SCORM 2004, will do nothing for SCORM1.2 bacause there is no data to process
	var processingSucceeded = this.dataModelInterface.processInitialData(result, this.errorManager);

	dbg("after process init data");
	debugLog("api.js: commit(): After processing Initial Data");
	//DMI may fail to interpret the data
	if (!processingSucceeded)
	{
		//dbg("bad response");
		debugLog("api.js: commit(): Data processing not succeeded (Bad Response)");
		this.errorManager.setCurrentErrorCode(this.errorManager.kGeneralCommitFailureCode);
		return kFalse;	
	}	
	this.isDirty = false;
	debugLog("api.js: commit(): Commit method execution is successful");
	return kTrue;
}
			
/*
This method is used by both 1.2 and 1.3
In 1.2 all the 1.3 specific error codes point to the same General Error 101
In 1.3 they point to actual different codes
*/
function getValue(key)
{
	debugLog("api.js: getValue(): Execution of getValue method is started for Key = " + key);
	this.errorManager.setCurrentErrorCode(this.errorManager.kNoErrorCode);

	//this method should not be called when content is not yet initialized
	if (this.communicationState == kCommunicationStateNotInitialized)
	{
		//dbg("is not initialized");
		debugLog("api.js: getValue() : Communication state is not yet initialized");
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
		debugLog("api.js: getValue() : Communication state finished");
		this.errorManager.setCurrentErrorCode(this.errorManager.kRetrieveDataAfterTerminationCode);
		return "";
	}	
	
	
	if(isScaledProgressScore && key == "cmi.success_status")
	{
		var value = success_status(this.dataModelInterface,this.errorManager);
		debugLog("api.js: getValue() : cmi.success_status = " + value);
		return value;
	}
	
	if(isCompletionThreshold && key == "cmi.completion_status")
	{
		var value = completion_status(this.dataModelInterface,this.errorManager);
		debugLog("api.js: getValue() : cmi.completion_status = " + value);
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
	
	debugLog("api.js: getValue() : Final result of getValue() method = " + value);
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
	debugLog("api.js: setValue() : set value key= " + key + " value= " + value);
	this.errorManager.setCurrentErrorCode(this.errorManager.kNoErrorCode);

	//this method should not be called when content is not yet initialized
	if (this.communicationState == kCommunicationStateNotInitialized)
	{
		//dbg("is not initialized");
		debugLog("api.js: setValue() : Content is not yet initialized");
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
		debugLog("api.js: setValue() : Communication terminated");
		this.errorManager.setCurrentErrorCode(this.errorManager.kStoreDataAfterTerminationCode);
		return kFalse;
	}		
	

	//the method sets the data model and optionally sets the error manager
	var rt = this.dataModelInterface.processSet(key, value, this.errorManager);
	
	dbg("!!!!!!!!!!!! result=" + rt + " error=" + this.errorManager.getCurrentErrorCode())
	debugLog("api.js: setValue() : Result after setting data model and error manager= " + rt);
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
		debugLog("api.js: setValue() : Content compliance testing mode");
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
			//parent.frames.sco.document.location.href = parent.decodedAdapterLocation + "/blank.html";

			//--- SPC-59776 - GOPATIL: Loading blank.html will not close the content window. 
			//--- If we want to auto close this window, and player shell then we can load rcsunload.html.
			try { 
				parent.document.location.href = parent.lms_url + "/assets/content/scorm_launch/rcsunload.html";
			} catch(e) {
				redirectedLMS = false;
				parent.frames.document.location.href = parent.decodedAdapterLocation + "/rcsunload.html";
			}
		}
		
		try {	
			parent && parent.shell && parent.shell.navigate(request, 'adapter');
		
		}
		catch(e){
			dbg("### shell communication failed for request");
		}
		var redirectedLMS = true;
			
		try {
			if (parent.opener && request === "exit") {
				var ualc = navigator.userAgent.toLowerCase();
				var isIE = ualc.indexOf("opera") == -1 && (ualc.indexOf("msie") >= 0 || ualc.indexOf("trident") >= 0);
				if (isIE) {
					//FOR IE 9 or greater, with remote content server we need to redirect and close the window. 
					//ONLY for remote content server
					if(parent.sabaCertificate != null && request === "exit")
					{	
						parent.frames.document.location.href = parent.lms_url + "/assets/content/scorm_launch/rcsunload.html";
					}
					else
						parent.opener.Player.controller.navigate('exit', 'adapter');
				}
				else {
					try { 
						parent.frames.document.location.href = parent.lms_url + "/assets/content/scorm_launch/rcsunload.html";
					}
					catch(e)
					{
						redirectedLMS = false;
						parent.frames.document.location.href = parent.decodedAdapterLocation + "/rcsunload.html";
					}
				}
			}
		}
		catch (ex) {
			//alert(ex);
		}
		/**
		 * Changes for the remote content server. 
		 * ARC: remote content server new window template does not close the windows for player. 
		 * In case of remote content server throw the error to continue to close
		 * the windows opened by player. This will avoid the cross domain also.
		 */
		if( (redirectedLMS===true) && (parent.sabaCertificate != null && request === "exit")) {
			/**
			 * SPC-127840 - Unable to close content on first click
			 * Loading rcsunload.html page in current window which will communicate with player and sent exit command to it.
			 * Throwing an exception using throw will stop the close or exit button flow within content which usually closes the top window.
			 * Content Player receives the request from rcsunload.html page which is exit command. Player closes the top window if exists.
			 * Post that player continues to unload the content from player frames and closes the content player. 
			 */
			try { 
				parent.document.location.href = parent.lms_url + "/assets/content/scorm_launch/rcsunload.html";
			} catch(e) {
				redirectedLMS = false;
				parent.frames.document.location.href = parent.decodedAdapterLocation + "/rcsunload.html";
			}
			throw "Remote content server exception";
		}
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

		/*
		SPC-59776 - GOPATIL: Some SCORM 2004 Edition 3 contents sending navRequest as 'exitAll' always. 
		So, to rollup this contents correctly we need to set navRequest on below rule:
		-> cmi.success_status = passed or failed and cmi.completion_status = completed -> 'exitAll'
		-> Every other state 'suspendAll'
		*/
		/*if(navRequest==='exitAll'){
			if(parent.isLastSCO==='true' && 
				(parent.contentFormatVersion==='1.3.1' || parent.contentFormatVersion==='1.3') && 
				(this.GetValue("cmi.success_status")==='passed' || this.GetValue("cmi.success_status")==='failed') && 
				this.GetValue("cmi.completion_status")==='completed' &&
				(this.GetValue("cmi.exit")==='' || this.GetValue("cmi.exit")==='normal' || this.GetValue("cmi.exit")==='suspend'))
			{
				navRequest = 'exitAll';
			} else {
				navRequest = 'suspendAll';
			}
		}*/

		/*
		SPC-59776 - GOPATIL: Some SCORM 2004 Edition 3 contents sending navRequest as '_none_' even on completion. So, to rollup this contents setting navRequest to 'exitAll'.
		*/
		if(	navRequest==='_none_' && 
			parent.isLastSCO==='true' && 
			parent.contentFormatVersion==='1.3.1' && 
			this.GetValue("cmi.success_status")==='passed' && 
			this.GetValue("cmi.completion_status")==='completed' && 
			this.GetValue("cmi.exit")==='')
		{
			navRequest = 'exitAll';
		}

		if(	navRequest==='_none_' && 
			parent.isLastSCO==='true' && 
			parent.contentFormatVersion==='1.3.1' && 
			this.GetValue("cmi.success_status")==='failed' && 
			(this.GetValue("cmi.completion_status")==='incomplete' || this.GetValue("cmi.completion_status")==='completed') && 
			this.GetValue("cmi.exit")==='')
		{
			navRequest = 'suspendAll';
		}

		/* 
		SPC-59776 - GOPATIL: This condition is added for the contents which doesn't close itself and depends on Player for close behavior in RCS. 
		Also, content on close (event) sends navRequest as '_none_' instead of exit, exitAll.
		*/
		/*if (navRequest == null || navRequest == "" || navRequest == "_none_")
		{
			return false;
		}*/
		if (!(parent.isLastSCO==='true' && navRequest==='_none_' && parent.contentFormatVersion === '1.3.1') && (navRequest == null || navRequest == "" || navRequest == "_none_")) {
			return false;
		}
		
		if(cameFromContent){
			source = "content";
		}else{
			source = "adapter";
		}

		parent && parent.shell && parent.shell.navigate(navRequest, source);

		try {
			/* 
			SPC-59776 - GOPATIL: For SCORM 2004 ED2/ED3, on content exit, redirecting to rcs2004unload.htm.
			This will forward navRequest and source info to player shell.
			*/
			if(parent.isLastSCO==='true' && (navRequest==='exitAll' || navRequest==='_none_' || navRequest==='suspendAll') && ((parent.contentFormatVersion === '1.2' && parent.opener) || parent.contentFormatVersion === '1.3.1' || parent.contentFormatVersion === '1.3')){
				try { 
					parent.document.location.href = parent.lms_url + "/assets/content/scorm_launch/rcs2004unload.html?navRequest="+navRequest+"&source="+source+"&lastsco="+parent.isLastSCO+"&version="+parent.contentFormatVersion;
				} catch(e) {
					redirectedLMS = false;
					parent.frames.document.location.href = parent.decodedAdapterLocation + "/rcs2004unload.html?navRequest="+navRequest+"&source="+source+"&lastsco="+parent.isLastSCO+"&version="+parent.contentFormatVersion;
				}
			} else {
				/*
				SPC-71924 - GOPATIL - This is to identify MultiSCO content's navigation
				(parent.isLastSCO==='false' && navRequest.indexOf('choice')>-1) : MultiSCO navigating to NEXT SCO
				(parent.isLastSCO==='false' && navRequest==='exitAll') : MultiSCO closing without completion
				Exit with completion will be handled by above IF condition - (isLastSCO=true and navRequest=exitAll)
				Sending "ismultisco=true" as querystring param for rcs2004unload.html to identify multisco content request.
				*/
				if((parent.isLastSCO==='false' && navRequest.indexOf('choice')>-1) || (parent.isLastSCO==='false' && navRequest==='exitAll')){
					try { 
						parent.document.location.href = parent.lms_url + "/assets/content/scorm_launch/rcs2004unload.html?ismultisco=true&navRequest="+navRequest+"&source="+source+"&lastsco="+parent.isLastSCO+"&version="+parent.contentFormatVersion;
					} catch(e) {
						redirectedLMS = false;
						parent.frames.document.location.href = parent.decodedAdapterLocation + "/rcs2004unload.html?ismultisco=true&navRequest="+navRequest+"&source="+source+"&lastsco="+parent.isLastSCO+"&version="+parent.contentFormatVersion;
					}				
				}
				
			}
		}
		catch(e){}
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

// adapter_proxy.js

/**
 * The proxy object is the scorm api proxy that runs the
 * passed in aspects before, around or after the actual scorm api call.
 *
 * Currently a single around aspect is supported.
 *
 * Aspects implemented -
 * 	loggingAspect: 		It is responsible for logging content to adapter communication
 * 	recordingAspect:	It is responsible for generating the content to adapter communication recording
 *						that can be played later to simulate learner interactions with the content
 * 	retryAspect:		It makes set number of attempts on scorm api invokation before reporting failure.
 * 	throttlingAspect: 	It throttles the commit calls for highly communicative contents thus reduces the
 * 						load on the server.
 *
 */
var proxy = function(api, aspects) {

	var aspectMap = {
		'before': [],
		'around': null,
		'after': [],
		'isAroundAround': function() {
			return this.around;
		}
	};

	var alignAspects = function() {
		if(aspects && aspects.length && aspects.length > 0) {
			for(var index = 0; aspects.length > index; ++index) {
				var aspect = aspects[index];
				if(aspect.type === 'around') {
					aspectMap['around'] = aspect;
				} else {
					aspectMap[aspect.type] && aspectMap[aspect.type].push(aspect);
				}
			}
		}
	}();

	var executeAspects = function(type, command) {
		for(var index = 0; aspectMap[type] && aspectMap[type].length && aspectMap[type].length > index; ++index) {
			var aspect = aspectMap[type][index];
			typeof aspect.run == 'function' && aspect.run(command);
		}
	};

	var callApi = function(command) {
		return api[command.fn] && api[command.fn].apply(api, command.params);
	};

	var executeAroundAspect = function(command) {
		var result = null;
		if(aspectMap.isAroundAround()) {
			var aspect = aspectMap['around'];
			result = typeof aspect.run === 'function' && aspect.run(command);
		} else {
			result = callApi(command);
		}
		return result;
	};

	var execute = function(command)	{
		executeAspects('before', command);
		var result = executeAroundAspect(command);
		command.result = result;
		executeAspects('after', command);
		return command.result;
	};

	var makeCommand = function(method, params) {
		return {
			'fn': method,
			'params': params,
			'result': null,
			'error': null,
			'errorString': null
		};
	};

	return {
		LMSInitialize: function() {
			return execute(makeCommand('LMSInitialize', arguments));
		},

		LMSFinish: function() {
			return execute(makeCommand('LMSFinish', arguments));
		},

		LMSCommit: function() {
			return execute(makeCommand('LMSCommit', arguments));
		},

		LMSGetValue: function() {
			return execute(makeCommand('LMSGetValue', arguments));
		},

		LMSSetValue: function() {
			return execute(makeCommand('LMSSetValue', arguments));
		},

		LMSGetLastError: function() {
			return execute(makeCommand('LMSGetLastError', arguments));
		},

		LMSGetErrorString: function() {
			return execute(makeCommand('LMSGetErrorString', arguments));
		},

		LMSGetDiagnostic: function() {
			return execute(makeCommand('LMSGetDiagnostic', arguments));
		},

		completeUserSession: function() {
			return execute(makeCommand('completeUserSession', arguments));
		}
	};

};

var loggingAspect = function(api, shell) {

	return {
		type: 'after',

		run: function(command) {
			if(!command.error) {
				command.error = api.LMSGetLastError();
				command.errorString = api.LMSGetDiagnostic(command.error);
			}
			shell.log(command);
		}
	};
};

var recordingAspect = function(api, shell) {

	var lastTime = null;

	var delay = function() {
		var currentTime = new Date().getTime();
		lastTime = lastTime || currentTime;
		var diff = currentTime - lastTime; // Math.round((currentTime - lastTime)/1000);
		lastTime = currentTime;
		return diff;
	};

	return {
		type: 'after',

		run: function(command) {
			if(!command.error) {
				command.error = api.LMSGetLastError();
				command.errorString = api.LMSGetDiagnostic(command.error);
			}
			command.delay = delay();
			shell.record(command);
		}
	};
};

var retryAspect = function(api, shell) {
	var attemptLimit = 3;
	var attempts = 0;

	var isError = function(command) {
		if(!command.error) {
			command.error = api.LMSGetLastError();
			command.errorString = api.LMSGetDiagnostic(command.error);
		}
		return command.error !== '0';
	};

	var shouldRetry = function(command) {
		return command.fn === 'LMSInitialize';
	};

	var doRetry = function(command) {
		command.error = null;
		command.errorString = null;
		var result = api && api[command.fn] && api[command.fn].apply(api, command.params);
		command.result = result;
		return result;
	};

	return {
		type: 'after',

		run: function(command) {
			var result = command.result;

			if(command.fn !== 'LMSInitialize' && command.fn !== 'LMSFinish' && isError(command) && command.error === '301') { // 301: Not initialized
				this.initialize();
				doRetry(command);
			}

			while(isError(command) && attempts++ < attemptLimit && shouldRetry(command)) {
				result = doRetry(command);
			}

			if(command.fn === 'LMSInitialize' && isError(command)) {
				shell.error({
					name: 'Not initialized',
					message: 'Could not establish communication with the LMS. Can not proceed with the content. Please contact system administrator.',
					severity: 'fatal'
				});
			}
			return result;
		},

		initialize: function() {
			var command = {
				'fn': 'LMSInitialize',
				'params': [],
				'result': null,
				'error': null,
				'errorString': null
			};
			doRetry(command);
			this.run(command);
		}
	};
};

var throttlingAspect = function(api) {
	var commitFrequency = 10000; // miliseconds
	var lastCommand = null;
	var commitCommand = null;
	var commitPending = false;
	var finished = false;
	var scheduled = null;

	var commit = function() {
		if(commitPending && commitCommand) {
			commitPending = false;
			api && api[commitCommand.fn] && api[commitCommand.fn].apply(api, commitCommand.params);
			commitCommand = null;
		}
		scheduleCommit();
	};

	var scheduleCommit = function() {
		scheduled = window.setTimeout(commit, commitFrequency);
	};

	var unscheduleCommit = function() {
		if(scheduled) {
			window.clearTimeout(scheduled);
		}
	};

	return {
		type: 'around',

		run: function(command) {
			if(command.fn === 'LMSInitialize') {
				lastCommand = command;
				if(!scheduled) {
					scheduleCommit();
				}
				return api[command.fn] && api[command.fn].apply(api, command.params);
			}

			if(command.fn === 'LMSCommit') {
				commitCommand = command;
				lastCommand = command;
				commitPending = true;
				if(!scheduled) {
					scheduleCommit();
				}
				return 'true';
			}

			if(command.fn === 'LMSFinish') {
				lastCommand = command;
				if(finished) {
					return 'true';
				}
				finished = true;
				commit(); // Must call this to execute any pending commits before finish call
				unscheduleCommit();
				var result = api[command.fn] && api[command.fn].apply(api, command.params);
				if(api.LMSGetLastError() !== '0') {
					// Content can inspect and re-send LMSFinish; player doesn't.
					finished = false;
				}
				

				return result.toString();
			}

			if(command.fn === 'LMSGetValue' || command.fn === 'LMSSetValue') {
				lastCommand = command;
				return api[command.fn] && api[command.fn].apply(api, command.params);
			}

			if(command.fn === 'LMSGetLastError' && lastCommand && lastCommand.fn === 'LMSCommit') {
				return '0';
			}

			if(command.fn === 'LMSGetErrorString' && lastCommand && lastCommand.fn === 'LMSCommit') {
				return '';
			}

			if(command.fn === 'LMSGetDiagnostic' && lastCommand && lastCommand.fn === 'LMSCommit') {
				return '';
			}

			return api[command.fn] && api[command.fn].apply(api, command.params);

		}

	};

};

var proxyRequired = parent.logger || parent.recorder || parent.faultTolerance || parent.throttler;

if(proxyRequired) {
	var aspects = [];
	parent.throttler && aspects.push(throttlingAspect(parent.API));
	parent.faultTolerance && aspects.push(retryAspect(parent.API, parent.shell));
	parent.logger && aspects.push(loggingAspect(parent.API, parent.shell));
	parent.recorder && aspects.push(recordingAspect(parent.API, parent.shell));

	parent.API = proxy(parent.API, aspects);
}

var replaceCommandValues = function(inputStr, matchStr){
	var aryInStr = inputStr.split(matchStr);
	aryInStr[1] = aryInStr[1].substr(aryInStr[1].indexOf('</v>'));
	return aryInStr[0] + matchStr + aryInStr[1];
}
