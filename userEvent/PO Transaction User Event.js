/**
 * Module Description
 * 
 * Version    	Date            Author          Remarks
 * 1.00       	20 Jul 2012     mcanniff		Original code
 * 1.1			17 June 2013	mcanniff		Bug fixes for handling chartfield and quantity change in the insertCC function.
 * 1.2			18 August 2013	mcanniff		Added code to support matching multiple budgets. Amounts will now be encumbered against
 * 												all budgets that match the chartfield combination for a specific line.	
 * 1.21			19 August 2013	mcanniff		Updated code to handle the expense/item line numbers. After submit event now will 
 * 												look up line numbers from the saved transaction via a query.
 * 1.22			03 Sept 2013	mcanniff		added code in after submit to handle PO workflow approval process (instead of direct PO edit). This
 * 												workflow requires building the chartfield objects from search results instead of 
 * 												custom sublist.
 * 1.3			24 Sept 2013	mcanniff		Added support for the vendor credit transaction. This transaction does not have a status
 * 												associated with it, so the approval status is made up. The transaction only effects the 
 * 												expense bucket and is similar to regular vendor bill.
 * 1.4			29 Sept 2013	mcanniff		Added support for consolidated POs (multiple PO per VB). Also supports partial liquidation 
 * 												from the VB against the POs. Added new method to chartfield object to for this special
 * 												VB liquidation. Merged OneWorld and single company code back into one version.
 * 1.41			03 Oct 	2013	mcanniff		Added work around to handle the bug in the removelineitem function. This is in the aftersubmit event.
 * 1.42			04 Oct 	2013	mcanniff		Completed code to handle VB rejection and reversal from rejection. Will now properly encumber related PO data.	
 * 1.43			08 Oct	2013	mcanniff		Updated the before load function to add fields for the closed flag. This will support the closing of individual lines.
 * 1.5			29 Oct	2013	mcanniff		Added support for CSV data import. The basic assumption is that all data in the file is new. So
 * 												VB/PO data will be considered new records and CRUD = create. There is no support for linking
 * 												VB to PO.
 * 1.51			24 Nov	2013	mcanniff		Changed the way the before load event works to handle PO consolidation.
 * 1.52			11 Dec	2013	mcanniff		Fixed searchLedger bug where the budget definition criteria was overwriting the subsidiary criteria. 
 * 												Moved subsidiary to last search array value.
 * 1.6			02 Jan	2014	mcanniff		Added code to support transaction delete. It assumes that the delete is the equivalent to a rejection
 * 												Since the record no longer exists in the DB, the initial search will not return any rows. So all data
 * 												comes from the custom sublist. The liquidation and activity table has added a new field which is the text transaction ID
 * 												(this is the PO #). This will be used as alternate search criteria to find the liquidation entry 
 * 												for the current item. In this case PO num = null.
 * 1.61			06 Jan	2014	mcanniff		Added support for error logging to the liquidation table. There is a new checkbox field that will
 * 												be set to T when the liquidation record cannot be found. 
 * 1.62			18 Jan	2014	mcanniff		Fixed return code setting for the search ledger method.
 * 1.63 		23 Jan	2014	mcanniff		Fixed the Make Copy feature from NetSuite. The code now treats the copied
 * 												data as a brand new row including the line numbers in the custom sublist.
 * 1.64			08 Feb	2014	mcanniff		Added code to the search budget routine so that if the budget period is null, it will
 * 												set the object's period based on the trandate field. It uses the budget period type to determine
 * 												which period to use.
 * 1.65			16 Feb	2014	mcanniff		Fixed negative amount being applied to encumbrance in the case of deleting a VB line (VB status not changed)
 * 1.66			21 Feb	2014	mcanniff		Added ability to insert a new ledger record in the case that a budget is under track mode and budget detail not found
 * 1.67			10 Mar	2014	mcanniff		Fixed issue with searching for matching line on new PO. It appears that 2014.1 may have changed the way GL impacts
 * 												are reported as non-negative.
 * 1.68			26 Mar	2014	mcanniff		Fixed vendor credit lower bound issue. Also updated code to handle vendor credit record delete. 
 * 1.69			29 Mar	2014	mcanniff		Handled Vendor Bill status of Paid in Full. Modified switch in aftersubmit function
 * 1.70			07 Apr	2014	mcanniff		Added 'Partially Received' status to handle line item closes and other changes to PO after receipt.
 * 1.80			15 Jun	2014	mcanniff		Removed need for budget period, added support for annual budget, added large transaction performance increases,
 * 												support line level projects
 * 1.81			05 Aug	2014	mcanniff		Fixed issue with international dates.
 * 1.82			24 Aug 	2014	mcanniff		Fixed bug on Vendor Bill Created from PO update to chartfield change ledger.
 * 1.83			02 Sep	2014	mcanniff		Changed the PO state values to be based upon the status field and not the approval status field.
 * 1.9			18 Jan	2015	mcanniff		Added support for deferred expenses through amortization schedules. Note - the amortization schedule is not
 * 												a vendor bill search column, so these cannot be imported from CSV.  
 * 1.91			24 Jan	2015	mcanniff		Fixed bug with deleting PO. Deleted status value was not handled correctly in after submit.
 * 1.92			02 Mar	2015	mcanniff		Fixed bug with DC Bar where they do NOT use locations. Made CDLP optional in the searches based upon company features.
 * 1.93			06 Mar	2015	mcanniff		Increased performance by reducing applied line searches. Now do search for all lines in a single query.
 * 1.94			26 Mar	2015	mcanniff		Fixed bug related to null account value when editing a record via Employee Center in the Before Submit function. 
 * 1.95			08 Apr	2015	mcanniff		Fixed bug on null search record results in after submit when not using custom sublist.
 * 1.96			08 May	2015	mcanniff		Added check against user selecting customer only and not project. 
 * 1.97			30 Jun	2015	mcanniff		Added support for deleting a record from the list record view. This was different behavior due to the current record not being loaded.
 * 1.98			05 Sep	2015	mcanniff		Removed special budget date time stamp for ASD
 * 1.99			16 Oct  2015	mcanniff		Added new PO search status = Pending Billing/Partially Received. Due to change in stand alone requisition,
 * 												need to use estimatedamount field for budget check.
 * 2.00			31 Dec	2015	mcanniff		Major change to use custom segments and changes to sublist and chartfield objects. 
 * 2.01			29 Feb	2016	mcanniff		Added logic to resubmit failed large transaction batch jobs. There will be a 3 second delay prior to resubmission.
 * 2.02			19 May 	2016    mcanniff		Changed logic to search only for expense accounts in the ledger lookup. Also moved budget level lookup to
 * 												populate sublist.
 * 2.03			25 May	2016	mcanniff		Included logic to handle the expense account filter array for custom sublist not used option (workflow)
 * 2.04			03 Jun	2016	mcanniff		Added lowercase conversion to check for purchase requisition record types. Approved PRs are in CAPS.
 * 2.05			20 Jun	2016	mcanniff		Fixed bug with expense sublist on requisitions in the beforeload function. 
 * 2.06			28 Jun	2016	mcanniff		Added support for Cancel Bill button on an unapproved VB. Treat this like a deleted record (rejected).
 * 2.07			25 Jul	2016	mcanniff		Fixed incorrect reference to curRecord.
 * 2.08			29 Jul	2016	mcanniff		Handled transaction copy scenario to update the budget date = tran date, also 0 out the ledger links in the before load.
 * 2.09			03 Aug	2016	mcanniff		Changed approval status assignment to use values instead of text descriptions due to language portability.
 * 2.10			10 Aug	2016	mcanniff		Added applied fxamount * exchange rate to correctly pick up the applied values from the PO/PR. This is dependent on multicurrency feature.
 * 2.11			13 Oct	2016	mcanniff		Reversed the approval status accounting preference lookup field between PO and PR. This was setup backwards.
 * 2.12			01 Nov  2016	mcanniff		Added support for POs created via orderitems and Blanket PO. This is a new type parameter value in aftersubmit.
 * 2.20			12 Jan	2016	mcanniff		Added parent / child budgeting feature to check for over budget limits at both levels.
 * 2.21			10 Jun	2017	mcanniff		Added condition in beforeload to avoid processing email type. This has no budget impact.
 * 2.30			04 Jul	2017	mcanniff		Major update to change the search budget ledger to do a DB search instead of looping
 * 2.31			12 Aug	2017	mcanniff		Removed CSV import setting to assume new insert. Code will treat changes like any other update.
 * 2.32			29 Oct 	2017	mcanniff		Changed accttypearray reference back to using server side values for the search result validation.
 * 2.33			03 Dec	2017	mcanniff		Added support for Credit Card Charge, Refund, and Check transactions.	
 * 2.34			18 Dec	2017	mcanniff		Bitbucket #102 - Fixed issue on transformation from PO to VB. New code in pageinit.
 * 2.35			19 Dec	2017	mcanniff		Fixed approval logic related to the account type check. The search results need to use getText instead of getValue.
 * 2.36			20 Dec	2017	mcanniff		Correct FX amount calculation for approval scenario (no sublist) on search results.
 * 2.37			12 Dec	2017	mcanniff		Fixed issue for PR Approval status where estimated applied amount != PO amount
 * 2.38			26 Dec	2017	mcanniff		Order Requisition support: Major update. This form is not scriptable which allows for over budget.
 * 												Users can change the amount of the PR when submitting this form. The challenge is that the new PO
 * 												is not linked to the PR until aftersubmit. Need to throw an error back to the NS batch process in before submit.
 *												After Submit - For PR, the script will now re-save the current record ID and amount with the PR's ID copied down to the transaction column.
 *												These values will be used during PO creation.
 *												Before Submit - For PO create mode only, there will be a budget check for all lines. For budget ledgers
 *												in control mode, any over budget line will throw an error. This error then causes the Order Req job to fail. 
 * 2.39			23 Jan	2018 	mcanniff		Changed accttypearray reference to use two different arrays - one for items and one for expenses.
 * 2.40			23 Feb	2018	mcanniff		Added parent logic to update the parent segments for scenario when PO is approved. This is when
 * 												custom sublist is not used.
 * 2.41			28 Mar	2018	mcanniff		Changed ERROR messages to AUDIT.
 * 2.42			04 Apr	2018	mcanniff		Fixed incorrect status for new PO with NO PR. It was incorrectly referencing the created from.
 * 2.43			25 May	2018	mcanniff		Removed debug statement which was throwing error on CC refund transaction.
 * 2.44			31 May	2018	mcanniff		BitBucket #140 - Added budget check in the before submit function for CSV and Webservices only.
 * 2.45			15 Jul	2018	mcanniff		Bitbucket #149. Replaced logic for PO to VB conversion to use quantity and rate for item sublist. This reduces encumbrances
 * 												at the PO rate and increase expense at the VB rate. 
 * 2.46			20 Aug	2018	mcanniff		removed extra fxamount search column that was not conditional in aftersubmit. 
 * 2.47			20 Oct	2018	mcanniff		Copy paste error from the populatesublist function during the approval on parent level segment usage. Fixed in 
 * 												after submit when not using custom sublist.
 * 2.48			28 Nov	2018	mcanniff		Added skipline logic to handle PO approval (non edit mode) case. It will now skip lines which have segments excluded.
 * 2.49			02 Jan	2019	mcanniff		Added two new transaction line fields which source the item sublist account and account type. This avoids
 * 												a lookupfield call for governance. 
 * 2.50			10 Jan	2019	mcanniff		Bitbucket #50 - Support for exclude flag on all segments needed updated call to getbudgetlevelid(). 
 * 2.51			29 Jan  2019	mcanniff		Bitbucket #160 - Added ignore budget check trans body field.
 * 2.52			06 Feb	2019	mcanniff		Fixed incorrect skipline logic in aftersubmit for approval logic
 * 2.53			28 Mar	2019	mcanniff		Removed extra search for itemresults that was not being used in the approval logic. 
 * 2.54			14 Apr	2019	mcanniff		Reverted code to use checktransoverbudget - mistake to change to processlines.
 * 2.55			15 May	2019	mcanniff		Bitbucket #163 - Fixed search against the record to use a saved search for oneworld and multi-currency.
 * 2.56			23 May	2019	mcanniff		Bitbucket #165 - Support for custom segment unified IDs. Needed to add 'line.' in front of search columns fields.
 * 2.57			12 Sep	2019	mcanniff		Replaced all for i in loops with traditional counter loops due to incorrect javascript usage on arrays.
 * 												Bitbucket #191 - Addressed handling of no account segment for workflow based transaction submissions in after submit.
 * 2.58			16 Oct	2019	mcanniff		Bitbucket #192 - Don't allow changes to VB which are coming from PO.
 * 2.59			26 Oct	2019	mcanniff		Bitbucket #193 - Provided for ignore amortization schedule on special transactions
 * 2.60			16 Dec	2019	mcanniff		Supported ER transition from Pending Accounting Approval -> Paid In Full.  
 * 2.61			31 Dec	2019	mcanniff		Added approval status case of PR Rejected No Change (reused the PO Rejected value). 
 * 2.62			16 Jan	2019	mcanniff		Set the old amount to 0 when a VC is created from a VB. The VC amount should not count against the budget. 
 * 2.63			20 Jan	2019	mcanniff		Added filter to ignore tax line GL impacts on transaction searches. This was creating extra budget impacts for the tax accounts.
 * 2.64			06 Feb	2020	mcanniff		Bitbucket #210 - Provided support for memorized transactions submitted via batch processing.
 * 2.65			09 Feb	2020	mcanniff		Bitbucket #214 - Fixed issue with beforeload function incorrect amount field on PR.
 * 2.66			17 Feb	2020	mcanniff		Bitbucket #165 - Fixed logic on before submit search that was still using old format on unified segment
 * 2.67			23 Feb	2020	mcanniff		Added 'Paid in Full' old status check for expense reports. This may only occur on CSV imports
 * 2.68         26 Feb  2020    sfigel          Bitbucket #65 - Added logic to before load and before submit for close transaction button
 * 2.69			01 Mar	2020	mcanniff		Added one more setting of budget date in the beforesubmit in case it is blank coming from CSV.  
 * 2.70			15 Mar	2020	mcanniff		Added calls to calcAmortStartEnd function in aftersubmit during the approval process. 
 * 2.71	        11 Mar  2020    sfigel			Added logic to the close button to make sure that the flag is set to false when the transaction type is not a PO or PR
 * 2.72			03 Apr	2020	mcanniff		Bitbucket #224 - Support for Spanish language status fields. 
 * 2.73			18 Apr 	2020	mcanniff		Bitbucket #225 - NA. No change
 * 2.74	        22 Apr  2020	sfigel			Updated logic for close all lines button. Added check for Cognita, since they have different process
 * 2.75			23 Apr	2020	mcanniff		Support for new Expense Report approval status = 11 Open. 
 * 2.76			12 May	2020	mcanniff		Bitbucket #234 - Added currency to saved searches to support PR multicurrency. 	
 * 2.77			20 May	2020	mcanniff		Bitbucket #233 - New logic to handle budget vs std amortization schedules
 * 2.78			05 Jun	2020	mcanniff		Bitbucket #211 - PO Consolidation with Different Budget Dates Impacts Only the first Period fix. Now use applied dates
 * 2.79			17 Jun	2020	mcanniff		Bitbucket #229 - Added closed to search results in after submit. Check for closed during workflow processing and skip line.
 * 2.80			14 Aug	2020	mcanniff		Added support for ER Paid in Full --> ER Accounting Approval transition in after submit
 * 2.81			21 Jun	2020	mcanniff		Bitbucket #242 - Handled case of PR delete after rejection to avoid double impact.
 * 2.82			06 Jul	2020	mcanniff		Bitbucket #248 - Need to use estimated amount on PR for setting the custcol_appliedamount_cc field.
 * 2.83			07 Jul	2020	mcanniff		Bitbucket #249 - Handled copy VB error with "lines have changed" problem in the beforeload event. 
 * 2.84			21 Aug 	2020	mcanniff		Bitbucket #157 - Support VB as encumbrance when unapproved. 
 * 2.85 		16 Sep	2020	mcanniff		Cyberark update to handle Expensify integration with department change. 
 * 2.86			22 Dec	2020	mcanniff		Bitbucket #245 - Changed budget date setting to use posting period start state when option is set at company preference
 * 2.87			18 Jan	2021	mcanniff		Bitbucket #263 - Support for client side Blanket PO. 
 * 2.88			29 Jan	2021	mcanniff		Bitbucket #286 - aftersubmit event modified to set the budget date in the transaction via submitfield function call. Only occurs when empty
 * 2.89			18 Apr	2021	mcanniff		Bitbucket #290 - Support negative rates and amounts on line items. 
 * 												Bitbucket #304 - Handle In Progress status report for Expense Reports.
 * 2.90			27 Apr	2021	mcanniff		Bitbucket #307 - Reversed logic to allow for blank/null closed field value in beforesubmit function.
 * 2.91			06 Jun	2021	mcanniff		Added check to enable budget date field for transform from VB to VC. Now only the PO to VB is disabled.
 * 2.92			09 Jun	2021	mcanniff		Bitbucket #318 - Handle new status value and Close All Lines button when advanced approvals is OFF. 
 * 2.93			23 Jun	2021	mcanniff		Bitbucket #213 - Support for turning on and off the Ignore Budget checkbox on transaction
 * 2.94			11 Jul	2021	mcanniff		Bitbucket #322 - Completed server side impact for Blanket PO transaction. 
 * 2.95			13 Jul	2021	mcanniff		Bitbucket #329 - added record type column to the applied search results in after submit  
 * 2.96			05 Aug	2021	mcanniff		Bitbucket #334 - Update aftersubmit to properly set the VB budget date based on the PO budget date.
 * 2.97			02 Oct	2021	sfigel			Added a fix to a copy bug that saved the value of the line rollover processed flag when copying a transaction.
 * 2.98			04 Oct 	2021	mcanniff		Bitbucket #249 - Commented out code to blank out the ledger link on copy transaction
 * 2.99			17 Oct	2021	mcanniff		Bitbucket #342 - Added downstream applying transaction to search results in after submit function
 * 3.00			25 Oct	2021	mcanniff		Bitbucket #318 - Changed criteria on when to display the custom button in before load. 
 * 3.01			16 Nov	2021	mcanniff		Bitbucket #342 - Modified curAmount calculation to use quantity * rate to properly reduce the quantity billed from the quantity on PO. 
 * 3.02			27 Feb	2022	mcanniff		Bitbucket #361 - Added pause in the aftersubmit so that expense report can be committed.
 * 3.03			28 Mar	2022	mcanniff		Bitbucket #364 - Put in check for GBB to not use Close All Lines.
 * 3.04			21 Apr	2022	mcanniff		Bitbucket #365 - Load in language translation file in before load function. This is saved in a hidden body field.
 * 
 */


/*
 * This function creates the custom sublist that is needed to manage all of the modifications of the PO/VB records. 
 * Note - The addField function will use a null string for the label in the production version of the code. This is used so that
 * 		the actual sublist does not show up on the page. When all of the fields and the subtabs are missing labels, then the
 * 		sublist becomes hidden. The hidden option on the form object does NOT work, since the data would not be saved. 
 * 
 * 		A blanket PO does NOT trigger the before load or submit events.

 */

function potranBeforeLoad(type, form, request){
	var errmsg = 'Type = ' + type + ' Form = ' + form;
	nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
//	THIS CODE IS FOR TESTING PURPOSES TO INSPECT THE REQUEST OBJECT AS PASSED IN BY THE BROWSER.
//	if (request) {
//		var keys = Object.keys(request);
//		for (var i in keys) {
//			errmsg += keys[i] + '|';
//		}
//		errmsg += ' ' + request.getMethod() ;
//		nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
//		var parms = request.getParameterValues('transform');
//		for (var i in parms) {
//			errmsg = 'parms = ' + parms[i];
//			nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
//			
//		}
//	}
	// parameters.transform
	//User Event Script to Create custom button on Purchase Order Form
	var currentContext = nlapiGetContext();
	var bcInstallFlag = currentContext.getSetting('SCRIPT', 'custscript_bcinstallflag_cc');
	var languageFileName = currentContext.getSetting('SCRIPT', 'custscript_langfile_pbc');		// Bitbucket #365 - New parameter for translation file name
	var languageString = '';
	var userLanguage = currentContext.getPreference('language');	
	var languageJSON = null;
	var recType = nlapiGetRecordType();
	var recStatus = nlapiGetFieldValue('status');
	var companyConfig = nlapiLoadConfiguration('companyinformation');
	var companyId = companyConfig.getFieldValue('companyid');
	if (currentContext.getExecutionContext() == 'scheduled' ) return;

	if (bcInstallFlag == 'T') {
		try {			// Bitbucket #365 - Load the JSON language translation file
	//			var languageFile = nlapiLoadFile('PyanGo Budgetary Control Documentation/PBC Translations.json');		// Development account
			var languageFile = nlapiLoadFile(languageFileName);  // Development bundle 
			errmsg = 'Language File ID = ' + languageFile.getId();
			nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
			languageString = languageFile.getValue();
			if (isEmpty(languageString)) {
				log.debug('PBC Budget Xfer Beforeload', 'JSON language translation string is not used.');
			} else {
				languageJSON = JSON.parse(languageString);
			}
		} catch (e) {
			errmsg = 'No language file found -> ' + e.getCode() + '\n' + e.getDetails();
			nlapiLogExecution('AUDIT', 'PBC potranBeforeLoad', errmsg);		
		}
	}			

	if (bcInstallFlag == 'T' && recType == 'purchaseorder' && type == 'view') { 
//			&& companyId.indexOf('3906557') == -1				// 4-22-20 cognita check. 
//			&& (recStatus != 'Fully Billed' && recStatus != 'Pending Supervisor Approval' && recStatus != 'Rejected by Supervisor' && recStatus != 'Pending Billing/Partially Received' && recStatus !=  'Closed')) {
		// sfigel 2/12/2020 Links customscript_closetranslines_cc to customscript_potransaction_userevent_cc for use in Close All PO Lines button
		var buttStdClose = form.getButton('closeremaining'); 					// Bitbucket #318 - Standard NS Close button
		if (buttStdClose != null) { 
			buttStdClose.setVisible(false); 
			// Add custom button
			if (companyId.indexOf('4560797') == -1) {		// Bitbucket #364 - GBB company test. Only show PyanGo button for non-GBB
				form.setScript('customscript_closetranslines_cc'); 
				if (languageJSON) {				// Bitbucket #365 - check for language translation
					currentContext.setSessionObject('confirmString', languageJSON['TRN018'][userLanguage]);		// This is the only way to pass a parameter to the suitelet to close the lines
					form.addButton('custpage_po_btn_close', languageJSON['TRN017'][userLanguage], 'closeTransactionLines()');
				} else {
					form.addButton('custpage_po_btn_close', 'Close All Lines', 'closeTransactionLines()');
				}
			}
		}
	}
	
	if(bcInstallFlag == 'T' && (type != 'view' && type != 'print' && type != 'email')) {
		
		var featureConfig = nlapiLoadConfiguration('accountingpreferences');
		var usePostingPeriod = currentContext.getSetting('SCRIPT', 'custscript_useperiod_cc');
		var tranDate = nlapiGetFieldValue('trandate');
		var bcDebugFlag = nlapiGetContext().getSetting('SCRIPT', 'custscript_bcdebugflag_cc');
		var copyAmortFlag = nlapiGetContext().getSetting('SCRIPT', 'custscript_copyposched_cc');
		var budgetDateField = form.getField('custbody_budgetdate_cc');
		var transformFlag = null;
//		var ignoreField = null;
		var subItem = form.getSubList('item');
		var subExpense = null;
		var amortSchedField = 'amortizationsched';
		var amortStartField = 'amortizstartdate';
		var amortEndField = 'amortizationenddate';
		// The transform parameter will be null for regular transaction edits. But when a PO is transformed into VB, then it will return an array
		// The first element of the array will contain a single word 'purchord'. 
		// Since PRs are created via a batch process, the entire request parameter is null. So no need to check for PR transform to PO. 
		var transformType = request ? request.getParameterValues('transform') : null;

//		Bitbucket #213 - removed the check in before load for ignoring budget check. Will need to always execute this function. 		
//		if (nlapiGetFieldValue('custbody_ignorebudchk_cc') == 'T') {
//			nlapiLogExecution('AUDIT', 'PBC potranBeforeLoad' ,'The Ignore Budget Check field is turned on. No budget check will occur. ');
//			return;
//		}
		errmsg = 'Expense are installed = ' + featureConfig.getFieldValue('poexpenses') + ' tran date = ' + tranDate + ' context = ' + currentContext.getExecutionContext()
			+ ' rectype = ' + recType + ' transform = ' + transformType + ' use period = ' + usePostingPeriod;
		nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
		if (currentContext.getSessionObject('Calling Script') == 'Ignore Budget Check') {
			errmsg = 'The Ignore Budget Check session object is ON';
			nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);			
			return;		
		}
		if ((recType != 'purchaseorder' && recType != 'purchaserequisition') || featureConfig.getFieldValue('poexpenses') == 'T') {	
			subExpense = form.getSubList('expense');		
		}
		if ((recType == 'purchaseorder' || recType == 'purchaserequisition')) {	
			amortSchedField = 'custcol_poamortid_pbc';
			amortStartField = 'custcol_poamortstart_pbc';
			amortEndField = 'custcol_poamortend_pbc';
		}



		
		if (bcDebugFlag == 'T') {
			// this field will be used to determine if the transaction has been editted in the aftersubmit
			// event. When workflow is used, the transaction before load script is not executed so that the 
			// custom fields will not be present.
			var transEditFlag = form.addField('custpage_transedit_flag', 'checkbox', 'Transaction Edit Mode');		// DEBUG VERSION
			transEditFlag.setDisplayType('disabled');
			transEditFlag.setDefaultValue('T');
			transformFlag = form.addField('custpage_transform_flag', 'checkbox', 'VB Transform Mode');
			transformFlag.setDisplayType('disabled');
			var languageStringField = form.addField('custpage_languagestring', 'longtext', 'Language JSON String');		// Bitbucket #365 - hidden field to hold the JSON string
			languageStringField.setDefaultValue(languageString);
			languageStringField.setDisplayType('disabled');
			
//			ignoreField = form.addField('custpage_ignorebudget_flag', 'checkbox', 'Old Ignore Budget Check');
//			ignoreField.setDisplayType('disabled');
			if (subItem) {			// subitem will be null for expense reports.
				var oldItemClosedField = subItem.addField('custpage_olditemclosedflag_cc', 'checkbox', 'Old Closed Flag');		
				var oldAccount = subItem.addField('custpage_olditemaccount_cc', 'integer', 'Old Account');	
				var oldAmountField = subItem.addField('custpage_olditemamount_cc', 'currency', 'Old Amount');	
				var oldAmortSched = subItem.addField('custpage_olditemamortsched_cc', 'integer', 'Old Amort Sched');
				var oldAmortStart = subItem.addField('custpage_olditemamortstart_cc', 'date', 'Old Amort Start');
				var oldAmortEnd = subItem.addField('custpage_olditemamortend_cc', 'date', 'Old Amort End');
				var oldAmortPeriods = subItem.addField('custpage_olditemamortperiods_cc', 'integer', 'Old Amort Periods');
				var oldAmortOffset = subItem.addField('custpage_olditemamortoffset_cc', 'integer', 'Old Amort Offset');
				var oldBlanketData = subItem.addField('custpage_olditemblanket_cc', 'textarea', 'Old Blanket Data');
				var curBlanketData = subItem.addField('custpage_curitemblanket_cc', 'textarea', 'New Blanket Data');
//				var oldAppliedFxAmount = subItem.addField('custpage_olditemappfxamt_cc', 'currency', 'Old Applied FX Amount');
				oldAmountField.setDisplayType('disabled');
				oldItemClosedField.setDisplayType('disabled');
				oldAccount.setDisplayType('disabled');
				oldAmortSched.setDisplayType('disabled');
				oldAmortStart.setDisplayType('disabled');
				oldAmortEnd.setDisplayType('disabled');
				oldAmortPeriods.setDisplayType('disabled');
				oldAmortOffset.setDisplayType('disabled');
				oldBlanketData.setDisplayType('disabled');
				curBlanketData.setDisplayType('disabled');
//				oldAppliedFxAmount.setDisplayType('hidden');
			}
			
			if (subExpense) {	
				var oldExpenseField = subExpense.addField('custpage_oldexpamount_cc', 'currency', 'Old Amount');		// DEBUG VERSION
				var oldExpClosedField = subExpense.addField('custpage_oldexpclosedflag_cc', 'checkbox', 'Old Closed Flag');		
				var oldAmortSched = subExpense.addField('custpage_oldexpamortsched_cc', 'integer', 'Old Amort Sched');
				var oldAmortStart = subExpense.addField('custpage_oldexpamortstart_cc', 'date', 'Old Amort Start');
				var oldAmortEnd = subExpense.addField('custpage_oldexpamortend_cc', 'date', 'Old Amort End');
				var oldAmortPeriods = subExpense.addField('custpage_oldexpamortperiods_cc', 'integer', 'Old Amort Periods');
				var oldAmortOffset = subExpense.addField('custpage_oldexpamortoffset_cc', 'integer', 'Old Amort Offset');
				var oldBlanketData = subExpense.addField('custpage_oldexpblanket_cc', 'textarea', 'Old Blanket Data');
				var curBlanketData = subExpense.addField('custpage_curexpblanket_cc', 'textarea', 'New Blanket Data');
//				var oldAppliedFxAmount = subItem.addField('custpage_oldexpappfxamt_cc', 'currency', 'Old Applied FX Amount');
				oldExpenseField.setDisplayType('disabled');
				oldExpClosedField.setDisplayType('disabled');
				oldAmortSched.setDisplayType('disabled');
				oldAmortStart.setDisplayType('disabled');
				oldAmortEnd.setDisplayType('disabled');
				oldAmortPeriods.setDisplayType('disabled');
				oldAmortOffset.setDisplayType('disabled');
				oldBlanketData.setDisplayType('disabled');
				curBlanketData.setDisplayType('disabled');
//				oldAppliedFxAmount.setDisplayType('disabled');
			}			
			
		} else {
			var transEditFlag = form.addField('custpage_transedit_flag', 'checkbox', '');
			transformFlag = form.addField('custpage_transform_flag', 'checkbox', '');
			transEditFlag.setDisplayType('hidden');
			transEditFlag.setDefaultValue('T');
			transformFlag.setDisplayType('hidden');
			var languageStringField = form.addField('custpage_languagestring', 'longtext', '');		// Bitbucket #365 - hidden field to hold the JSON string
			languageStringField.setDefaultValue(languageString);
			languageStringField.setDisplayType('hidden');
//			ignoreField = form.addField('custpage_ignorebudget_flag', 'checkbox', '');
//			ignoreField.setDisplayType('hidden');
			if (subItem) {			// subitem will be null for expense reports.
				var oldAmountField = subItem.addField('custpage_olditemamount_cc', 'currency', '');		// PRODUCTION VERSION
				var oldItemClosedField = subItem.addField('custpage_olditemclosedflag_cc', 'checkbox', '');		
				var oldAccount = subItem.addField('custpage_olditemaccount_cc', 'integer', '');		
				var oldAmortSched = subItem.addField('custpage_olditemamortsched_cc', 'integer', '');
				var oldAmortStart = subItem.addField('custpage_olditemamortstart_cc', 'date', '');
				var oldAmortEnd = subItem.addField('custpage_olditemamortend_cc', 'date', '');
				var oldAmortPeriods = subItem.addField('custpage_olditemamortperiods_cc', 'integer', '');
				var oldAmortOffset = subItem.addField('custpage_olditemamortoffset_cc', 'integer', '');
				var oldBlanketData = subItem.addField('custpage_olditemblanket_cc', 'textarea', '');
				var curBlanketData = subItem.addField('custpage_curitemblanket_cc', 'textarea', '');
//				var oldAppliedFxAmount = subItem.addField('custpage_olditemappfxamt_cc', 'currency', '');
				oldAmountField.setDisplayType('hidden');
				oldItemClosedField.setDisplayType('hidden');
				oldAccount.setDisplayType('hidden');
				oldAmortSched.setDisplayType('hidden');
				oldAmortStart.setDisplayType('hidden');
				oldAmortEnd.setDisplayType('hidden');
				oldAmortPeriods.setDisplayType('hidden');
				oldAmortOffset.setDisplayType('hidden');
				oldBlanketData.setDisplayType('hidden');
				curBlanketData.setDisplayType('hidden');
//				oldAppliedFxAmount.setDisplayType('hidden');
			}
			
			if (subExpense) {	
				var oldExpenseField = subExpense.addField('custpage_oldexpamount_cc', 'currency', '');		// PRODUCTION VERSION
				var oldExpClosedField = subExpense.addField('custpage_oldexpclosedflag_cc', 'checkbox', '');		
				var oldAmortSched = subExpense.addField('custpage_oldexpamortsched_cc', 'integer', '');
				var oldAmortStart = subExpense.addField('custpage_oldexpamortstart_cc', 'date', '');
				var oldAmortEnd = subExpense.addField('custpage_oldexpamortend_cc', 'date', '');
				var oldAmortPeriods = subExpense.addField('custpage_oldexpamortperiods_cc', 'integer', '');
				var oldAmortOffset = subExpense.addField('custpage_oldexpamortoffset_cc', 'integer', '');
				var oldBlanketData = subExpense.addField('custpage_oldexpblanket_cc', 'textarea', '');
				var curBlanketData = subExpense.addField('custpage_curexpblanket_cc', 'textarea', '');
///				var oldAppliedFxAmount = subItem.addField('custpage_oldexpappfxamt_cc', 'currency', '');
				oldExpenseField.setDisplayType('hidden');
				oldExpClosedField.setDisplayType('hidden');
				oldAmortSched.setDisplayType('hidden');
				oldAmortStart.setDisplayType('hidden');
				oldAmortEnd.setDisplayType('hidden');
				oldAmortPeriods.setDisplayType('hidden');
				oldAmortOffset.setDisplayType('hidden');
				oldBlanketData.setDisplayType('hidden');
				curBlanketData.setDisplayType('hidden');
//				oldAppliedFxAmount.setDisplayType('hidden');
			}			
		}
		if (transformType) {
			errmsg = ' transform option = ' + transformType[0];
			nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);	
			if (transformType[0] == 'purchord') 
				transformFlag.setDefaultValue('T');
			else
				transformFlag.setDefaultValue('F');
		}


		// the transaction date will be null on a CREATE record. On a COPY it will be today's date.
		// Note - the transaction date is null in the beforeload function for a create transaction. 
		// The budget date is copied from the old transaction during a copy. This should be set to transaction date.
		
		if (type == 'create' || type == 'copy' || currentContext.getExecutionContext() == 'csvimport') {		// only set the budget date for new or copied transactions 
			//var stringDate = curDate.getFullYear() + '-' + (curDate.getMonth() + 1) + '-' + curDate.getDate();		// need to add 1 to the month, since it starts at zero
//			nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', type + ' tran date = ' + nlapiGetFieldValue('trandate') + ' ' + nlapiGetFieldValue('custbody_budgetdate_cc'));
//			if (transformType && transformType[0] == 'purchord') {						// Bitbucket #192 - Don't allow changes to VB which are coming from PO.
//				budgetDateField.setDisplayType('disabled');		// must set display type in script since CSV requires field to be normal type				
//			}
			// for copy, the sourcing does not work properly. NS will copy the custom sourced field from the original transaction. But this will not be changed
			// even though the transaction date and the real posting period is modified on the new transaction to the current day. 
			// therefore set the custom sourced field to the current period start date. 
			if (type == 'copy') {
				
				var budgetDate = nlapiGetFieldValue('trandate');

				if (usePostingPeriod == 'T') {		// Bitbucket #245 - on a transaction copy, it appears that sourcing does not occur. 
//					errmsg = 'Use Posting Period = ' +  nlapiGetFieldValue('postingperiod') + ' start date = ' + nlapiGetFieldValue('custbody_periodstartdate_cc');
//					nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);	
					if (isEmpty(nlapiGetFieldValue('postingperiod')) ) {
						budgetDate = nlapiGetFieldValue('trandate');			// this is for non-posting transactions 
					} else {			
						budgetDate = nlapiLookupField('accountingperiod', nlapiGetFieldValue('postingperiod'), 'startdate');
						nlapiSetFieldValue('custbody_periodstartdate_cc', budgetDate);			// force the sourcing to pick up the current start date of the period. 
					}
				}
				nlapiSetFieldValue('custbody_budgetdate_cc', budgetDate);
			}
		} else {
//			budgetDateField.setDisplayType('disabled');		// must set display type in script since CSV requires field to be normal type
		}

		if (isEmpty(tranDate)) {
			tranDate = nlapiDateToString(new Date());			// default to today's date
		}
		// Bitbucket #210 - the only way to check for a memorized transaction is to look at context and type being copy.
		// The memorized field is only accessible through search, not on the actual record
		// Note - this only occurs when the Enter Multiple batch process is used in NS. When submitting a single memorized transaction, the regular edit process applies
		if (currentContext.getExecutionContext() == 'userevent' && type == 'copy') {
			errmsg = 'Memorized transaction encountered = ' + recType;
			nlapiLogExecution('AUDIT', 'PBC potranBeforeLoad', errmsg);
			return;
		}
		for (var i = 1; i <= nlapiGetLineItemCount('item'); i++ ) {
//			var amount = parseFloat(nlapiGetLineItemValue('item', 'amount', i));
			var closedFlag = nlapiGetLineItemValue('item', 'isclosed', i);
			var line = parseFloat(nlapiGetLineItemValue('item', 'line', i));
//			var account = nlapiLookupField('item', nlapiGetLineItemValue('item', 'item', i), 'expenseaccount');
			var account = nlapiGetLineItemValue('item', 'custcol_itemaccttype_cc', i);
			var amortSched = nlapiGetLineItemValue('item', 'amortizationsched', i);
			var lineData = new Object();
			// Bitbucket #214 - bug with PR in using incorrect amount field.
			var amount = 0.0;
			if (recType.toLowerCase() == 'purchaserequisition')
				amount = parseFloat(nlapiGetLineItemValue('item', 'estimatedamount', i));
			else
				amount = parseFloat(nlapiGetLineItemValue('item', 'amount', i));
			
			if (transformType && transformType[0] == 'vendbill' && type == 'create'){			// 1-15-20 Vendor credit coming from VB should not count against budget. 
				amount = 0.0;
			}
			if (copyAmortFlag == 'T' && !isEmpty(nlapiGetLineItemValue('item', 'custcol_poamortsched_pbc', i)) && isEmpty(nlapiGetLineItemValue('item', 'amortizationsched', i))) {
				errmsg = 'PO template internal ID = ' + nlapiGetLineItemValue('item', 'custcol_poamortid_pbc', i) + ' sched = ' + nlapiGetLineItemText('item', 'custcol_poamortsched_pbc', i);
				nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
				// the real amort template internal ID is in a sourced field on the sublist. Use this field to preset the VB template.
				nlapiSetLineItemValue('item', 'amortizationsched', i, nlapiGetLineItemValue('item', 'custcol_poamortid_pbc', i));
				nlapiSetLineItemValue('item', 'amortizstartdate', i, nlapiGetLineItemValue('item', 'custcol_poamortstart_pbc', i));
				nlapiSetLineItemValue('item', 'amortizationenddate', i, nlapiGetLineItemValue('item', 'custcol_poamortend_pbc', i));
			}

			if (account == null || account == '') {
				account = nlapiLookupField('item', nlapiGetLineItemValue('item', 'item', i), 'expenseaccount');
			}
			nlapiSetLineItemValue('item', 'custpage_olditemaccount_cc', i, account);
			if (type != 'copy') {
				lineData.tranDate = tranDate;
				lineData.oldAmortSched = nlapiGetLineItemValue('item', amortSchedField, i);
				lineData.oldAmortStart = nlapiGetLineItemValue('item', amortStartField, i);;
				lineData.oldAmortEnd = nlapiGetLineItemValue('item', amortEndField, i);
	
				errmsg = 'Item line[' + i + '] line = ' + line + ' amount = ' + amount + ' closed flag = ' + closedFlag + ' account = ' + account + ' sched = ' + lineData.oldAmortSched;
				nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
	
				if ((lineData.oldAmortSched != null && lineData.oldAmortSched != '') 
						&& ((lineData.oldAmortStart == null || lineData.oldAmortStart == '') 
								|| (lineData.oldAmortEnd == null || lineData.oldAmortEnd == ''))) {
					var amortRecord = nlapiLoadRecord('amortizationtemplate', lineData.oldAmortSched);		// need to load the record instead of search since the STUPID netsuite search column is a text field
					
					lineData.oldAmortPeriods = amortRecord.getFieldValue('amortizationperiod');
					lineData.oldAmortOffset = amortRecord.getFieldValue('periodoffset');
					calcAmortStartEnd(lineData, 'old');
					
				}
				
				nlapiSetLineItemValue('item', 'custpage_olditemamortsched_cc', i, lineData.oldAmortSched);
				nlapiSetLineItemValue('item', 'custpage_olditemamortstart_cc', i, lineData.oldAmortStart);
				nlapiSetLineItemValue('item', 'custpage_olditemamortend_cc', i,	lineData.oldAmortEnd);
				nlapiSetLineItemValue('item', 'custpage_olditemamortperiods_cc', i,	lineData.oldAmortPeriods);
				nlapiSetLineItemValue('item', 'custpage_olditemamortoffset_cc', i,	lineData.oldAmortOffset);

				if (!isNaN(amount))
					nlapiSetLineItemValue('item', 'custpage_olditemamount_cc', i, amount);
				nlapiSetLineItemValue('item', 'custpage_olditemclosedflag_cc', i, closedFlag);
				if (recType == 'blanketpurchaseorder') {
					// there does not appear a way to iterate through the schedule details. The schedule is an array of objects. 
					// Need to convert entire object to string and then extract the array. This will will be saved in the old data field. 
					var schedSubrecord = nlapiViewLineItemSubrecord('item', 'orderschedule', i);
					if (!isEmpty(schedSubrecord)) {
						var schedObj = JSON.parse(JSON.stringify(schedSubrecord));
						var schedDetail = schedObj.schedule;
						// the item schedule does not have an amount field. Need to populate this for the client side to use. 
						for (var j = 0; j < schedDetail.length; j++) {
							schedDetail[j].amount = schedDetail[j].quantity * parseFloat(nlapiGetLineItemValue('item', 'rate', i))
						}
//						errmsg = 'Updated schedule string = ' + JSON.stringify(schedDetail);
//						nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
						
						nlapiSetLineItemValue('item', 'custpage_olditemblanket_cc', i,JSON.stringify(schedDetail));
						nlapiSetLineItemValue('item', 'custpage_curitemblanket_cc', i,JSON.stringify(schedDetail));
					}
				}
			} else {				// move this code to client. Case 2481656
                // Update 2.97: Make sure that on copy every line does not have a true line rollover processed checkbox
				nlapiSetLineItemValue('item', 'custcol_line_rollover_processed_pbc', i, 'F');
				nlapiSetLineItemValue('item', 'custpage_olditemamortsched_cc', i, '');
				nlapiSetLineItemValue('item', 'custpage_olditemamortstart_cc', i, '');
				nlapiSetLineItemValue('item', 'custpage_olditemamortend_cc', i,	'');
				nlapiSetLineItemValue('item', 'custpage_olditemamortperiods_cc', i,	'');
				nlapiSetLineItemValue('item', 'custpage_olditemamortoffset_cc', i,	'');
				// decided to comment this out and let the client side pageinit handle clearing this field. Copy case should be handled on client
//				if (recType != 'vendorbill' || companyId.indexOf('4678143') == -1) {				// Bitbucket #249 - CyberArk "lines have changed since loaded" error
//					nlapiSetLineItemValue('item', 'custcol_ledgerlink_cc', i, 0);		// the ledger links are no longer valid on a copy, since the budget date may have changed
//				}
			}
		}
		if (subExpense) {	
			for (var i = 1; i <= nlapiGetLineItemCount('expense'); i++ ) {
//				var amount = parseFloat(nlapiGetLineItemValue('expense', 'amount', i));
				var closedFlag = nlapiGetLineItemValue('expense', 'isclosed', i);
				var line = nlapiGetLineItemValue('expense', 'line', i);
				var lineData = new Object();
				// Bitbucket #214 - bug with PR in using incorrect amount field.
				var amount = 0.0;
				if (recType.toLowerCase() == 'purchaserequisition')
					amount = parseFloat(nlapiGetLineItemValue('expense', 'estimatedamount', i));
				else
					amount = parseFloat(nlapiGetLineItemValue('expense', 'amount', i));
				
				if (transformType && transformType[0] == 'vendbill' && type == 'create'){			// 1-15-20 Vendor credit coming from VB should not count against budget. 
					amount = 0.0;
				}
				if (copyAmortFlag == 'T' && !isEmpty(nlapiGetLineItemValue('expense', 'custcol_poamortsched_pbc', i)) && isEmpty(nlapiGetLineItemValue('expense', 'amortizationsched', i))) {
					errmsg = 'PO template internal ID = ' + nlapiGetLineItemValue('expense', 'custcol_poamortid_pbc', i) + ' sched = ' + nlapiGetLineItemText('expense', 'custcol_poamortsched_pbc', i);
					nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
					// the real amort template internal ID is in a sourced field on the sublist. Use this field to preset the VB template.
					nlapiSetLineItemValue('expense', 'amortizationsched', i, nlapiGetLineItemValue('expense', 'custcol_poamortid_pbc', i));
					nlapiSetLineItemValue('expense', 'amortizstartdate', i, nlapiGetLineItemValue('expense', 'custcol_poamortstart_pbc', i));
					nlapiSetLineItemValue('expense', 'amortizationenddate', i, nlapiGetLineItemValue('expense', 'custcol_poamortend_pbc', i));
				}
				if (type != 'copy') {
					lineData.tranDate = tranDate;
					lineData.oldAmortSched = nlapiGetLineItemValue('expense', amortSchedField, i);
					lineData.oldAmortStart = nlapiGetLineItemValue('expense', amortStartField, i);;
					lineData.oldAmortEnd = nlapiGetLineItemValue('expense', amortEndField, i);
	
					errmsg = 'EXPENSE line[' + i + '] line = ' + line + ' amount = ' + amount + ' closed flag = ' + closedFlag + ' sched = ' + lineData.oldAmortSched;
					nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
	
					if ((lineData.oldAmortSched != null && lineData.oldAmortSched != '') 
							&& ((lineData.oldAmortStart == null || lineData.oldAmortStart == '') 
									|| (lineData.oldAmortEnd == null || lineData.oldAmortEnd == ''))) {
						var amortRecord = nlapiLoadRecord('amortizationtemplate', lineData.oldAmortSched);		// need to load the record instead of search since the STUPID netsuite search column is a text field
						
						lineData.oldAmortPeriods = amortRecord.getFieldValue('amortizationperiod');
						lineData.oldAmortOffset = amortRecord.getFieldValue('periodoffset');
						calcAmortStartEnd(lineData, 'old');				
					}
					
					
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortsched_cc', i, lineData.oldAmortSched);
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortstart_cc', i, lineData.oldAmortStart);
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortend_cc', i,	lineData.oldAmortEnd);
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortperiods_cc', i,	lineData.oldAmortPeriods);
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortoffset_cc', i,	lineData.oldAmortOffset);
		
					if (!isNaN(amount))
						nlapiSetLineItemValue('expense', 'custpage_oldexpamount_cc', i, amount);
					nlapiSetLineItemValue('expense', 'custpage_oldexpclosedflag_cc', i, closedFlag);
					if (recType == 'blanketpurchaseorder') {
						// there does not appear a way to iterate through the schedule details. The schedule is an array of objects. 
						// Need to convert entire object to string and then extract the array. This will will be saved in the old data field. 
						var schedSubrecord = nlapiViewLineItemSubrecord('expense', 'orderschedule', i);
						if (!isEmpty(schedSubrecord)) {
							var schedObj = JSON.parse(JSON.stringify(schedSubrecord));
							var schedDetail = schedObj.schedule;
							nlapiSetLineItemValue('expense', 'custpage_oldexpblanket_cc', i,JSON.stringify(schedDetail));
							nlapiSetLineItemValue('expense', 'custpage_curexpblanket_cc', i,JSON.stringify(schedDetail));
						}
//						for (var j = 0; j < schedDetail.length; j++) {
//							errmsg = 'Sched[' + j + '] = ' + schedDetail[j].amount;
//							nlapiLogExecution('DEBUG', 'PBC potranBeforeLoad', errmsg);
//						}
					}
				} else {
                    // Update 2.97 : Make sure that on copy every line does not have a true line rollover processed checkbox
					nlapiSetLineItemValue('expense', 'custcol_line_rollover_processed_pbc', i, 'F');
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortsched_cc', i, '');
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortstart_cc', i, '');
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortend_cc', i,	'');
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortperiods_cc', i,	'');
					nlapiSetLineItemValue('expense', 'custpage_oldexpamortoffset_cc', i,	'');	
					// decided to comment this out and let the client side pageinit handle clearing this field. Copy case should be handled on client
//					if (recType != 'vendorbill' || companyId.indexOf('4678143') == -1) {				// Bitbucket #249 - CyberArk "lines have changed since loaded" error
//						nlapiSetLineItemValue('expense', 'custcol_ledgerlink_cc', i, 0);	// the ledger links are no longer valid on a copy, since the budget date may have changed		
//					}
				}
			}
		}
	
	}

}
	
	

/**
 * 
 * This event is needed to populate the applied to custom column fields on the sublists. This data must be picked up
 * during the record creation of either a PR->PO or PO->VB or VB->VC transition states. Otherwise, the applied to information is
 * not available on the after submit yet.
 * 
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 *                      
 * A blanket PO does NOT trigger the before load or submit events.
 *
 * @returns {Void}
 */
function potranEventBeforeSubmit(type){
// TESTING FOR HIDDEN FIELD ON ORDER REQ PROCESS
//	var errmsg = '';
//	var curRecord = nlapiGetNewRecord();		// load the new record into memory
//	for (var i = 1; i <= curRecord.getLineItemCount('expense'); i++ ) {
//		var prId = curRecord.getLineItemValue('expense', 'custcol_appliedprid_cc', i);
//		var amount =  curRecord.getLineItemValue('expense', 'custcol_appliedamount_cc', i);
//		errmsg = 'PO[' + i + '] expense applied to = ' + prId + 'amount = ' + amount;
//		nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
//	}
//
//
//	return;
	
	var currentContext = nlapiGetContext();
	var errmsg = 'Type = ' + type + ' context = ' + currentContext.getExecutionContext();
	var entityType = '';
	nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
	//User Event Script to Create custom button on Purchase Order Form
	var bcInstallFlag = currentContext.getSetting('SCRIPT', 'custscript_bcinstallflag_cc');	
	var csvImportFlag = currentContext.getSetting('SCRIPT', 'custscript_applycsvimport_cc');	
	if (currentContext.getExecutionContext() == 'scheduled' ) return;
//	if (currentContext.getExecutionContext() == 'csvimport' 
//		|| currentContext.getExecutionContext() == 'scheduled' ) return;
	if (bcInstallFlag == 'T' && (type != 'view' && type != 'print')) {
			//&& (type == 'create' || type == 'edit' || type == 'copy' || type == 'delete' || type == 'orderpurchreqs') 
			// && currentContext.getExecutionContext() == 'userinterface') {
		var featureConfig = nlapiLoadConfiguration('accountingpreferences');	
		var companyConfig = nlapiLoadConfiguration('companyinformation');
		var companyId = companyConfig.getFieldValue('companyid');
		var usePostingPeriod = currentContext.getSetting('SCRIPT', 'custscript_useperiod_cc');
		var oldRecord = nlapiGetOldRecord();
		var curRecord = nlapiGetNewRecord();		// load the new record into memory
		var recResults = null;
		var recId = nlapiGetRecordId();
		var recType = nlapiGetRecordType().toLowerCase();		// some of the forms will submit rectype in all caps.
		var appliedFields = {};
		var savedSearch = null;
		var segmentMapResults = getSegmentMapping();
//		var prIdArray = new Array();			// track all of the applied PRs on the new PO. The regular PO to VB transform logic won't work.
		var closeButtonFlag = true;
		var idArray = new Array();
		var minBudgetDate = '';
		var oldIgnoreFlag = 'T';
		
		if (oldRecord) {
			oldIgnoreFlag = oldRecord.getFieldValue('custbody_ignorebudchk_cc');
		}
		if (nlapiGetFieldValue('custbody_ignorebudchk_cc') == 'T' && oldIgnoreFlag == 'T') {
			nlapiLogExecution('AUDIT', 'PBC potranBeforeSubmit' ,'Both Old and New Ignore Budget Check field is turned on. No budget check will occur. ');
			return;
		}
		if (currentContext.getSessionObject('Calling Script') == 'Ignore Budget Check') {
			errmsg = 'The Ignore Budget Check session object is ON';
			nlapiLogExecution('AUDIT', 'PBC potranEventBeforeSubmit', errmsg);			
			return;		
		}
		
		if (recType == 'purchaseorder' || recType == 'purchaserequisition') {
			var itemCount = nlapiGetLineItemCount('item');
			nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', 'Item Line Count = ' + itemCount);
			for (var i = 1; i <= itemCount; i++) {
				var lineClosed;
				lineClosed = nlapiGetLineItemValue('item', 'isclosed', i);
				if (lineClosed != 'T')			// Bitbucket #307 - Reversed logic to allow for blank/null field value.
				{
					closeButtonFlag = false;
					break;
				}
			}
			var expenseCount = nlapiGetLineItemCount('expense');
			nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', 'Expense Line Count = ' + expenseCount);
			for (var i = 1; i <= expenseCount; i++) {
				var lineClosed;
				lineClosed = nlapiGetLineItemValue('expense', 'isclosed', i);
				if (lineClosed != 'T')			// Bitbucket #307 - Reversed logic to allow for blank/null field value.
				{
					closeButtonFlag = false;
					break;
				}
			}			
		} else if (recType == 'blanketpurchaseorder' && !isEmpty(oldRecord)) {
			// Bitbucket #322 - the following code "touches" the orderitems subrecord which seems to force the old record to become activated for this field in the aftersubmit.
			// This is weird behavior with the before submit forcing an update on the after submit.
			for (var i = 1; i <= oldRecord.getLineItemCount('item'); i++) {
				var temp = oldRecord.viewLineItemSubrecord('item', 'orderschedule', i);
			}
			for (var i = 1; i <= oldRecord.getLineItemCount('expense'); i++) {
				var temp = oldRecord.viewLineItemSubrecord('expense', 'orderschedule', i);
			}			
			closeButtonFlag = false;
			
		} else {
				closeButtonFlag = false;
		}
		
		if (type == 'delete' && recId == null) {
			recId = oldRecord.getRecordId();			// special case for list view delete, since the system will not load the current record.
			errmsg = 'Deleted record ID from old record = ' + recId;
			nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
		}

		// Bitbucket #210 - Added userevent condition. This should catch memorized transactions which have ledger links from the original. The links need updating
		// Bitbucket #227 - Flipped logic to exclude userinterface, but catch Payclip expense report.
//		if (csvImportFlag == 'T' && !closeButtonFlag && (currentContext.getExecutionContext() == 'csvimport' || currentContext.getExecutionContext() == 'userevent' || currentContext.getExecutionContext() == 'webservices')) {
		errmsg = 'Before budget check flags = ' + csvImportFlag + ' context = ' + currentContext.getExecutionContext() 
			+ ' closed button flag = ' + closeButtonFlag
			+ ' recType = ' + recType + ' company id = ' + companyId + ' new record = ' + curRecord + ' old record = ' + oldRecord;
		nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
		if (csvImportFlag == 'T' && !closeButtonFlag && nlapiGetFieldValue('custbody_ignorebudchk_cc') != 'T' && (currentContext.getExecutionContext() != 'userinterface')) { 
//				|| (recType == 'expensereport' && companyId.indexOf('5171029') != -1)) ) {
			if (isEmpty(nlapiGetFieldValue('custbody_budgetdate_cc'))) {
				calcBudgetDate(null, usePostingPeriod);
			}
			var resultString = checkTransOverBudget(curRecord, oldRecord,featureConfig);
			if (resultString != '') {
				resultString = 'Pyango Budgetary Control: Transaction over budget. ' + resultString;
				throw new nlobjError('PBC potranEventBeforeSubmit', resultString, true);		// true means to suppress email to be sent all admins.			
			}
		
		}
		
		// This checks for a PO being created by the batch order requisitions process. 
		// A regular PO will not have the custom column PR id filled in.
		// The PR id is set by the after submit event on the PR.
		if (type == 'create' && recType == 'purchaseorder' && nlapiGetFieldValue('custbody_ignorebudchk_cc') != 'T') {
//			var curRecord = nlapiGetNewRecord();		// load the new record into memory
			var prFound = false;
			for (var i = 1; i <= curRecord.getLineItemCount('item'); i++ ) {
				var prId = curRecord.getLineItemValue('item', 'custcol_appliedprid_cc', i);
				errmsg = 'PO[' + i + '] item applied to = ' + prId + ' built in = ' + curRecord.getLineItemValue('item', 'linkedorder', i);
				nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
				if (!isEmpty(prId)) {
					prFound = true;
					break;
//					prIdArray.push(prId);
				}
			}
			if (featureConfig.getFieldValue('poexpenses') == 'T') {
				for (var i = 1; i <= curRecord.getLineItemCount('expense'); i++ ) {
					var prId = curRecord.getLineItemValue('expense', 'custcol_appliedprid_cc', i);
					errmsg = 'PO[' + i + '] expense applied to = ' + prId + ' built in = ' + curRecord.getLineItemValue('expense', 'linkedorder', i);
					nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
					if (!isEmpty(prId)) {
						prFound = true;
						break;
//						prIdArray.push(prId);
					}
				}
			}
			if (prFound) {
				var resultString = checkTransOverBudget(curRecord, null,featureConfig);
				if (resultString != '') {
					resultString = 'Pyango Budgetary Control: New PO over budget. ' + resultString;
					throw new nlobjError('PBC potranEventBeforeSubmit', resultString, true);		// true means to suppress email to be sent all admins.			
				}
			}
		}
		
		
		errmsg = 'Search for record type = ' + recType + ' cur id = ' + recId; 
		nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);

		if (recId) {					// recid will be null for a brand new record.
			// Bitbucket #163 - The standard search will return the rate and the amount in the consolidated/home currency rates. It applies the exchange
			// rate between the consolidated sub and the transaction currency. NOT the base currency of the sub. 
			// From the help field: Per-Account - Uses the general rate type selected for each transactionï¿½s account, either average, current, or historical. 
			// When this option is selected, different rate types may be used within each set of search results. This option is the default.
			// By using a saved search with the Currency Rate Type set to NONE, then it will use the exchange rate on the transaction back to the base currency. 

						
			if (currentContext.getFeature('multicurrency') == true && currentContext.getSetting('SCRIPT', 'custscript_bconeworldflag_cc') == 'T') {
				savedSearch = 'customsearch_multicurtran_pbc';
			}
			var recFilter = new Array();
			recFilter[0] = new nlobjSearchFilter( 'internalid', null, 'is', recId );
			recFilter[1] = new nlobjSearchFilter( 'taxline', null, 'is', 'F' );			// 1-20-20 Need to ignore tax lines for budget impacts. 
			var recColumn = new Array();
			recColumn.push(new nlobjSearchColumn( 'line' ).setSort());		// sort by line number
			recColumn.push(new nlobjSearchColumn( 'appliedtotransaction'));
//			recColumn.push(new nlobjSearchColumn( 'custbody_budgetdate_cc', 'appliedtotransaction'));
			recColumn.push(new nlobjSearchColumn( 'linesequencenumber', 'appliedtotransaction'));
			recColumn.push(new nlobjSearchColumn( 'line', 'appliedtotransaction' ));
			recColumn.push(new nlobjSearchColumn( 'amount', 'appliedtotransaction'));
			// Bitbucket #248 - Added estimated amount to search
			if (currentContext.getFeature('requisitions') == true) {
				recColumn.push(new nlobjSearchColumn( 'estimatedamount' ));
				recColumn.push(new nlobjSearchColumn( 'estimatedamount', 'appliedtotransaction' ));
			}
			recColumn.push(new nlobjSearchColumn( 'rate', 'appliedtotransaction'));
			recColumn.push(new nlobjSearchColumn( 'quantity', 'appliedtotransaction'));
			if (currentContext.getFeature('multicurrency') == true)
				recColumn.push(new nlobjSearchColumn( 'fxamount', 'appliedtotransaction'));
			recColumn.push(new nlobjSearchColumn( 'exchangerate', 'appliedtotransaction'));
			recColumn.push(new nlobjSearchColumn( 'custcol_poamortid_pbc', 'appliedtotransaction'));
			recColumn.push(new nlobjSearchColumn( 'custcol_poamortstart_pbc', 'appliedtotransaction'));
			recColumn.push(new nlobjSearchColumn( 'custcol_poamortend_pbc', 'appliedtotransaction'));
			recColumn.push(new nlobjSearchColumn( 'item' ));
			errmsg = 'Trans line search columns: ';
			for (var i = 0; i < segmentMapResults.length; i++) {
				var result = segmentMapResults[i];
				var colValueFieldName = result.getValue('custrecord_columnname_pbc');
				var unifiedFlag = result.getValue('custrecord_unifiedsegid_pbc');
				if (colValueFieldName == 'customer')	// the search column is entity
					recColumn.push(new nlobjSearchColumn( 'entity', 'appliedtotransaction'));
				else if (unifiedFlag == 'T') {
					recColumn.push(new nlobjSearchColumn( 'line.' + colValueFieldName, 'appliedtotransaction'));			// line level custom segment
				} else {
					recColumn.push(new nlobjSearchColumn( colValueFieldName, 'appliedtotransaction'));
				}
				errmsg += ' [' + i+ '] = ' + colValueFieldName;
			}
			nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
//			recColumn.push(new nlobjSearchColumn( 'custbody_projectid_cc', 'appliedtotransaction' ));
//			recColumn[0].setSort();				// sort by line number

			// execute the search, passing all filters and return columns
			recResults = nlapiSearchRecord( recType, savedSearch, recFilter, recColumn );
	
			if (recResults) {
				var appliedRectype = '';
				var appliedResults = null;
				// When a PR gets submitted for approval, it appears that the record type is changed to caps.
				switch (recType.toLowerCase()) {
				case 'purchaseorder':
					appliedRectype = 'purchaserequisition';
					break;
				case 'vendorbill':
					appliedRectype = 'purchaseorder';
					break;
				case 'vendorcredit':
					appliedRectype = 'vendorbill';
					break;
				default	:
					errmsg = 'Record Type Does Not Have an Applied Transaction ' + recType;
					nlapiLogExecution('AUDIT', 'PBC potranEventBeforeSubmit', errmsg);
					return;
				}
				// for performance reasons, can't do a look up to the applied transaction header values for every line item row. So need to
				// build an array list of all applied internal IDs for different transactions. Then the single search will do a logical OR
				// for internal IDs. The search filter can have duplicate values within the array, so don't need to have unique checks.
				// This extra search is needed since the header level values are not exposed on the joined lines. For example, if the PR has a
				// department blank, the PO applied to results will be blank. So searching for the PR's header info gets the effective department for that line.
				for (var k = 1; recResults != null && k < recResults.length; k++) {		
					var recResult = recResults[k];
					if (recResult.getValue('appliedtotransaction') != null && recResult.getValue('appliedtotransaction') != '')
						idArray.push(recResult.getValue('appliedtotransaction'));
//					errmsg = 'Rec results [' + k + '] = ' + recResult.getValue('appliedtotransaction') 
//						+ ' account = ' + recResult.getValue('account', 'appliedtotransaction')
//						+ ' dept = ' + recResult.getValue('department', 'appliedtotransaction');
//					nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
				}
				if (idArray.length > 0 ) {
						var filter = new Array();
						filter.push(new nlobjSearchFilter('internalid', null, 'anyof', idArray));
						filter.push(new nlobjSearchFilter( 'mainline', null, 'is', 'T' ));			// only need the header row from the search
						var column = new Array();
						errmsg = 'Applied search for header values columns: ';
						// Note - for unified segment ID, just the segment internal ID is needed for header
						for (var i = 0; i < segmentMapResults.length; i++) {
							var result = segmentMapResults[i];
							var colValueFieldName = result.getValue('custrecord_columnname_pbc');
							if (colValueFieldName != 'customer')	
								column.push(new nlobjSearchColumn( colValueFieldName) );
							errmsg += ' [' + i+ '] = ' + colValueFieldName;
						}
						nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
						column.push(new nlobjSearchColumn( 'custbody_budgetdate_cc'));
						column.push(new nlobjSearchColumn( 'custbody_projectid_cc' ));
						appliedResults = nlapiSearchRecord( appliedRectype, null, filter, column);			
						
				}
				for (var k = 1; recResults != null && appliedResults != null && k < recResults.length; k++) {			
					var recResult = recResults[k];
					var resLineType;
					var matchFound = false;
					var amount = 0.0;
					// search results amount is always in the home currency. The fxamount is the base currency of the sub. Need to use this
					// since the budget amount is in the base currency.
					// Bitbucket #248 - Need to use estimated amount instead of fxamount for PR
					if (appliedRectype == 'purchaserequisition') {
						// Bitbucket #290 - removed absolute value function
						amount = parseFloat(recResult.getValue('estimatedamount', 'appliedtotransaction'));
					} else if (currentContext.getFeature('multicurrency') == true) {
						// Bitbucket #290 - removed absolute value function
						amount = parseFloat(recResult.getValue('fxamount', 'appliedtotransaction'))
							* Math.abs(parseFloat(recResult.getValue('exchangerate', 'appliedtotransaction')));
					} else {
						// Bitbucket #290 - removed absolute value function
						amount = parseFloat(recResult.getValue('amount', 'appliedtotransaction'));
					}
					if (isNaN(amount))
						amount = 0.0;			
					if (recResult.getValue('item'))		// for some weird reason expense categories are filled in even for items.
						resLineType = 'item';
					else resLineType = 'expense';
					if (!isEmpty(recResult.getValue('appliedtotransaction'))) {
						for (var i = 0; i < appliedResults.length; i++) {
							appliedResult = appliedResults[i];
							// loop through the applied results to get the right transaction for the header values
							var segmentJSON = {};
							if (appliedResult.getId() == recResult.getValue('appliedtotransaction')) {
								var appliedBudgetDate = appliedResult.getValue('custbody_budgetdate_cc');
								if (!isEmpty(appliedBudgetDate)) {
									if (isEmpty(minBudgetDate)) {			// first time through the loop
										minBudgetDate = appliedBudgetDate;
									} else if (nlapiStringToDate(appliedBudgetDate) < nlapiStringToDate(minBudgetDate)) {
										minBudgetDate = appliedBudgetDate;		// new minimum										
									}
								}
								errmsg = 'EFFECTIVE applied: budget date = ' + appliedBudgetDate + ' min budget date = ' + minBudgetDate;
								for (var m = 0; m < segmentMapResults.length; m++) {
									var result = segmentMapResults[m];
									var name = result.getValue('name');
									var nameText = result.getValue('name') + 'Text';
									var colValueFieldName = result.getValue('custrecord_columnname_pbc');
									var colTextFieldName = result.getValue('custrecord_columnname_pbc') + 'Text';
									var effSegmentText = '';
									var effSegment = null;
									// must hardcode for custom project field. This is a tran boday field and only shows up on mainline
									var unifiedFlag = result.getValue('custrecord_unifiedsegid_pbc');
									if (colValueFieldName == 'customer') {
										effSegment = recResult.getValue('entity', 'appliedtotransaction');
										effSegmentText = recResult.getText('entity', 'appliedtotransaction');
										if (effSegment == null) {
											effSegment = appliedResult.getValue('custbody_projectid_cc');			
											effSegmentText = appliedResult.getText('custbody_projectid_cc');												
										}										
									} else {
										if (unifiedFlag == 'T') {			// get line level first
											effSegment = recResult.getValue('line.' + colValueFieldName, 'appliedtotransaction');
											effSegmentText = recResult.getText('line.' + colValueFieldName, 'appliedtotransaction');											
										} else {
											effSegment = recResult.getValue(colValueFieldName, 'appliedtotransaction');
											effSegmentText = recResult.getText(colValueFieldName, 'appliedtotransaction');
										}
										if (effSegment == null) {		// then use header level from the applied transaction
											effSegment = appliedResult.getValue(colValueFieldName);
											effSegmentText = appliedResult.getText(colValueFieldName);
										}											
									}								
									if (effSegment == '') effSegment = null;		
									errmsg += ' [' + colValueFieldName + '] = ' + effSegment;
									segmentJSON[colValueFieldName] = effSegment;
									segmentJSON[colTextFieldName] = effSegmentText;
								}
								nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
								segmentJSON.quantity = recResult.getValue('quantity', 'appliedtotransaction');
								segmentJSON.rate = recResult.getValue('rate', 'appliedtotransaction');
								if (resLineType == 'expense') {
									segmentJSON.rate = amount;
									segmentJSON.quantity = 1;
								} 
								segmentJSON.budgetDate = appliedBudgetDate;
								segmentJSON.amortSched = recResult.getValue( 'custcol_poamortid_pbc', 'appliedtotransaction');
								segmentJSON.amortStart = recResult.getValue( 'custcol_poamortstart_pbc', 'appliedtotransaction');
								segmentJSON.amortEnd = recResult.getValue( 'custcol_poamortend_pbc', 'appliedtotransaction');
								var segmentString = JSON.stringify(segmentJSON);

								for (var j = 1; oldRecord && !matchFound && j <= oldRecord.getLineItemCount(resLineType); j++) {
									if (recResult.getValue('line') == oldRecord.getLineItemValue(resLineType, 'line', j)) {

										matchFound = true;
										oldRecord.setLineItemValue(resLineType, 'custcol_appliedtranid_cc', j, recResult.getValue('appliedtotransaction'));
										oldRecord.setLineItemValue(resLineType, 'custcol_appliedamount_cc', j, amount);
										oldRecord.setLineItemValue(resLineType, 'custcol_appliedfxamount_cc', j, recResult.getValue('fxamount', 'appliedtotransaction'));
										oldRecord.setLineItemValue(resLineType, 'custcol_appliedlineid_cc', j, recResult.getValue('line', 'appliedtotransaction'));
										oldRecord.setLineItemValue(resLineType, 'custcol_appliedsegments_cc', j, segmentString);
										
										errmsg = 'OLD Record Match ' + resLineType + ' comparison [' + k + '] sub list line id = ' + oldRecord.getLineItemValue(resLineType, 'line', j)
											+ ' results line = ' + recResult.getValue('line')
											+ ' segments = ' + segmentString
											+ ' amount = ' + recResult.getValue('amount', 'appliedtotransaction') + ' calc amount = ' + amount;
										nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
									}
								}
								matchFound = false;
								for (var j = 1; !matchFound && j <= nlapiGetLineItemCount(resLineType); j++) {
									if (recResult.getValue('line') == nlapiGetLineItemValue(resLineType, 'line', j)) {
										matchFound = true;
										// for some reason, the employee center has a current line item account value = null for the expense sublist. This occurred at DC Bar customer
										// So if the account is null, this will result in a netsuite error. So the current record cannot be updated in the before submit event.
										// The account field does not exist for items, so there should be no problem in updating the applied information. 
										if (resLineType == 'item' || 
												(nlapiGetLineItemValue(resLineType, 'account', j) != null && nlapiGetLineItemValue(resLineType, 'account', j) != '')) {
											nlapiSetLineItemValue(resLineType, 'custcol_appliedtranid_cc', j, recResult.getValue('appliedtotransaction'));
											nlapiSetLineItemValue(resLineType, 'custcol_appliedamount_cc', j, amount);
											nlapiSetLineItemValue(resLineType, 'custcol_appliedfxamount_cc', j, recResult.getValue('fxamount', 'appliedtotransaction'));
											nlapiSetLineItemValue(resLineType, 'custcol_appliedlineid_cc', j, recResult.getValue('line', 'appliedtotransaction'));
											nlapiSetLineItemValue(resLineType, 'custcol_appliedsegments_cc', j, segmentString);
											errmsg = 'NEW Record match Line comparison [' + k + '] sub list line id = ' + nlapiGetLineItemValue(resLineType, 'line', j)
												+ ' results line = ' + recResult.getValue('line')
												+ ' segments = ' + nlapiGetLineItemValue(resLineType, 'custcol_appliedsegments_cc', j)
												+ ' amount = ' + recResult.getValue('amount', 'appliedtotransaction') + ' calc amount = ' + amount;
											nlapiLogExecution('DEBUG', 'PBC potranEventBeforeSubmit', errmsg);
										}
									}

								}
							
								break;
							}			// end applied record match if check
							
						}					// end applied results for loop
					}						// end rec result null if check

				}				// end rec results for loop
			}					// end recresults null if check
		}						// end recid null if check
		// do one more check to make sure that budget date is filled in.
		// Bitbucket #211 - Use the minimum date of the applied transactions.
		if (isEmpty(nlapiGetFieldValue('custbody_budgetdate_cc')) && !isEmpty(nlapiGetFieldValue('trandate')))  {			// multiple applied transactions
			if ((idArray.length > 1)) {
				nlapiSetFieldValue('custbody_budgetdate_cc', minBudgetDate);			
			} else {
				nlapiSetFieldValue('custbody_budgetdate_cc', calcBudgetDate(null, usePostingPeriod));		// Bitbucket #245
			}
		}
/*					
					errmsg = 'Type = ' + type + ' Record ' + sublistType + '[' + j + '] = ' + oldRecord.getLineItemValue(sublistType, 'line', j) 
					+ ' category = '+ oldRecord.getLineItemValue(sublistType, 'category', j) + ' closed = ' + oldRecord.getLineItemValue(sublistType, 'isclosed', j)
					+ ' class = ' + oldRecord.getLineItemValue(sublistType, 'class', j) + ' dept = ' + oldRecord.getLineItemValue(sublistType, 'department', j) 
					+ ' location = ' + oldRecord.getLineItemValue(sublistType, 'location', j) + ' project = ' + oldRecord.getLineItemValue(sublistType, 'customer', j)
					+ ' account = ' + oldRecord.getLineItemValue(sublistType, 'account', j) 
					+ ' amount = ' + oldRecord.getLineItemValue(sublistType, 'amount', j) + ' quantity = ' + oldRecord.getLineItemValue(sublistType, 'quantity', j) + ' rate = ' + oldRecord.getLineItemValue(sublistType, 'rate', j)
					+ ' applied tran id = ' + oldRecord.getLineItemValue(sublistType, 'custcol_appliedtranid_cc', j);
			
*/					


	}							// end install flag if check
	
	return true; 
 
}								// end before submit function
/*
 * This function calculates the ledger amount balance for each of the buckets.
 */
function calcLedgerAmount(ponum, poline, journalType) {
	var errmsg = 'PO = ' + ponum + ' line = ' + poline + ' journalType = ' + journalType;
	nlapiLogExecution('DEBUG', 'calcLedgerAmount Function ', errmsg);
	var blfilter = new Array();
	blfilter[0] = new nlobjSearchFilter( 'custrecord_blpoid_cc', null, 'is', ponum );
	blfilter[1] = new nlobjSearchFilter( 'custrecord_blpoline_cc', null, 'is', poline);
	blfilter[2] = new nlobjSearchFilter( 'custrecord_bljournaltype_cc', null, 'anyof', journalType );
	// return old ledger amount
	var blcolumn = new Array();
	blcolumn[0] = new nlobjSearchColumn( 'custrecord_blamount_cc' );
				
	// execute the search, passing all filters and return columns
	var blresults = nlapiSearchRecord( 'customrecord_budgetliquid_cc', null, blfilter, blcolumn );
	if (blresults) {		// search found an existing record
		var blresult = blresults[0];
		var errmsg = 'Liquidation amount ' + blresult.getValue('custrecord_blamount_cc');
		nlapiLogExecution('DEBUG', 'calcLedgerAmount Function ', errmsg);
		return (parseFloat(blresult.getValue('custrecord_blamount_cc')));
	}
	return 0;
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 * 
 * Possible Purchase Order Approval Status field values = 
 * 		Pending Supervisor Approval
 * 		Pending Receipt
 * 		Rejected by Supervisor
 * 		Partially Received
 * 		Pending Bill / Partially Received
 * 		Pending Bill
 * 		Fully Billed
 * 		Closed
 * 
 * Possible PO Status field values =
 * 		Rejected
 * 		Pending Approval
 * 		Approved
 * 		Approved by Supervisor/Pending Receipt
 * 
 * Possible Vendor Bill Status field values = 
 * 		Open
 * 		Paid In Full
 * 		Cancelled
 * 		Pending Approval
 *		Rejected
 *
 */
function potranEventAfterSubmit(type){
	var errmsg = '';
	nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', 'status = ' + type);
	var currentContext = nlapiGetContext();
	// var featureConfig = nlapiLoadConfiguration('companyfeatures');
	var bcInstallFlag = currentContext.getSetting('SCRIPT', 'custscript_bcinstallflag_cc');	
	if (bcInstallFlag == 'T' && (type != 'view' && type != 'print')) {

		//	(type == 'edit' || type == 'create' || type == 'delete' || type == 'reject' || type == 'approve' || type == 'orderpurchreqs' || type == 'orderitems')) {
		var recId = nlapiGetRecordId();
		var rectype = nlapiGetRecordType().toLowerCase();		// some of the forms will submit rectype in all caps.
		var usePostingPeriod = currentContext.getSetting('SCRIPT', 'custscript_useperiod_cc');
		var featureConfig = nlapiLoadConfiguration('accountingpreferences');
		var companyConfig = nlapiLoadConfiguration('companyinformation');
		var companyId = companyConfig.getFieldValue('companyid');
		var curRecord = null;
		var oldRecord = nlapiGetOldRecord();
		var subList = new Array();
		// var bperiod = nlapiGetFieldValue('custbody_budgetperiod_cc');
		var budgetDate = nlapiGetFieldValue('custbody_budgetdate_cc');
		var tranDate = nlapiGetFieldValue('trandate');
		var tranId = nlapiGetFieldValue('tranid');
		var subsidiary = null;
		var hdrCreatedFrom = null;
		var hdrDateCreated = null;
		var hdrDateModified = null;
		var lineOneCreatedFrom = null;			// used on PO created from PR
		var useCustomSublistFlag = true;
		var subListString = '';
		var maxLine = 0;
		var bigSubListLength = parseInt(currentContext.getSetting('SCRIPT', 'custscript_bigsublist_cc'));			// assume this is the maximum number of lines that can be processed in the user event.
		var vbEncumbrance = currentContext.getSetting('SCRIPT', 'custscript_vbenc_cc');					// Bitbucket #157 - Check to see if unapproved --> encumbrance
		var poNum = null;
		var invoiceID = null;
		var oldStatus = nlapiGetFieldValue('status');	
		var oldStatusValue = '';
		var approvalStatus = '';
		var approvalValue = '';
		var oldApprovalStatus = '';
		var oldApprovalValue = '';
		var srchResultStatus = null;
		var srchStatusValue = null;
		var savedSearch = null;
		var calcStatusValue = '';
		var recResults = new Array();
		var recFilter = new Array();
		var params = new Array();
		var amortSchedField = 'amortizationsched';
		var amortStartField = 'amortizstartdate';
		var amortEndField = 'amortizationenddate';
		
		if (isNaN(bigSubListLength))			// handle the case for a blank script parameter
			bigSubListLength = 10;				// this is the original threshold. 
		
		var oldIgnoreFlag = 'T';
		
		if (oldRecord) {
			oldIgnoreFlag = oldRecord.getFieldValue('custbody_ignorebudchk_cc');
		} else {
			oldIgnoreFlag = 'F';
		}
		if (nlapiGetFieldValue('custbody_ignorebudchk_cc') == 'T' && oldIgnoreFlag == 'T') {
			nlapiLogExecution('AUDIT', 'PBC Transaction After Submit' ,'Both Old and New Ignore Budget Check field is turned on. No budget check will occur. ');
			return;
		}
		if (currentContext.getSessionObject('Calling Script') == 'Ignore Budget Check') {
			errmsg = 'The Ignore Budget Check session object is ON';
			nlapiLogExecution('AUDIT', 'PBC Transaction After Submit', errmsg);			
			return;		
		}
		
		if (type != 'delete') {
			// a vendor bill can be canceled when it is in Pending Approval status. Once canceled, it can not be editted again. 
			// Treat this the same as a deleted VB. The load record will fail since the record can not be editted. So the 
			// catch block will log the error and update the type parameter.
			try {
				curRecord = nlapiLoadRecord(rectype, recId);
		    } catch (e) {
		    	errmsg = e.getCode() + '\n' + e.getDetails();
				nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);		
				curRecord = null;
				type = 'delete';
		    }			
			if (rectype == 'purchaserequisition') {
				// Need to update the custom transaction column so that the Order Requisitions process can detect which PR is applied to. 
				// Doing a submit of the current record does not appear to refire the user event scripts in a circular manner. 
				errmsg = 'PR create or edit - need to force saving of the transaction ID to columns = ' + recId;
				nlapiLogExecution('AUDIT', 'PBC Transaction After Submit', errmsg);		
	//			currentContext.setSessionObject('Calling Script','Ignore Budget Check');
				try {
					// copy the record ID to the lines so that the PR to PO transformation can pick up the PR ID. 
					// also save the estimated amount from the PR. This will become the applied amount to calculate the delta.
					// This will trigger a budget check on the PO save in the user event.
					for (var i = 1; i <= curRecord.getLineItemCount('item'); i++ ) {
						curRecord.setLineItemValue('item', 'custcol_appliedprid_cc', i, recId);
						curRecord.setLineItemValue('item', 'custcol_appliedamount_cc', i, 
								curRecord.getLineItemValue('item', 'estimatedamount', i));
					}
					if (featureConfig.getFieldValue('poexpenses') == 'T') {
						for (var i = 1; i <= curRecord.getLineItemCount('expense'); i++ ) {
							curRecord.setLineItemValue('expense', 'custcol_appliedprid_cc', i, recId);
							curRecord.setLineItemValue('expense', 'custcol_appliedamount_cc', i,
								curRecord.getLineItemValue('expense', 'estimatedamount', i));
						}			
					}
	//				curRecord.setFieldValue('memo', 'Test PR resubmit entire');
					nlapiSubmitRecord(curRecord);
	//				nlapiSubmitField('purchaserequisition', recId, 'memo', 'Test PR resubmit');
			    } catch (e) {
			    	errmsg = e.getCode() + '\n' + e.getDetails();
					nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);		
					return;
				}			
			}
		} else if (oldIgnoreFlag == 'T') {
			nlapiLogExecution('AUDIT', 'PBC potranBeforeSubmit' ,'Deleting a transaction with the Ignore Budget Check field is turned on. No budget check will occur. ');
			return;			
		}
		
		if (isEmpty(budgetDate)) {
			if (oldRecord) {
				budgetDate = oldRecord.getFieldValue('custbody_budgetdate_cc');
				if (isEmpty(budgetDate)) {
					budgetDate = calcBudgetDate(oldRecord, usePostingPeriod);			// Bitbucket #245
				}
			} else { 
				budgetDate = curRecord.getFieldValue('custbody_budgetdate_cc');
				if (isEmpty(budgetDate)) {
					budgetDate = calcBudgetDate(curRecord, usePostingPeriod);
				}
			}
			nlapiSubmitField(rectype, recId, 'custbody_budgetdate_cc', budgetDate, false);		// Bitbucket # 286 - Handle non-user interface updates to the transaction. 
		}

		var budgets = new BudgetLedger(budgetDate);
		if (budgets.searchBudgetDefn() == false)	{		// no budgets found
			errmsg = 'NO budget definitions could be found! Budget date = ' + budgetDate;
			nlapiLogExecution('AUDIT', 'PBC Transaction After Submit', errmsg);			
			return false;
		}

		// Bitbucket #146 - Update the amortization fields for the search
		if ((recType = 'purchaseorder' || recType == 'purchaserequisition')) {	
			amortSchedField = 'custcol_poamortid_pbc';
			amortStartField = 'custcol_poamortstart_pbc';
			amortEndField = 'custcol_poamortend_pbc';
		}

		
		// Bitbucket #163 - The standard search will return the rate and the amount in the consolidated/home currency rates. It applies the exchange
		// rate between the consolidated sub and the transaction currency. NOT the base currency of the sub. 
		// From the help field: Per-Account - Uses the general rate type selected for each transactionï¿½s account, either average, current, or historical. 
		// When this option is selected, different rate types may be used within each set of search results. This option is the default.
		// By using a saved search with the Currency Rate Type set to NONE, then it will use the exchange rate on the transaction back to the base currency. 
		if (currentContext.getFeature('multicurrency') == true && currentContext.getSetting('SCRIPT', 'custscript_bconeworldflag_cc') == 'T') {
			savedSearch = 'customsearch_multicurtran_pbc';
		}
		recFilter[0] = new nlobjSearchFilter( 'internalid', null, 'is', recId );
		recFilter[1] = new nlobjSearchFilter( 'taxline', null, 'is', 'F' );			// 1-20-20 Need to ignore tax lines for budget impacts. 
		// return the approval status
		var recColumns = new Array();
		recColumns.push(new nlobjSearchColumn( 'approvalstatus' ));
		recColumns.push(new nlobjSearchColumn( 'status' ));
		recColumns.push(new nlobjSearchColumn( 'tranid' ));
		recColumns.push(new nlobjSearchColumn( 'line' ));
		recColumns.push(new nlobjSearchColumn( 'linesequencenumber' ));
		recColumns.push(new nlobjSearchColumn( 'amount' ));
		recColumns.push(new nlobjSearchColumn( 'quantity' ));			// Bitbucket #342 - need to get additional quantity and rate fields
		recColumns.push(new nlobjSearchColumn( 'rate' ));
		recColumns.push(new nlobjSearchColumn( 'quantitybilled' ));
		if (currentContext.getFeature('requisitions') == true) {
			recColumns.push(new nlobjSearchColumn( 'estimatedamount' ));
			recColumns.push(new nlobjSearchColumn( 'estimatedamount', 'appliedtotransaction' ));
		}
		if (currentContext.getFeature('multicurrency') == true) {
			recColumns.push(new nlobjSearchColumn( 'fxamount' ));			// foreign amount
			recColumns.push(new nlobjSearchColumn( 'fxamount', 'appliedtotransaction'));				// foreign amount
			recColumns.push(new nlobjSearchColumn( 'exchangerate', 'appliedtotransaction' ));
			recColumns.push(new nlobjSearchColumn( 'currency' ));	
			recColumns.push(new nlobjSearchColumn( 'currency', 'appliedtotransaction'));
			if (currentContext.getSetting('SCRIPT', 'custscript_bconeworldflag_cc') == 'T') {			// Bitbucket #234 - Save sub currency for PR exchange rate calculation
				recColumns.push(new nlobjSearchColumn( 'currency', 'subsidiary' ));
			} 
			// these columns are listed in the record browser, but don't seem to be valid.
//			recColumns.push(new nlobjSearchColumn( 'fxcostestimate' ));			// estimated line cost FX
//			recColumns.push(new nlobjSearchColumn( 'fxcostestimaterate' ));			// estimated unit cost FX
//			recColumns.push(new nlobjSearchColumn( 'fxtrancostestimate' ));			// est extended cost transaction FX
		}
		recColumns.push(new nlobjSearchColumn( 'exchangerate' ));
		for (var i = 0; i < budgets.segmentMapResults.length; i++) {
			var result = budgets.segmentMapResults[i];
			var colValueFieldName = result.getValue('custrecord_columnname_pbc');
			var unifiedFlag = result.getValue('custrecord_unifiedsegid_pbc');
			if (unifiedFlag == 'T') {			// do extra push for unified segment internal id at the line level.
				recColumns.push(new nlobjSearchColumn( 'line.' + colValueFieldName ));				
				recColumns.push(new nlobjSearchColumn( 'line.' + colValueFieldName, 'appliedtotransaction' ));				
			}
			if (colValueFieldName == 'customer') {
				recColumns.push(new nlobjSearchColumn( 'entity' ));
				recColumns.push(new nlobjSearchColumn( 'entity', 'appliedtotransaction' ));
			} else {
				recColumns.push(new nlobjSearchColumn( colValueFieldName ));				
				recColumns.push(new nlobjSearchColumn( colValueFieldName, 'appliedtotransaction' ));				
			}
		}
		recColumns.push(new nlobjSearchColumn( 'custbody_projectid_cc' ));
		recColumns.push(new nlobjSearchColumn( 'item' ));
		if (currentContext.getFeature('expreports') == true)
			recColumns.push(new nlobjSearchColumn( 'expensecategory' ));
		recColumns.push(new nlobjSearchColumn( 'createdfrom' ));
		recColumns.push(new nlobjSearchColumn( 'datecreated' ));
		recColumns.push(new nlobjSearchColumn( 'closed' ));
		recColumns.push(new nlobjSearchColumn( 'lastmodifieddate'));
		recColumns.push(new nlobjSearchColumn( 'custcol_accttype_cc'));
		recColumns.push(new nlobjSearchColumn( 'appliedtotransaction'));
		recColumns.push(new nlobjSearchColumn( 'applyingtransaction'));								// Bitbucket #342
		recColumns.push(new nlobjSearchColumn( 'recordtype', 'applyingtransaction'));				// Bitbucket #342
		recColumns.push(new nlobjSearchColumn( 'recordtype', 'appliedtotransaction'));				// Bitbucket #329
		recColumns.push(new nlobjSearchColumn( 'linesequencenumber', 'appliedtotransaction'));
		recColumns.push(new nlobjSearchColumn( 'line', 'appliedtotransaction'));
		recColumns.push(new nlobjSearchColumn( 'amount', 'appliedtotransaction'));
		recColumns.push(new nlobjSearchColumn( 'exchangerate', 'appliedtotransaction'));
		recColumns.push(new nlobjSearchColumn( 'rate', 'appliedtotransaction'));
		recColumns.push(new nlobjSearchColumn( 'quantity', 'appliedtotransaction'));
		recColumns.push(new nlobjSearchColumn( 'custbody_projectid_cc', 'appliedtotransaction' ));
		recColumns.push(new nlobjSearchColumn( 'custbody_budgetdate_cc', 'appliedtotransaction' ));
		// Bitbucket #146 - The applied to will either be PO or PR, so need to use the custom fields. But the current record type could be VB (no join)
		recColumns.push(new nlobjSearchColumn( 'custcol_poamortid_pbc', 'appliedtotransaction' ));
		recColumns.push(new nlobjSearchColumn( 'custcol_poamortstart_pbc', 'appliedtotransaction' ));
		recColumns.push(new nlobjSearchColumn( 'custcol_poamortend_pbc', 'appliedtotransaction' ));
		recColumns.push(new nlobjSearchColumn( 'custbody_ignoreamortsched_cc', 'appliedtotransaction' ));
		recColumns.push(new nlobjSearchColumn( amortSchedField ));
		recColumns.push(new nlobjSearchColumn( amortStartField ));
		recColumns.push(new nlobjSearchColumn( amortEndField ));
		// Bitbucket #193 - check for special ignore flag
		recColumns.push(new nlobjSearchColumn( 'custbody_ignoreamortsched_cc' ));
		
		// execute the search, passing all filters and return columns
		recResults = nlapiSearchRecord( rectype, savedSearch, recFilter, recColumns );
		if (recResults) {		// search found the current record. Save values from the header record.
			var recResult = recResults[0];

			// Special check for CyberArk Allocadia and Expensify integration. This integration populates estimated amount and BAG in the aftersubmit event.  
			// Cyberark has custom expense script which switches departments from the employee department to the actual department in after submit 
			// Therefore this data is not available to PyanGo user event. So we will make an explicit call to the PBC Batch Posting script to off load processing.
			
			if ((rectype == 'purchaserequisition' || rectype == 'expensereport') && type == 'create' && currentContext.getExecutionContext() == 'webservices' && companyId.indexOf('4678143') != -1 ) {
				var params = new Array();					// list of actual parameters to send to scheduled script.
				params['custscript_translist_pbc'] = recId;
				params['custscript_approvalstatus_pbc'] = '';
				params['custscript_savedsearch_pbc'] = '';
				
				var resubmitCtr = 0;
				var status = nlapiScheduleScript('customscript_batchledgerpost_pbc', null, params);
				errmsg = 'Batch Posting Scheduled Status = ' + status ;
				nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
				// go to sleep for 3 seconds and resubmit
				while (status == null) {
					var date = new Date();
					var curDate = null;
					do { 
						  curDate = new Date(); 
					}	  while(curDate - date < 3000);
					var status = nlapiScheduleScript('customscript_batchledgerpost_pbc', null, params);
					errmsg = 'Null return code from Schedule Script. Waiting for scheduled script queues = ' + resubmitCtr + ' new status = ' + status;
					nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
					resubmitCtr++;		
				}
				errmsg = 'Final Scheduled Status = ' + status + ' End function governance = ' + currentContext.getRemainingUsage();
				nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
				return;
			}

			
			approvalStatus = recResult.getText('approvalstatus');
			approvalValue = recResult.getValue('approvalstatus') ? recResult.getValue('approvalstatus') : '';
			hdrCreatedFrom = recResult.getValue('createdfrom');
			hdrDateCreated = recResult.getValue('datecreated' );
			hdrDateModified = recResult.getValue('lastmodifieddate' );
			recResult = recResults[1];		// assume there will always be at least one line item
			lineOneCreatedFrom = recResult.getValue('createdfrom'); 
			errmsg = 'SEARCH HEADER created from = ' + hdrCreatedFrom + ' search results length = ' + recResults.length;
			nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
			// Bitbcket #211 - for a brand new VB or PO need to calculate the minimum budget date from the set of applied transactions
			if (type == 'create' && !isEmpty(lineOneCreatedFrom) && (rectype == 'vendorbill' || rectype == 'purchaseorder')){
				var minBudgetDate = '';
//				var count = 0;
				for (var k = 1; k < recResults.length; k++) {		
					var recResult = recResults[k];
					var appliedBudgetDate = recResult.getValue('custbody_budgetdate_cc', 'appliedtotransaction' );
					if (!isEmpty(appliedBudgetDate)) {
//						if (minBudgetDate != appliedBudgetDate) {			// keep track of number of different budget dates on applied trans
//							count++;							
//						}
						if (isEmpty(minBudgetDate)) {			// first time through the loop
							minBudgetDate = appliedBudgetDate;
						} else if (nlapiStringToDate(appliedBudgetDate) < nlapiStringToDate(minBudgetDate)) {
							minBudgetDate = appliedBudgetDate;		// new minimum		
						}
					}
					errmsg = 'applied budget date [' + k + '] = ' + appliedBudgetDate + ' min = ' + minBudgetDate;
					nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);				
				}
//				if (count > 1) {
				if (budgetDate != minBudgetDate) {			// Bitbucket #334 - update downstream transaction with upstream date only if different.
					nlapiSubmitField(rectype, recId, 'custbody_budgetdate_cc', minBudgetDate);
					// Bitbucket #211 - doing a hack, we will assume that the budget definitions and periods previously loaded will be the same, even if the budget date changes
					// this could be a problem for end of year PO being billed in new year and rollover is NOT run. 
					budgets.budgetDate = budgetDate = minBudgetDate;		
				}
			}
		}
		
		if (currentContext.getSetting('SCRIPT', 'custscript_bconeworldflag_cc') == 'T')
			subsidiary = nlapiGetFieldValue('subsidiary');

		if (oldRecord) {
			oldStatus = oldRecord.getFieldValue('status');
			oldStatusValue = oldRecord.getFieldText('status');
			oldApprovalStatus = oldRecord.getFieldText('approvalstatus');
			oldApprovalValue = oldRecord.getFieldValue('approvalstatus');
//			errmsg = 'Old record id = ' + oldRecord.getId();
//			nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
			// for a copied transaction, the type is create in the aftersubmit. 
			// The old record still has an approval status, but the old transaction ID is null
			if (type == 'create' && oldRecord.getId() == null) {
				oldApprovalStatus = '';
				oldApprovalValue = '';				
			}
		} else {
			oldStatus = null;
			oldStatusValue = '';
		}
		if (recResults) {
			srchResultStatus = recResults[0].getText('status');
			srchStatusValue = recResults[0].getValue('status');
		} else if (type == 'delete') {
			srchResultStatus = 'Delete Record';
			approvalValue = '';
			approvalStatus = '';
			if (oldRecord)
				budgetDate = oldRecord.getFieldValue('custbody_budgetdate_cc');
		}

		
		// the calculated status value will be a combination of the old status value concatenated with the new status value.
		// This simplifies the switch logic below.
		// Bitbucket #213 - New logic to handle the ignore flag. When on treat as rejected status.
		if (nlapiGetFieldValue('custbody_ignorebudchk_cc') == 'T' && oldIgnoreFlag != 'T') {
			nlapiLogExecution('DEBUG', 'PBC Transaction After Submit' ,'Turning ON ignore flag ');
			approvalValue = '3';
			srchResultStatus = 'Ignore Budget Check';
		}
		if (nlapiGetFieldValue('custbody_ignorebudchk_cc') != 'T' && oldIgnoreFlag == 'T') {
			nlapiLogExecution('DEBUG', 'PBC Transaction After Submit' ,'Turning OFF ignore flag ');
			oldApprovalValue = '3';
			oldStatus = 'Ignore Budget Check';
			oldStatusValue = 'Ignore Budget Check';
		}
		calcStatusValue = oldApprovalValue + '-' + approvalValue;
		errmsg = 'Tran ID = ' + tranId + ' budget date = ' + budgetDate 
			+ ' Transaction search approval status = ' + approvalValue +  ' ' + approvalStatus 
			+ ' Old record approval status = ' + oldApprovalValue + ' ' + oldApprovalStatus + ' calc status value = ' + calcStatusValue
			+ ' Old status = ' + oldStatus + ' ' + oldStatusValue + ' srch status = ' + srchResultStatus + ' ' + srchStatusValue 
			+ ' VB Encumbrance Flag = ' + vbEncumbrance
			+ ' Void reversals = ' + featureConfig.getFieldValue('reversalvoiding')
			+ ' PR approval routing = ' + featureConfig.getFieldValue('customapprovalpurchreq')
			+ ' PO approval routing = ' + featureConfig.getFieldValue('customapprovalpurchord')
			+ ' ER approval routing = ' + featureConfig.getFieldValue('customapprovalexpense')
			+ ' VB approval routing = ' + featureConfig.getFieldValue('customapprovalvendorbill');
		nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
		// When a PR gets submitted for approval, it appears that the record type is changed to caps.
		switch (rectype.toLowerCase()) {
		case 'purchaserequisition':
			/* Approval status is not used by this transaction. 
			 * Note - When the Order Requisition page is used to mark reqs for processing, the new PO will have a status of Pending Approval (regardless of default PO status)
			 * Status value states are as follows (without APPROVAL feature turned on) :
			 * 	User Action			Old Status						Search Record Status
			 * ------------------------------------------------------------------------------------
			 * 	New req				null								Pending Order
			 *  Update req			Pending Order						Pending Order
			 *  push button			Pending Order						Fully Ordered
			 *  Order Req			Pending Order						Partially Ordered
			 *  Order Req			Pending Order						Fully Ordered
			 *  Delete Record		Pending Order						Rejected
			 *  
			 * Status value states are as follows (with APPROVAL feature turned on) :
			 * 	User Action			Old Status						Search Record Status
			 * ------------------------------------------------------------------------------------
			 * 	New req				null								Pending Approval
			 *  Approve dropdown	Pending Approval					Pending Order
			 *  Rejected			Pending Approval					Rejected
			 *  Pending dropdown	Rejected							Pending Approval
			 *  Rejected			Approved							Rejected
			 *  Approved			Rejected							Pending Order
			 *  
			 */
			poNum = recId;
			if (featureConfig.getFieldValue('customapprovalpurchreq') == 'T') {
				switch (calcStatusValue) {
				case '-1':
				case '-2':
					approvalStatus = 'Pending New PR';
					break;
				case '1-1':
				case '1-2':
				case '2-1':
					approvalStatus = 'PR Pending No Change';
					break;
				case '1-3':
				case '2-3':
					approvalStatus = 'PR Rejected';
					break;
				case '3-1':
				case '3-2':
					approvalStatus = 'PR Pending From Rejected';
					break;
				case '3-3':
				case '3-':					// Bitbucket #242 - delete case
				case '-3':					// Bitbucket #213 - Ignore budget check is on
					approvalStatus = 'PO Rejected No Change';			// reuse the PO status, since there is no impact.
					break;
				case '':
				case null:
				default:
					approvalStatus = 'PR Pending No Change';
					errmsg = 'DEFAULT approval status value detected = ' + srchResultStatus + ' old status = ' + oldStatus; 
					nlapiLogExecution('AUDIT', 'PBC PO Transaction After Submit', errmsg);
				}
			} else {
				switch (srchResultStatus) {
				case 'Pending Order' :
				case 'Pedido pendiente' :				// pending order
				case 'Pending Approval' :
				case 'Aprobaci�n pendiente' :			// pending approval
					switch (oldStatus) {
					case null :
					case '':		
						approvalStatus = 'Pending New PR';
						break;
					case 'Pending Order' :
					case 'Pending Approval' :
						approvalStatus = 'PR Pending No Change';
						break;
					case 'Rejected':
					case 'Ignore Budget Check':
						approvalStatus = 'PR Pending From Rejected';
						break;
					default:
						approvalStatus = 'PR Pending No Change';
						errmsg = 'DEFAULT approval status value detected = ' + srchResultStatus + ' old status = ' + oldStatus; 
						nlapiLogExecution('AUDIT', 'PBC PO Transaction After Submit', errmsg);
					}
					break;
				case 'Partially Ordered' :
				case 'Pedido parcial' :					// partial order
				case 'Parcialmente recibido' :			// partially received
					switch (oldStatus) {
					case 'Partially Ordered' :
						approvalStatus = 'PR Pending No Change';
						break;
					default:
						approvalStatus = 'PR Pending No Change';
						errmsg = 'DEFAULT approval status value detected = ' + srchResultStatus + ' old status = ' + oldStatus; 
						nlapiLogExecution('AUDIT', 'PBC PO Transaction After Submit', errmsg);
					}
					break;
				case 'Delete Record':
				case 'Rejected':
					poNum = null;
					approvalStatus = 'PR Rejected';
					break;
				case 'Ignore Budget Check':
					if (oldStatus == null) {			// Bitbucket #213 - Create record scenario. User marked the PR as ignore. 
						poNum = null;
						approvalStatus = 'PO Rejected No Change';						
					} else {
						poNum = null;
						approvalStatus = 'PR Rejected';
					}
					break;
				default:
					errmsg = 'Unknown Approval Status = ' + srchResultStatus + ' ';
					nlapiLogExecution('ERROR', 'PO Transaction After Submit', errmsg);
					return false;
				}
			}
			break;
		case 'blanketpurchaseorder':
			if (featureConfig.getFieldValue('customapprovalblankord') == 'T') {
				switch (calcStatusValue) {
				case '-1':
					approvalStatus = 'Pending New BPO';
					break;
				case '-2':
					approvalStatus = 'Approved New BPO';
					break;
				case '-3':
					approvalStatus = 'Rejected New BPO';
					break;
				case '1-1':
					approvalStatus = 'BPO Pending No Change';
					break;
				case '1-2':
					approvalStatus = 'BPO Approved from Pending';
					break;
				case '1-3':
					approvalStatus = 'BPO Rejected from Pending';
					break;
				case '2-1':
					approvalStatus = 'BPO Pending from Approve';
					break;
				case '2-2':
					approvalStatus = 'BPO Approved No Change';
					break;
				case '2-3':
					approvalStatus = 'BPO Rejected from Approve';
					break;
				case '3-1':
					approvalStatus = 'BPO Pending from Rejected';
					break;
				case '3-2':
					approvalStatus = 'BPO Approved from Rejected';
					break;
				case '3-3':
					approvalStatus = 'BPO Rejected No Change';
					break;
				case '1-':
					approvalStatus = 'BPO Deleted from Pending';
					break;
				case '2-':
					approvalStatus = 'BPO Deleted from Approve';
					break;
				case '3-':
					approvalStatus = 'BPO Deleted from Rejected';
					break;
				default:
					errmsg = 'Unknown Approval Status = ' + approvalValue + ' ' + approvalStatus;
					nlapiLogExecution('ERROR', 'PO Transaction After Submit', errmsg);
					return false;
				}
			} else {
				if (type == 'delete') {
					approvalStatus = 'BPO Deleted from Approve';					
				} else {
					approvalStatus = 'BPO Approved No Change';					
				}
			}
			break;
		case 'purchaseorder':
			/*
			 * When approval routing is turned off, the following status values apply
			 * 	User Action			Old Status						Search Record Status
			 * ------------------------------------------------------------------------------------
			 * New PO				null							Pending Receipt
			 * New PO				null							Pending Supervisor Approval
			 * Checked Supervisor	Pending Supervisor Approval		Pending Receipt
			 * Existing PO update	Pending Receipt					Pending Receipt
			 * Edit after receive	Pending Bill					Pending Bill
			 * 
			 * When approval routing is turned on, the following status values apply
			 * 	User Action			Old Status						Search Record Status
			 * ------------------------------------------------------------------------------------
			 * New PO				null							Pending Supervisor Approval
			 * Edit PO				Pending Supervisor Approval		Pending Supervisor Approval
			 * Edit PO				Partially Received				Partially Received
			 * Edit PO				Fully Billed					Fully Billed 		(this should not happen)
			 * Approved (dropdown)	Pending Supervisor Approval		Pending Receipt
			 * Approved (dropdown)	Rejected by Supervisor			Pending Receipt
			 * Approved (dropdown)	Pending Billing/Partially Received	Pending Billing/Partially Received'		
			 * Approved (dropdown)  Pending Bill					Pending Billing/Partially Received
			 * Pending (dropdown)	Pending Receipt					Pending Supervisor Approval
			 * Pending (dropdown)	Rejected by Supervisor			Pending Supervisor Approval		
			 * Rejected (dropdown)	Pending Supervisor Approval		Rejected by Supervisor
			 * Rejected (dropdown)	Pending Receipt					Rejected by Supervisor
			 * Set line level close	Pending Receipt					Closed				(when all lines are closed by checkbox)
			 * Uncheck close flag	Closed							Pending Receipt
			 * Uncheck close flag	Closed							Pending Supervisor Approval
			 *
			 * For requisitions, the following status will occur. And the applied fields will have values.
			 * There is a new type value = orderpurchreqs when the Order Requisition page is used.
			 * 	User Action			Old Status						Search Record Status
			 * ------------------------------------------------------------------------------------
			 *  push button			Pending Order					Default approval status
			 *  Order Req			Pending Order					Pending Approval
			 * 
			 */
			invoiceId = recId;
			if (type == 'delete') {
				approvalStatus = 'Rejected';
				approvalStatusValue = '3';
				calcStatusValue = oldApprovalValue + '-' + approvalValue;
				poNum = null;		// since the transaction no longer exists, the referential integrity is broken to the parent record.
				recId = null;
				errmsg = 'Delete record special status = ' + approvalValue + ' ' + approvalStatus + ' ' + calcStatusValue;
				nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
			} 
			if (featureConfig.getFieldValue('customapprovalpurchord') == 'T') {
				switch (calcStatusValue) {
				case '-1':
					// need to check for existence of applied record.
					if (lineOneCreatedFrom != '' && lineOneCreatedFrom != null)
						approvalStatus = 'PO Pending From PR';
					else
						approvalStatus = 'Pending New PO';
					// Blanket PO logic. This is mutually exclusive of previous PR check.
					// When the PO is first released or created, the type is orderitems. 
					if (type == 'orderitems') {
						approvalStatus = 'PO Pending from BPO';
					}
					break;
				case '-2':
					// need to check for existence of applied record.
					if (lineOneCreatedFrom != '' && lineOneCreatedFrom != null)
						approvalStatus = 'PO Approved From PR';
					else
						approvalStatus = 'Approved New PO';
					// Blanket PO logic. This is mutually exclusive of previous PR check.
					// When the PO is first released or created, the type is orderitems. 
					if (type == 'orderitems') {
						approvalStatus = 'PO Approved from BPO';
					}
					break;
				case '-3':
					approvalStatus = 'Rejected New PO';
					break;
				case '1-1':
					approvalStatus = 'PO Pending No Change';
					break;
				case '1-2':
					approvalStatus = 'PO Approved from Pending';
					break;
				case '1-3':
					approvalStatus = 'PO Rejected from Pending';
					break;
				case '2-1':
					approvalStatus = 'PO Pending from Approve';
					break;
				case '2-2':
					approvalStatus = 'PO Approved No Change';
					break;
				case '2-3':
					approvalStatus = 'PO Rejected from Approve';
					break;
				case '3-1':
					approvalStatus = 'PO Pending from Rejected';
					break;
				case '3-2':
					approvalStatus = 'PO Approved from Rejected';
					break;
				case '3-3':
					approvalStatus = 'PO Rejected No Change';
					break;
				case '1-':
					approvalStatus = 'PO Deleted from Pending';
					break;
				case '2-':
					approvalStatus = 'PO Deleted from Approve';
					break;
				case '3-':
					approvalStatus = 'PO Deleted from Rejected';
					break;
				default:
					errmsg = 'Unknown Approval Status = ' + approvalValue + ' ' + approvalStatus;
					nlapiLogExecution('ERROR', 'PO Transaction After Submit', errmsg);
					return false;
				}
			} else {
			switch (srchResultStatus) {
				case 'Rejected by Supervisor' :
				case 'Ignore Budget Check':
					switch (oldStatus) {
					case 'Approved by Supervisor/Pending Receipt' :
					case 'Partially Received' :
					case 'Pending Receipt' :
						approvalStatus = 'PO Rejected from Approve';
						break;
					case 'Pending Supervisor Approval':
						approvalStatus = 'PO Rejected from Pending';
						break;
					case 'Pending Bill':			// this case is not coded for and does not appear to happen in practice
						approvalStatus = 'PO Rejected from Pending Bill';
						break;
		
					default :
						approvalStatus = 'PO Rejected No Change';
						errmsg = 'DEFAULT approval status value detected = ' + approvalStatus + ' old status = ' + oldStatus; 
						nlapiLogExecution('AUDIT', 'PBC PO Transaction After Submit', errmsg);
					}
					break;
				case 'Delete Record' :
					switch (oldStatus) {
					case 'Approved by Supervisor/Pending Receipt' :
					case 'Partially Received' :
					case 'Pending Receipt' :
						approvalStatus = 'PO Deleted from Approve';
						break;
					case 'Pending Supervisor Approval':
						approvalStatus = 'PO Deleted from Pending';
						break;
					case 'Pending Bill':			// this case is not coded for and does not appear to happen in practice
						approvalStatus = 'PO Deleted from Pending Bill';
						break;	
					default :
						approvalStatus = 'PO Deleted No Change';
						errmsg = 'DEFAULT approval status value detected = ' + approvalStatus + ' old status = ' + oldStatus; 
						nlapiLogExecution('AUDIT', 'PBC PO Transaction After Submit', errmsg);
					}
					break;
				case 'Approved':
				case 'Pending Receipt':			// approval routing status off
				case 'Partially Received' :
				case 'Fully Billed' :
				case 'Pending Bill':						// approval routing status off
				case 'Pending Billing/Partially Received':		
					switch (oldStatus) {
					case 'Approved by Supervisor/Pending Receipt' :
					case 'Pending Billing/Partially Received':		
					case 'Partially Received' :
					case 'Pending Receipt' :
					case 'Fully Billed' :
					case 'Pending Bill':		// in this case, the PO has been received but the PO is being updated. Not sure if this is a realistic scenario, but the system allows it.
						approvalStatus = 'PO Approved No Change';
						break;
					case 'Pending Supervisor Approval':
						approvalStatus = 'PO Approved from Pending';
						break;
					case 'Rejected by Supervisor':
					case 'Ignore Budget Check':
						approvalStatus = 'PO Approved from Rejected';
						break;
					case null : 
						// need to check for existence of applied record.
						// approvalStatus = 'Approved New PO';
						if (lineOneCreatedFrom != '' && lineOneCreatedFrom != null)
							approvalStatus = 'PO Approved From PR';
						else
							approvalStatus = 'Approved New PO';
						break;
					default :
						approvalStatus = 'PO Approved No Change';
						errmsg = 'DEFAULT approval status value detected = ' + approvalStatus + ' old status = ' + oldStatus; 
						nlapiLogExecution('AUDIT', 'PBC PO Transaction After Submit', errmsg);
					}
					break;
				case 'Pending Approval':
				case 'Pending Supervisor Approval':
					switch (oldStatus) {
					case 'Approved by Supervisor/Pending Receipt' :
					case 'Pending Receipt' :
						approvalStatus = 'PO Pending from Approve';
						break; 
					case 'Pending Supervisor Approval':
					// case 'Pending Receipt' :
					case 'Pending Bill' :
						approvalStatus = 'PO Pending No Change';
						break;
					case 'Rejected by Supervisor':
					case 'Ignore Budget Check':
						approvalStatus = 'PO Pending from Rejected';
						break;
					case null : 
						if (lineOneCreatedFrom != '' && lineOneCreatedFrom != null)
							approvalStatus = 'PO Pending From PR';
						else
							approvalStatus = 'Pending New PO';
						break;
					default :
						approvalStatus = 'PO Pending No Change';
						errmsg = 'DEFAULT approval status value detected = ' + approvalStatus + ' old status = ' + oldStatus; 
						nlapiLogExecution('AUDIT', 'PBC PO Transaction After Submit', errmsg);
					}
		
					break;
				case 'Closed':
					switch (oldStatus) {
					case 'Approved by Supervisor/Pending Receipt' :
					case 'Partially Received' :
					case 'Pending Receipt' :
					case 'Approved by Supervisor/Pending Bill' :				// Bitbucket #318 - New status value to handle
//						approvalStatus = 'PO Rejected from Approve';
						approvalStatus = 'PO Approved No Change';				// Bitbucket #318 - Faked out the status since the closed status is already handled in the advanced approval case
						break;
					case 'Pending Supervisor Approval':
						approvalStatus = 'PO Rejected from Pending';
						break;
					case 'Pending Bill':			
					case 'Pending Billing/Partially Received':			
						approvalStatus = 'PO Rejected from Pending Bill';
						break;
					default :
						approvalStatus = 'PO Rejected No Change';
						errmsg = 'DEFAULT CLOSED approval status value detected = ' + approvalStatus + ' old status = ' + oldStatus; 
						nlapiLogExecution('ERROR', 'PBC PO Transaction After Submit', errmsg);
					}
					break;
				default:
					errmsg = 'Unknown Approval Status = ' + approvalStatus + ' ';
					nlapiLogExecution('ERROR', 'PO Transaction After Submit', errmsg);
					var faultText = 'Agent Smith - There has been a glitch detected in the matrix:\n\n' 
						+ 'This occured in company (' + currentContext.getCompany()
						+ ') for user (' + nlapiGetUser()
						+ ').\n\t' + errmsg + ' for PO = ' + poNum + ' recId = ' + recId;
					var subject = "PBC After Submit Transaction Reported an error";
					var adminEmail = 'balaji@pyango.com';
					var ccArray = new Array();
					ccArray[0] = adminEmail;
					ccArray[1] = 'mike@pyango.com';
					nlapiSendEmail('-5', adminEmail, subject, faultText, ccArray);
					return false;
				}
				// Blanket PO logic. This will override all the previous logic. 
				// A blanket PO does NOT trigger the before load or submit events.
				// When the PO is first released or created, the type is orderitems. The search Approval Status is Pending Approval. 
				// But then the PO is ultimately saved with Approval Status = Approved and status is Pending Receipt
				if (type == 'orderitems') {
					approvalStatus = 'PO Pending from BPO';
				}
			}
			break;
		case 'vendorbill':
			invoiceID = recId;
			if (type == 'delete') {
				approvalStatus = 'Rejected';
				approvalValue = '3';
				calcStatusValue = oldApprovalValue + '-' + approvalValue;
				invoiceID = null;
				recId = null;
				errmsg = 'Delete record special status = ' + approvalValue + ' ' + approvalStatus + ' ' + calcStatusValue;
				nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
			}
			if (featureConfig.getFieldValue('customapprovalvendorbill') == 'T') {
				switch (calcStatusValue) {
				case '-1':
					// need to check for existence of applied record.
					if (!isEmpty(hdrCreatedFrom)) {
						if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
							approvalStatus = 'VB Pending From PO';
						} else {
							approvalStatus = 'VB Approved From PO';							
						}
					} else { 
						if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
							approvalStatus = 'Pending New VB';
						} else {
							approvalStatus = 'Approved New VB';
						}
					}
					break;
				case '-2':
					// need to check for existence of applied record.
					if (hdrCreatedFrom != '')
						approvalStatus = 'VB Approved From PO';
					else
						approvalStatus = 'Approved New VB';
					break;
				case '-3':
					approvalStatus = 'Rejected New VB';
					break;
				case '1-1':
					if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
						approvalStatus = 'VB Pending No Change';							
					} else {
						approvalStatus = 'VB Approved No Change';
					}
					break;
				case '1-2':
					if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
						approvalStatus = 'VB Approved From Pending';
					} else {
						approvalStatus = 'VB Approved No Change';					
					}
					break;
				case '1-3':
					if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
						approvalStatus = 'VB Rejected From Pending Approval';
					} else {
						approvalStatus = 'VB Rejected From Approved';
					}
					break;
				case '2-1':
					approvalStatus = 'VB Pending from Approve';				// This should not happen
					break;
				case '2-2':
					approvalStatus = 'VB Approved No Change';
					break;
				case '2-3':
					approvalStatus = 'VB Rejected From Approved';			// This should not happen
					break;
				case '3-1':
					if (!isEmpty(hdrCreatedFrom)) {
						if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
							approvalStatus = 'VB Pending From PO';
						} else {
							approvalStatus = 'VB Approved From PO';			
						}
					} else { 
						if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
							approvalStatus = 'VB Pending From Rejected';
						} else {
							approvalStatus = 'VB Approved From Rejected';
						}
					}
					break;
				case '3-2':
					if (hdrCreatedFrom != '')
						approvalStatus = 'VB Approved From PO';
					else
						approvalStatus = 'VB Approved From Rejected';
					break;
				case '3-3':
					approvalStatus = 'PO Rejected No Change';
					break;
				case '1-':
					approvalStatus = 'VB Rejected From Pending Approval';
					break;
				case '2-':
					approvalStatus = 'VB Rejected From Approved';
					break;
				case '3-':
					approvalStatus = 'VB Rejected No Change';
					break;
				default:
					errmsg = 'Unknown Approval Status = ' + approvalValue + ' ' + approvalStatus;
					nlapiLogExecution('ERROR', 'PO Transaction After Submit', errmsg);
					return false;
				}
			} else {
				switch (approvalValue) {
	//			case 'Rejected' :		// this status is also used in case the user cancels a bill. A bill can only be canceled when in Pending state
				case '3' :		// this status is also used in case the user cancels a bill. A bill can only be canceled when in Pending state
				case 'Ignore Budget Check':
					switch (oldStatus) {
					case 'Pending Approval' :
						if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
							approvalStatus = 'VB Rejected From Pending Approval';
						} else {
							approvalStatus = 'VB Rejected From Approved';							
						}
						break;
					case 'Open':
						approvalStatus = 'VB Rejected From Approved';
						break;
					default :
						approvalStatus = 'VB Rejected No Change';
						errmsg = 'DEFAULT approval status value detected = ' + approvalStatus + ' old status = ' + oldStatus; 
						nlapiLogExecution('AUDIT', 'PBC PO Transaction After Submit', errmsg);
					}
					break;
	//			case 'Approved':		// once a VB is approved, the old status can not be changed and remains at Open until paid.
				case '2':	
					switch (oldStatus) {
					case 'Pending Approval':
						if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
							approvalStatus = 'VB Approved From Pending';
						} else {					
							approvalStatus = 'VB Approved No Change';
						}
						break;
					case 'Open':
						approvalStatus = 'VB Approved No Change';
						break;
					case 'Paid In Full':
						approvalStatus = 'VB Approved No Change';
						break;
	
					default :		// This is the case for a new VB that with old status = null (when the NetSuite default is to have VB start in approved status)
						if (hdrCreatedFrom != '')
							approvalStatus = 'VB Approved From PO';
						else
							approvalStatus = 'Approved New VB';
					}
					break;
	//			case 'Pending Approval':
				case '1':	
					switch (oldStatus) {
					case 'Pending Approval':
						if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
							approvalStatus = 'VB Pending No Change';
						} else {
							approvalStatus = 'VB Approved No Change';						
						}
						break;
					case 'Rejected':
					case 'Ignore Budget Check':
						if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
							approvalStatus = 'VB Pending From Rejected';
						} else {
							approvalStatus = 'VB Rejected From Approved';													
						}
						break;
					default :		// This is the case for a new VB that with old status = null
						if (hdrCreatedFrom != '') {
							if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
								approvalStatus = 'VB Pending From PO';
							} else {
								approvalStatus = 'VB Approved From PO';							
							}
						} else { 
							approvalStatus = '';
							if (vbEncumbrance == 'T') {								// Bitbucket #157 - Check to see if unapproved --> encumbrance
								approvalStatus = 'Pending New VB';
							} else {
								approvalStatus = 'Approved New VB';							
							}
						}
	
					}
	
					break;
				default:
					errmsg = 'Unknown Approval Status = ' + approvalStatus;
					nlapiLogExecution('ERROR', 'PBC PO Transaction After Submit', errmsg);
					var faultText = 'Agent Smith - There has been a glitch detected in the matrix:\n\n' 
						+ 'This occured in company (' + currentContext.getCompany()
						+ ') for user (' + nlapiGetUser()
						+ ').\n\t' + errmsg + ' for VB = ' + invoiceID + ' recId = ' + recId;
					var subject = "PBC After Submit Transaction Reported an error";
					var adminEmail = 'balaji@pyango.com';
					var ccArray = new Array();
					ccArray[0] = adminEmail;
					ccArray[1] = 'mike@pyango.com';
					nlapiSendEmail('-5', adminEmail, subject, faultText, ccArray);
					return false;
				}
			}
			break;
		case 'vendorcredit':			// these transactions do not have any approval status
			invoiceID = recId;
			if (hdrCreatedFrom && (hdrDateCreated == hdrDateModified))
				approvalStatus = 'New Vendor Credit From Bill';
			else approvalStatus = 'Vendor Credit';		
			break;
		case 'creditcardcharge':			// these transactions do not have any approval status
			// The user can change the CC charge to a refund or credit on a new record.
			// the record type changes after the save and then becomes a credit card refund or vice versa-
			invoiceID = recId;
			approvalStatus = 'Credit Card Charge';
			if (curRecord) {
				if (curRecord.getFieldValue('trantype') == 'CardChrg')
					approvalStatus = 'Credit Card Charge';
				else 
					approvalStatus = 'Credit Card Refund';
			} else {
				if (oldRecord.getFieldValue('trantype') == 'CardChrg')
					approvalStatus = 'Credit Card Charge';
				else 
					approvalStatus = 'Credit Card Refund';
			}
			break;
		case 'creditcardrefund':
			invoiceID = recId;
			approvalStatus = 'Credit Card Refund';
			if (curRecord) {
				if (curRecord.getFieldValue('trantype') == 'CardChrg')
					approvalStatus = 'Credit Card Charge';
				else 
					approvalStatus = 'Credit Card Refund';
			} else {
				if (oldRecord.getFieldValue('trantype') == 'CardChrg')
					approvalStatus = 'Credit Card Charge';
				else 
					approvalStatus = 'Credit Card Refund';
			}
			break;
		case 'check':			// these transactions do not have any approval status
			invoiceID = recId;
			approvalStatus = 'Check';		
			break;
		case 'expensereport':
			/* Approval status is not used by this transaction. 
			 * Status value states are as follows (with out APPROVAL routing turned on):
			 * 	User Action			Status Field						Search Record Status
			 * ------------------------------------------------------------------------------------
			 * 	New expense report	null								Pending Supervisor Approval
 			 *	basic edit			Pending Supervisor Approval			Pending Supervisor Approval
 			 *	basic edit			Pending Accounting Approval			Pending Accounting Approval
			 * 	Edit after reject	Rejected by Supervisor				In Progress
			 * 	basic edit			In Progress							In Progress
			 * 	supervisor checkbox	In Progress							Pending Accounting Approval
			 *  accounting checkbox	Pending Accounting Approval			Approved by Accounting
			 *  uncheck accounting	Approved by Accounting				Pending Accounting Approval
			 *  uncheck supervisor-accounting on Approved by Accounting				Approved (Overridden) by Accounting
 			 *	uncheck supervisor	Pending Accounting Approval			Pending Supervisor Approval	
 			 *	approve button		Pending Supervisor Approval			Pending Accounting Approval
 			 *	reject button		Pending Supervisor Approval			Rejected by Supervisor
 			 *	reject button		Pending Accounting Approval			Rejected (Overridden) by Accounting
 			 *	edit after reject	Rejected (Overridden) by Accounting	Pending Accounting Approval
 			 *	uncheck supervisor	Rejected (Overridden) by Accounting	Pending Supervisor Approval 
			*/
			if (featureConfig.getFieldValue('customapprovalexpense') == 'T') {
				switch (calcStatusValue) {
				case '-1':
				case '-11':
					approvalStatus = 'Pending New ER';	
					break;
				case '-2':
					approvalStatus = 'Approved New ER';
					break;
				case '-3':
					approvalStatus = 'Rejected New ER';
					break;
				case '1-1':
				case '11-11':
				case '11-1':
				case '1-11':
					approvalStatus = 'ER Pending No Change';
					break;
				case '1-2':
				case '11-2':
					approvalStatus = 'ER Approved From Pending Super';
					break;
				case '1-3':
				case '11-3':
					approvalStatus = 'ER Rejected From Pending';
					break;
				case '2-1':
				case '2-11':
					approvalStatus = 'ER Pending From Accounting';
					break;
				case '2-2':
					approvalStatus = 'ER Approved No Change';
					break;
				case '2-3':
					approvalStatus = 'ER Rejected From Accounting';
					break;
				case '3-1':
				case '3-11':
					approvalStatus = 'ER Pending From Rejected';
					break;
				case '3-2':
					approvalStatus = 'ER Approved From Rejected';
					break;
				case '3-3':
					approvalStatus = 'ER Rejected No Change';
					break;
				case '1-':
				case '11-':
					approvalStatus = 'ER Rejected From Pending';
					break;
				case '2-':
					approvalStatus = 'ER Rejected From Accounting';
					break;
				case '3-':
					approvalStatus = 'ER Rejected No Change';
					break;
				default:
					errmsg = 'Unknown Approval Status = ' + approvalValue + ' ' + approvalStatus;
					nlapiLogExecution('ERROR', 'PO Transaction After Submit', errmsg);
					return false;
				}

			} else {
				switch (srchResultStatus) {
				case 'Pending Supervisor Approval':
				case 'Pending Approval':
					switch (oldStatus) {
					case null:
						approvalStatus = 'Pending New ER';	
						break;
					case 'Pending Supervisor Approval':
					case 'Pending Approval':
						approvalStatus = 'ER Pending No Change';
						break;
					case 'Pending Accounting Approval':
						approvalStatus = 'ER Pending From Super Approval';
						break;
					case 'Rejected (Overridden) by Accounting':
					case 'Rejected by Supervisor':
					case 'In Progress':				// Bitbucket #304
					case 'Ignore Budget Check':
						approvalStatus = 'ER Pending From Rejected';
						break;
					case 'Approved by Accounting':			
						approvalStatus = 'ER Pending From Accounting';
						break;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);	
					}
					break;
				case 'Pending Accounting Approval':
				case 'Approved':
					switch (oldStatus) {
					case null:
						approvalStatus = 'Pending Accounting New ER';	
						break;
					case 'In Progress':				// Bitbucket #304
						approvalStatus = 'ER Pending Accounting From Rejected';	
						break;
					case 'Pending Supervisor Approval':			// standard approval process
					case 'Pending Approval':
						approvalStatus = 'Pending Accounting ER From Super Approval';
						break;
					case 'Pending Accounting Approval':
					case 'Rejected (Overridden) by Accounting':
						approvalStatus = 'ER Pending Accounting No Change';
						break;
					case 'Approved by Accounting':
					case 'Paid In Full':
						approvalStatus = 'ER Pending Accounting From Approved';
						break;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);	
						return false;
					}
					break;
				case 'Approved by Accounting':
					switch (oldStatus) {
					case 'Pending Supervisor Approval':			// both checkboxes are marked during same session
						approvalStatus = 'ER Approved From Pending Super';
						break;
					case 'Pending Accounting Approval':
						approvalStatus = 'ER Approved From Pending Accounting';
						break;
					case 'Approved by Accounting':
					case 'Paid In Full':
						approvalStatus = 'ER Approved No Change';
						break;
					case 'Rejected by Supervisor':
					case 'In Progress':				// Bitbucket #304
					case 'Ignore Budget Check':
						approvalStatus = 'ER Approved From Rejected';
						break;
					case null:		// this is a brand new expense report with both check boxes.
						approvalStatus = 'Approved New ER';
						break;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);
						return false;
					}
					break;
				case 'In Progress':
					switch (oldStatus) {
					case 'In Progress':			// Bitbucket #304
					case null:		// this is a brand new expense report that is still in progress
					case 'Rejected by Supervisor':
					case 'Rejected by Accounting':
					case 'Rejected (Overridden) by Accounting':
					case 'Ignore Budget Check':
						errmsg = 'Expense Report is In Progress Status --> No Budget impact ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('AUDIT', 'PBC Transaction After Submit', errmsg);	
						return false;
						break;
					case 'Approved by Accounting':
					case 'Paid In Full':
						approvalStatus = 'ER Rejected From Accounting';
						break;
					case 'Pending Supervisor Approval':			
						approvalStatus = 'ER Rejected From Pending';
						break;
					case 'Pending Accounting Approval':			
						approvalStatus = 'ER Rejected From Super';
						break;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);	
						return false;
					}
					break;
				case 'Approved (Overridden) by Accounting':
					switch (oldStatus) {
					case 'Approved by Accounting':			// this status should not happen, since it would be unchecking supervisor approval without unapproving accounting
					case 'Paid In Full':
						approvalStatus = 'ER Approved No Change';
						break;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);	
						return false;
					}
					break;
				case 'Rejected by Supervisor':
				case 'Rejected by Accounting':
				case 'Ignore Budget Check':
					switch (oldStatus) {
					case 'Pending Supervisor Approval':			
						approvalStatus = 'ER Rejected From Pending';
						break;
					case 'Approved by Accounting':	
					case 'Paid In Full':
						approvalStatus = 'ER Rejected From Accounting';
						break;
					case 'Ignore Budget Check':
						errmsg = 'Expense Report Rejected or Ignored. No budget impact.';
						nlapiLogExecution('AUDIT', 'PBC Transaction After Submit', errmsg);	
						return true;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);	
						return false;
					}
					break;
				case 'Rejected (Overridden) by Accounting':
					switch (oldStatus) {
					case 'Pending Accounting Approval':			
					case 'Paid In Full':
						approvalStatus = 'ER Rejected From Super';
						break;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);	
						return false;
					}
					break;
				case 'Delete Record':
					switch (oldStatus) {
					case 'Pending Supervisor Approval':			
					case 'In Progess':			
						approvalStatus = 'ER Rejected From Pending';
						break;
					case 'Pending Accounting Approval':			
						approvalStatus = 'ER Rejected From Super';
						break;
					case 'Approved by Accounting':			
					case 'Paid In Full':
						approvalStatus = 'ER Rejected From Accounting';
						break;
					case 'Rejected by Supervisor':			
					case 'Rejected (Overridden) by Accounting':			
					case 'Ignore Budget Check':
						errmsg = 'Expense Report Deleted from a Rejected Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);	
						return true;			// no impact to budget since it was already rejected.
						break;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);	
						return false;
					}
					break;
				case 'Paid In Full':
					switch (oldStatus) {
					case 'Approved by Accounting':
					case 'Paid In Full':
						approvalStatus = 'ER Approved No Change';
						break;
					case 'Pending Accounting Approval':			
						approvalStatus = 'ER Approved From Pending Accounting';
						break;
					case null:		// this is a brand new expense report with both check boxes.
						approvalStatus = 'Approved New ER';
						break;
					default:
						errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
						nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);
						return false;
					}
					break;
				default:
					errmsg = 'Expense Report Unknown Search Results Status = ' + srchResultStatus + ' old status = ' + oldStatus;
					nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);
					return false;
				}
			}
			break;
		default:
			errmsg = 'Unsupported record type for budgetary control = ' + rectype;
			nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);
			return false;

		}		// end rectype switch
		errmsg = 'Calculated status = ' + approvalStatus + ' Record ID = ' + recId + ' type = ' + rectype + ' Sub = ' + subsidiary + ' PO id = ' + poNum + ' Invoice ID = ' + invoiceID;
		nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);

		// next we need to determine if the custom sublist should be used. There are special cases where the sublist was not generated by the
		// user edit session. So all of the transaction data will come from search results. 
		
		errmsg = 'transaction edit flag = ' + nlapiGetFieldValue('custpage_transedit_flag');
		nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);
		
		
		if (((approvalStatus == 'PO Approved from Pending') 
				|| (approvalStatus == 'PO Rejected from Pending')) 
				&& (nlapiGetFieldValue('custpage_transedit_flag') != 'T'))
			// This is the case for when a PO is approved by a workflow button, yet the record is never edited in the client.
			// So we need to extract all of the information from the search results.
			useCustomSublistFlag = false;
			
		if (!useCustomSublistFlag){
			var idArray = new Array();
			var appliedRectype = 'purchaserequisition';
			var tempArray = loadAccountTypes();
			if (tempArray) {			// over ride is in effect.
				acctTypeArray = tempArray;
			}
			
			if (rectype == 'vendorbill') appliedRectype = 'purchaseorder';
			// for performance reasons, can't do a look up to the applied transaction header values for every line item row. So need to
			// build an array list of all applied internal IDs for different transactions. Then the single search will do a logical OR
			// for internal IDs. The search filter can have duplicate values within the array, so don't need to have unique checks.
			for (var k = 1; recResults != null && k < recResults.length; k++) {		
				var recResult = recResults[k];
				if (recResult.getValue('appliedtotransaction') != null && recResult.getValue('appliedtotransaction') != '')
					idArray.push(recResult.getValue('appliedtotransaction'));
			}
			errmsg = 'idarray length = ' + idArray.length;
			nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);
			if (idArray.length > 0 ) {
					var filter = new Array();
					filter.push(new nlobjSearchFilter('internalid', null, 'anyof', idArray));
					filter.push(new nlobjSearchFilter( 'mainline', null, 'is', 'T' ));			// only need the header row from the search
					var column = new Array();
					// Don't need to worry about line level unified segment ID when searching for mainline
					for (var m = 0; m < budgets.segmentMapResults.length; m++) {
						var result = budgets.segmentMapResults[m];
						var colValueFieldName = result.getValue('custrecord_columnname_pbc');
						if (colValueFieldName != 'customer')	// the search column is entity, but this is not needed at header level
							column.push(new nlobjSearchColumn( colValueFieldName ));
					}
					column.push(new nlobjSearchColumn( 'custbody_projectid_cc' ));
					column.push(new nlobjSearchColumn( 'custbody_budgetdate_cc' ));
					appliedResults = nlapiSearchRecord( appliedRectype, null, filter, column);	
					errmsg = 'Applied trans look up for header values = ' + appliedRectype;
					if (appliedResults) errmsg += ' applied record count = ' + appliedResults.length;
					nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);
			}		
			
			for (var k = 1; recResults != null && k < recResults.length; k++) {		
				// since the applied transactions can be different on a line by line basis, need to look up the header values for each line
				var resLineType;
				var recResult = recResults[k];
//				var amount = Math.abs(parseFloat(recResult.getValue('amount')));		// search results return a negative number
				var amount = 0.0;
				var estAmount = Math.abs(parseFloat(recResult.getValue('estimatedamount')));		// search results return a negative number
				var quantity = Math.abs(parseFloat(recResult.getValue('quantity')));
				var qtyBilled = Math.abs(parseFloat(recResult.getValue('quantitybilled')));
				var itemRate = Math.abs(parseFloat(recResult.getValue('rate')));
				var accountType = '';
				var skipLine = false;

				// Bitbucket #342 - Changed calculation of the amount so that it removes any quantity billed
				if (isNaN(quantity)) quantity = 1;
				if (isNaN(qtyBilled)) qtyBilled = 0;			// assume that no billing has occurred for expense line. 
				if (quantity < qtyBilled) {
					errmsg = 'User has reduced PO quantity to be less than billed amount. This is not allowed. Qty = ' + quantity + ' billed = ' + qtyBilled;
					nlapiLogExecution('AUDIT', 'PBC Transaction After Submit', errmsg);
					quantity = qtyBilled;
				}
				if (isNaN(itemRate)) {			// this will be true for the expense sublist
					// search results amount is always in the home currency. The fxamount is the base currency of the sub. Need to use this
					// since the budget amount is in the base currency.
					if (currentContext.getFeature('multicurrency') == true) {
						itemRate = Math.abs(parseFloat(recResult.getValue('fxamount')))
							* Math.abs(parseFloat(recResult.getValue('exchangerate')));
					} else {
						itemRate = Math.abs(parseFloat(recResult.getValue('amount')));
					}
				}
				amount = itemRate * (quantity - qtyBilled);					
				
				// search results amount is always in the home currency. The fxamount is the base currency of the sub. Need to use this
				// since the budget amount is in the base currency.
//				if (currentContext.getFeature('multicurrency') == true) {
//					amount = Math.abs(parseFloat(recResult.getValue('fxamount')))
//						* Math.abs(parseFloat(recResult.getValue('exchangerate')));
//				} else {
//					amount = Math.abs(parseFloat(recResult.getValue('amount')));
//				}
				if (isNaN(amount))	amount = 0.0;	
				// 9-12-19 Only need to check for invalid account types when the account segment is active. accountResults will be null when account is not used.
				if (budgets.accountResults) {
					if (recResult.getValue('item'))	{	// for some weird reason expense categories are filled in even for items.
						resLineType = 'item';
						for (var j = 0; j < budgets.accountResults.length; j++) {
							var accountResult = budgets.accountResults[j];
							if (recResult.getValue('account') == accountResult.getId()) {
								// account results getvalue() will return (listed in common function library) as a text data type. NOT number
								accountType = accountResult.getValue('type');		
								break;
							}
						}
						if (acctTypeArray.indexOf(accountType) == -1)
							continue;			// skip to next line
					} else {
						resLineType = 'expense';
						// need to use text to compare to keep in sync with other code. See Common Function Library for complete list.
						accountType = recResult.getText('custcol_accttype_cc');		
						if (acctTypeArray.indexOf(accountType) == -1)
							continue;			// skip to next line
					}
				}
				subList[maxLine] = new Object();
				subList[maxLine].recId = recId;
				subList[maxLine].tranId = recResult.getValue('tranid');
				subList[maxLine].tranDate = tranDate;
				subList[maxLine].tranType = recResult.getRecordType();
				subList[maxLine].lineType = resLineType;
				subList[maxLine].line = recResult.getValue('line');
				subList[maxLine].transformFlag = false;
				subList[maxLine].crudFlag = '2';				// no changes to any of the lines in this case.
				subList[maxLine].curBudgetDate = subList[maxLine].oldBudgetDate = recResult.getValue('custbody_budgetdate_cc');		// Bitbucket #303
				subList[maxLine].appliedBudgetDate = recResult.getValue('custbody_budgetdate_cc', 'appliedtotransaction');		// Bitbucket #211 - save the applied budget date from upstream transaction
				subList[maxLine].curSchedNum = subList[maxLine].oldSchedNum = subList[maxLine].appliedSchedNum = null; 
				// Bitbucket #233 - May need to add this check when VB approvals are used. For now this code is only executed for PO transactions. So always copy the amort data.
				// Bitbucket #193 - check for special ignore flag
//				if (recResult.getValue('custbody_ignoreamortsched_cc') == 'T') {
//					subList[maxLine].curAmortSched = subList[maxLine].oldAmortSched = null;		
//					subList[maxLine].curAmortStart = subList[maxLine].oldAmortStart = null;
//					subList[maxLine].curAmortEnd = subList[maxLine].oldAmortEnd = null;	
//				} else {
					subList[maxLine].curAmortSched = subList[maxLine].oldAmortSched = recResult.getValue(amortSchedField);		
					subList[maxLine].curAmortStart = subList[maxLine].oldAmortStart = recResult.getValue(amortStartField);
					subList[maxLine].curAmortEnd = subList[maxLine].oldAmortEnd = recResult.getValue(amortEndField);	
					loadAmortRecord(subList[maxLine], subList[maxLine].curAmortSched, 'cur');
					loadAmortRecord(subList[maxLine], subList[maxLine].oldAmortSched, 'old');
//				}
//				if (recResult.getValue('custbody_ignoreamortsched_cc', 'appliedtotransaction') == 'T') {
//					subList[maxLine].appliedAmortSched = null;	
//					subList[maxLine].appliedAmortStart = null;		
//					subList[maxLine].appliedAmortEnd = null;										
//				} else {
					subList[maxLine].appliedAmortSched = recResult.getValue('custcol_poamortid_pbc', 'appliedtotransaction');	
					subList[maxLine].appliedAmortStart = recResult.getValue('custcol_poamortstart_pbc', 'appliedtotransaction');		
					subList[maxLine].appliedAmortEnd = recResult.getValue('custcol_poamortend_pbc', 'appliedtotransaction');		
					loadAmortRecord(subList[maxLine], subList[maxLine].appliedAmortSched, 'applied');
//				}			
				calcAmortStartEnd(subList[maxLine], 'old');				
				calcAmortStartEnd(subList[maxLine], 'cur');				
				calcAmortStartEnd(subList[maxLine], 'applied');				
				errmsg = 'Amort search results = ' + subList[maxLine].curAmortSched + ':' + subList[maxLine].oldAmortSched +  ':' + subList[maxLine].appliedAmortSched
					+ ' start = ' + subList[maxLine].curAmortStart + ':' + subList[maxLine].oldAmortStart +  ':' + subList[maxLine].appliedAmortStart
					+ ' end = ' + subList[maxLine].curAmortEnd + ':' + subList[maxLine].oldAmortEnd +  ':' + subList[maxLine].appliedAmortEnd
					+ ' recur = ' + subList[maxLine].curRecurType + ':' + subList[maxLine].oldRecurType +  ':' + subList[maxLine].appliedRecurType;
				nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);				

				// When a PR gets submitted for approval, it appears that the record type is changed to caps.
				if (rectype.toLowerCase() == 'purchaserequisition') {
					subList[maxLine].curAmount = subList[maxLine].oldAmount = estAmount;				
				} else {
					subList[maxLine].curAmount = subList[maxLine].oldAmount = amount;
				}

				errmsg = 'Line[' + k + '] amount = ' + subList[maxLine].curAmount + ' account type = ' + accountType;
				for (var i = 0; i < budgets.segmentMapResults.length; i++) {
					var result = budgets.segmentMapResults[i];
					var colValueFieldName = result.getValue('custrecord_columnname_pbc');
					var colTextFieldName = result.getValue('custrecord_columnname_pbc') + 'Text';
					var hierarchyResultFieldName = result.getValue('custrecord_budgethierarchy_pbc');
					var lookupFieldName = result.getValue('custrecord_listname_pbc');
					var excludeFieldName = result.getValue('custrecord_excludename_pbc');
					var budgetFlagField = result.getValue('custrecord_budlvlname_pbc');
					var effSegment = null;
					var budgetResult = null;					
					var unifiedFlag = result.getValue('custrecord_unifiedsegid_pbc');
					
					switch (colValueFieldName) {
					// must hardcode for custom project field. This is a tran boday field and only shows up on mainline
					case 'customer':
						effSegment = recResult.getValue('entity');
						effSegmentText = recResult.getText('entity');
						if (effSegment == null) {
							effSegment = recResults[0].getValue('custbody_projectid_cc');			
							effSegmentText = recResults[0].getText('custbody_projectid_cc');												
						}										
						break;
					case 'account':				// there is no header level account to use
						effSegment = recResult.getValue(colValueFieldName);
						effSegmentText = recResult.getText(colValueFieldName);
						break;
					default:
						if (unifiedFlag == 'T') {
							effSegment = recResult.getValue('line.' + colValueFieldName);
							effSegmentText = recResult.getText('line.' + colValueFieldName);
						} else {
							effSegment = recResult.getValue(colValueFieldName);
							effSegmentText = recResult.getText(colValueFieldName);							
						}
						if (effSegment == null) {			// when line result is blank, use header which is line 0
							effSegment = recResults[0].getValue(colValueFieldName);
							effSegmentText = recResults[0].getText(colValueFieldName);
						}											
					}
					if (effSegment == '') {
						effSegment = null;
						effSegmentText = '';
					}
					subList[maxLine]['cur'+colValueFieldName] = subList[maxLine]['old'+colValueFieldName] = effSegment;
					subList[maxLine]['cur'+colTextFieldName] = subList[maxLine]['old'+colTextFieldName] = effSegmentText;
					if (hierarchyResultFieldName != '' && hierarchyResultFieldName != null ) {
						budgetResult = getBudgetLevelId(lookupFieldName, excludeFieldName, budgetFlagField, effSegmentText, budgets[hierarchyResultFieldName]);
						subList[maxLine]['curbudget'+colValueFieldName] = subList[maxLine]['oldbudget'+colValueFieldName] = budgetResult[lookupFieldName];
						subList[maxLine]['curbudget'+colTextFieldName] = subList[maxLine]['oldbudget'+colTextFieldName] = budgetResult[lookupFieldName+'Text'];
					} else {
						subList[maxLine]['curbudget'+colValueFieldName] = subList[maxLine]['oldbudget'+colValueFieldName] = null;
						subList[maxLine]['curbudget'+colTextFieldName] = subList[maxLine]['oldbudget'+colTextFieldName] = '';					
					}
					if (subList[maxLine]['curbudget'+colValueFieldName] == -1) {
						skipLine = true;
					} else {
						switch (result.getValue('custrecord_linksegment_pbc')) {
						case '2':				// For use current, the previous lines have already calculate the budget level
							if (budgetResult != null) {							
								subList[maxLine]['curparent'+colValueFieldName] = subList[maxLine]['oldparent'+colValueFieldName] = budgetResult[lookupFieldName];
								subList[maxLine]['curparent'+colTextFieldName] = subList[maxLine]['oldparent'+colTextFieldName] = budgetResult[lookupFieldName+'Text'];
							} else {
								subList[maxLine]['curparent'+colValueFieldName] = subList[maxLine]['oldparent'+colValueFieldName] = subList[maxLine]['old'+colValueFieldName]
								subList[maxLine]['curparent'+colTextFieldName] = subList[maxLine]['oldparent'+colTextFieldName] = subList[maxLine]['old'+colTextFieldName];	
							}
							break;			
						case '3':			// use the parent level value, strip the lowest value of the segment. then call budgetlevel function again
							if (budgetResult != null) {							
								var lastIdx = budgetResult[lookupFieldName+'Text'].lastIndexOf(':');			// 8-30-21 - Since account number screws up the parent budgetlevel, use the budgetresult from previous lookup
								var temp = budgetResult[lookupFieldName+'Text'].substr(0,lastIdx-1);
								temp = temp.trim();
								budgetResult = getBudgetLevelId(lookupFieldName, excludeFieldName, budgetFlagField, temp, budgets[hierarchyResultFieldName]);
								subList[maxLine]['curparent'+colValueFieldName] = subList[maxLine]['oldparent'+colValueFieldName] = budgetResult[lookupFieldName];
								subList[maxLine]['curparent'+colTextFieldName] = subList[maxLine]['oldparent'+colTextFieldName] = budgetResult[lookupFieldName+'Text'];	
							} else {				// this case should not appear if the configuration is done correctly.
								subList[maxLine]['curparent'+colValueFieldName] = subList[maxLine]['oldparent'+colValueFieldName] = subList[maxLine]['old'+colValueFieldName]
								subList[maxLine]['curparent'+colTextFieldName] = subList[maxLine]['oldparent'+colTextFieldName] = subList[maxLine]['old'+colTextFieldName];											
							}
							break;
						default:					// this segment is NOT to be used in the parent query
							subList[maxLine]['curparent'+colValueFieldName] = subList[maxLine]['oldparent'+colValueFieldName] = null;
							subList[maxLine]['curparent'+colTextFieldName] = subList[maxLine]['oldparent'+colTextFieldName] = '';						
						}
						if (subList[maxLine]['curparent'+colValueFieldName] == -1) {
							skipLine = true;
						}
					
					}
					errmsg += ' [' + colValueFieldName + '] = ' 
						+ subList[maxLine]['cur'+colValueFieldName] + ' ' + subList[maxLine]['cur'+colTextFieldName]
						+ ' budget level = ' + subList[maxLine]['curbudget'+colValueFieldName] + ' ' + subList[maxLine]['curbudget'+colTextFieldName] 
						+ ' parent level = '+ subList[maxLine]['curparent'+colValueFieldName] + ' ' + subList[maxLine]['curparent'+colTextFieldName];
//					if (subList[maxLine]['curbudget'+colValueFieldName] == -1 || subList[maxLine]['curparent'+colValueFieldName]) {
//						skipLine = true;
//					}
				}
				nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);				
				if (skipLine || recResult.getValue('closed') == 'T') {
					if (skipLine) {
						errmsg = 'Skipped line [' + k + '] due to excluded budget level value.';
					} else {
						errmsg = 'Skipped line [' + k + '] due to the line being closed.';
					}
					nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);	
					continue;
				}
				if (recResult.getValue('appliedtotransaction') != null && recResult.getValue('appliedtotransaction') != '' && appliedResults != null) {
					if (appliedResults == null) {			// applied results can be null for blanket PO and still have applied to value filled in.
						subList[maxLine].appliedTranId = null;
						subList[maxLine].appliedAmount = 0.0;
					} else {
						for (var i = 0; i < appliedResults.length; i++) {
							appliedResult = appliedResults[i];
							if (appliedResult.getId() == recResult.getValue('appliedtotransaction')) {
								subList[maxLine].appliedTranId = appliedResult.getId();
								subList[maxLine].appliedLineId = recResult.getValue('line', 'appliedtotransaction');
//								subList[maxLine].appliedAmount = Math.abs(parseFloat(recResult.getValue('amount', 'appliedtotransaction')));
								subList[maxLine].appliedAmount = 0.0;
								subList[maxLine].transformFlag = true;
								if (currentContext.getFeature('multicurrency') == true) {
//									subList[maxLine].appliedAmount = Math.abs(parseFloat(recResult.getValue('fxamount', 'appliedtotransaction')))
//										* Math.abs(parseFloat(recResult.getValue('exchangerate', 'appliedtotransaction')));
									subList[maxLine].appliedExchangeRate = Math.abs(parseFloat(recResult.getValue('exchangerate', 'appliedtotransaction')));
									if (appliedRectype == 'purchaserequisition'){				// Bitbucket #234
										if (currentContext.getSetting('SCRIPT', 'custscript_bconeworldflag_cc') == 'T') {			// Bitbucket #234 - Save sub currency for PR exchange rate calculation
											errmsg = 'PR search applied exchange rate calc currency = ' + recResult.getValue('currency') + ' sub cur = ' + recResult.getValue('currency', 'subsidiary')
												+ ' eff date = ' + appliedResult.getValue('custbody_budgetdate_cc');
											nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);
											
											subList[maxLine].appliedExchangeRate = nlapiExchangeRate(recResult.getValue('currency'), recResult.getValue('currency', 'subsidiary'), 
													appliedResult.getValue('custbody_budgetdate_cc'));
											errmsg += ' exchange rate = ' + subList[maxLine].appliedExchangeRate;
											nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);
										} else {
											var compCurrency = companyConfig.getFieldValue('basecurrency');
											subList[maxLine].appliedExchangeRate = nlapiExchangeRate(recResult.getValue('currency'), compCurrency);
											errmsg = 'Company level currency = ' + compCurrency + ' ' + companyConfig.getFieldText('basecurrency') 
												+ ' applied tran cur = ' + recResult.getValue('currency') + ' new exchangerate = ' + subList[maxLine].appliedExchangeRate;
											nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);
										}

									}
									subList[maxLine].appliedAmount = Math.abs(parseFloat(recResult.getValue('fxamount', 'appliedtotransaction')))
										* subList[maxLine].appliedExchangeRate;
								} else {
									subList[maxLine].appliedAmount = Math.abs(parseFloat(recResult.getValue('amount', 'appliedtotransaction')));
								}
								if (isNaN(subList[maxLine].appliedAmount))
									subList[maxLine].appliedAmount = 0.0;			
								errmsg = 'TRANSFORM APPLIED: amount = ' + subList[maxLine].appliedAmount;
								for (var m = 0; m < budgets.segmentMapResults.length; m++) {
									var result = budgets.segmentMapResults[m];
									var name = result.getValue('name');
									var nameText = result.getValue('name') + 'Text';
									var colValueFieldName = result.getValue('custrecord_columnname_pbc');
									var colTextFieldName = result.getValue('custrecord_columnname_pbc') + 'Text';
									var hierarchyResultFieldName = result.getValue('custrecord_budgethierarchy_pbc');
									var lookupFieldName = result.getValue('custrecord_listname_pbc');
									var excludeFieldName = result.getValue('custrecord_excludename_pbc');
									var budgetFlagField = result.getValue('custrecord_budlvlname_pbc');
									var unifiedFlag = result.getValue('custrecord_unifiedsegid_pbc');
									var effSegmentText = '';
									var effSegment = null;
									var budgetResult = null;
									// must hardcode for custom project field. This is a tran boday field and only shows up on mainline
									if (colValueFieldName == 'customer') {
										effSegment = recResult.getValue('entity', 'appliedtotransaction');
										effSegmentText = recResult.getText('entity', 'appliedtotransaction');
										if (effSegment == null) {
											effSegment = appliedResult.getValue('custbody_projectid_cc');			
											effSegmentText = appliedResult.getText('custbody_projectid_cc');												
										}										
									} else {
										if (unifiedFlag == 'T') {
											effSegment = recResult.getValue('line.' + colValueFieldName, 'appliedtotransaction');
											effSegmentText = recResult.getText('line.' + colValueFieldName, 'appliedtotransaction');				
										} else {
											effSegment = recResult.getValue(colValueFieldName, 'appliedtotransaction');
											effSegmentText = recResult.getText(colValueFieldName, 'appliedtotransaction');										
										}
										if (effSegment == null) {			// use the header level from the applied search result. 
											effSegment = appliedResult.getValue(colValueFieldName);
											effSegmentText = appliedResult.getText(colValueFieldName);
										}											
									}
									
									if (effSegment == '') {
										effSegment = null;
										effSegmentText = '';
									}
									subList[maxLine]['applied'+colValueFieldName] = effSegment;
									subList[maxLine]['applied'+colTextFieldName] = effSegmentText;
									if (hierarchyResultFieldName != '' && hierarchyResultFieldName != null ) {
										budgetResult = getBudgetLevelId(lookupFieldName, excludeFieldName, budgetFlagField, effSegmentText, budgets[hierarchyResultFieldName]);
										subList[maxLine]['appliedbudget'+colValueFieldName] = budgetResult[lookupFieldName];
										subList[maxLine]['appliedbudget'+colTextFieldName] = budgetResult[lookupFieldName+'Text'];
									} else {
										subList[maxLine]['appliedbudget'+colValueFieldName] = null;
										subList[maxLine]['appliedbudget'+colTextFieldName] = '';					
									}
									switch (result.getValue('custrecord_linksegment_pbc')) {
									case '2':				// For use current, the previous lines have already calculate the budget level
										if (budgetResult != null) {							
											subList[maxLine]['appliedparent'+colValueFieldName] = budgetResult[lookupFieldName];
											subList[maxLine]['appliedparent'+colTextFieldName] = budgetResult[lookupFieldName+'Text'];
										} else {
											subList[maxLine]['appliedparent'+colValueFieldName] = effSegment;
											subList[maxLine]['appliedparent'+colTextFieldName] = effSegmentText;
										}
										break;			
									case '3':			// use the parent level value, strip the lowest value of the segment. then call budgetlevel function again
										if (budgetResult != null) {							
											var lastIdx = budgetResult[lookupFieldName+'Text'].lastIndexOf(':');			// 8-30-21 - Since account number screws up the parent budgetlevel, use the budgetresult from previous lookup
											var temp = budgetResult[lookupFieldName+'Text'].substr(0,lastIdx-1);
											temp = temp.trim();
											budgetResult = getBudgetLevelId(lookupFieldName, excludeFieldName, budgetFlagField, temp, budgets[hierarchyResultFieldName]);
											subList[maxLine]['appliedparent'+colValueFieldName] = budgetResult[lookupFieldName];
											subList[maxLine]['appliedparent'+colTextFieldName] = budgetResult[lookupFieldName+'Text'];	
										} else {		// this case should not appear if the configuration is done correctly.
											subList[maxLine]['appliedparent'+colValueFieldName] = effSegment;
											subList[maxLine]['appliedparent'+colTextFieldName] = effSegmentText;													
										}
										break;
									default:			// this segment is NOT to be used in the parent query
										subList[maxLine]['appliedparent'+colValueFieldName] = null;
										subList[maxLine]['appliedparent'+colTextFieldName] = '';						
									}
	
									errmsg += ' [' + colValueFieldName + '] = ' 
										+ subList[maxLine]['applied'+colValueFieldName] + ' ' + subList[maxLine]['applied'+colTextFieldName]
										+ ' budget = ' + subList[maxLine]['appliedbudget'+colValueFieldName] + ' ' + subList[maxLine]['appliedbudget'+colTextFieldName];
								}
								nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);
	
								break;
							}			// end applied record ID match if statement
						}			// end applied for loop
					}			
				}					// end not-null applied if statement
				maxLine++;
			}							// end recresults loop
			if (maxLine == 0) {
				errmsg = 'No expense lines were detected on this transaction = ' + recResults[0].getValue('tranid');
				nlapiLogExecution('DEBUG', 'PBC Transaction After Submit', errmsg);
				return;		
			}
		} else {			// the user edited the transaction in a session and there is an old and new record to work with

			switch (rectype) {
			case 'vendorbill':
				if (approvalStatus == 'VB Approved From PO' || approvalStatus == 'VB Pending From PO') {
					// load in the applied PO as the old record. This will force all of the CRUD flags to READ. 
					// We don't care about INSERT or DELETE as these changes won't be reflect on the PO.
					oldRecord = curRecord;
					maxLine = populateSubList(subList, 0, curRecord, oldRecord, 'item', recResults, true, budgets);
					maxLine = populateSubList(subList, maxLine, curRecord, oldRecord, 'expense', recResults, true, budgets);
				} else {
					maxLine = populateSubList(subList, 0, curRecord, oldRecord, 'item', recResults, false, budgets);
					maxLine = populateSubList(subList, maxLine, curRecord, oldRecord, 'expense', recResults, false, budgets);					
				}
				break;
			case 'purchaseorder':
				if (approvalStatus == 'PO Approved From PR' || approvalStatus == 'PO Pending From PR') {
					// load in the applied PR as the old record. This will force all of the CRUD flags to READ. 
					// We don't care about INSERT or DELETE as these changes won't be reflect on the PR.
					oldRecord = curRecord;
					maxLine = populateSubList(subList, 0, curRecord, oldRecord, 'item', recResults, true, budgets);
					if (featureConfig.getFieldValue('poexpenses') == 'T')			// for PO the expense sublist is an accounting preference
						maxLine = populateSubList(subList, maxLine, curRecord, oldRecord, 'expense', recResults, true, budgets);
				} else {
					maxLine = populateSubList(subList, 0, curRecord, oldRecord, 'item', recResults, false, budgets);
					if (featureConfig.getFieldValue('poexpenses') == 'T')
						maxLine = populateSubList(subList, maxLine, curRecord, oldRecord, 'expense', recResults, false, budgets);					
				}
				break;
			default:
				maxLine = populateSubList(subList, 0, curRecord, oldRecord, 'item', null, false, budgets);
				maxLine = populateSubList(subList, maxLine, curRecord, oldRecord, 'expense', null, false, budgets);
			}
			
			
		}

		if (type == 'delete') {			// null out the record ID for deleted transactions to maintain referential integrity for budget activity
			for (var i = 0; i < subList.length; i++) {
				subList[i].recId = null;
			}
		}
		errmsg = 'budgets data = ' + budgets.budgetDate + ' budgets found = ' + budgets.budgetDefnResults.length ;
//		budgets.searchBudgetLedger();
//		
//		if (budgets.ledgerResults == null) {
//			errmsg = 'NO budget definitions ledgers could be found!';
//			nlapiLogExecution('ERROR', 'PBC Transaction After Submit', errmsg);
//			return false;
//		} 
//		errmsg += ' ' + budgets.ledgerResults.length;
		nlapiLogExecution('DEBUG', 'PO Transaction After Submit', errmsg);
	
		// now update the actual budget ledger records and budget activities with the sublist data. 
		// for large transactions, schedule the job to process later.
		if (maxLine < bigSubListLength) {
			for (var j = 0; j < maxLine; j++) {
					budgets.maintainBudgetLedger(subList[j], approvalStatus);
			}		// end sublist for loop
			errmsg = 'Small PO end function governance = ' + currentContext.getRemainingUsage();
			nlapiLogExecution('DEBUG', 'PBC PO Transaction After Submit', errmsg);
			// Bitbucket #361 - Pause processing so that subsequent transactions can load in the latest ledger data. This was due to duplicate ledgers being created. 
			// This only occurs for transactions of length 1. 
			if (currentContext.getExecutionContext() == 'csvimport' && rectype == 'expensereport') {		 
				var date = new Date();
				var curDate = null;
				do { 
					  curDate = new Date(); 
				}	  while(curDate - date < 2000);
			}

		} else {
			// only call scheduled script for large data volumes.
			scheduleBigAssTransaction(subList, approvalStatus, budgetDate);
		}

		
	}		// edit type if statement
}		// end POtranaftersubmit function

