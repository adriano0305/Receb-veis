/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
*/
define(['N/record','N/search','N/runtime'],
	function(record, search, runtime){

		//create reference to lists we want to control via client side script
		var REC;
		var BODY_FIELD_LIST = ["duedate"];
		// var ITEM_FIELD_LIST = ["item","quantity","description","amount","rate","price","class","taxcode","options"];
        // var ADMIN_ROLES = [3,1063];

		function pageInit(context) {

        	REC = context.currentRecord;

        	if (!REC.id)
        		return;
        	
        	// if (ADMIN_ROLES.indexOf(runtime.getCurrentUser().role) >= 0)
        	// 	return;

        	//spin through the list of fields we want to disable
        	for (var f in BODY_FIELD_LIST) {
        		nsDisableField(context, null, BODY_FIELD_LIST[f]);
        	}

        	// for (var f in ITEM_FIELD_LIST) {
        		
        	// 	nsDisableField(context, "item", ITEM_FIELD_LIST[f]);
        	// }

		}
				
		/* ----------------------------------------------------------------------------------------------------------------------------- */

		function nsDisableField(context,formId,fieldId,lineNbr){
			try {
				
				var fld;
				
				//using DOM referencing and NetSuite supplied functions, find the field and disable it
				if (formId) {
					fld = getFormElement(document.forms[formId+"_form"],getFieldName(fieldId));
					if (fld == null)
						fld = getFormElement( document.forms[formId+'_form'], getFieldName(fieldId)+lineNbr);
				}
				else
					fld = getFormElement(document.forms["main_form"],getFieldName(fieldId));
				
				if (isSelect(fld)){
					disableSelect(fld,false);				
				} else {
				    disableField(fld,false);
				}

				fld = REC.getField(fieldId);
				if (fld) {
					fld.isDisabled = false;
				}
			} catch (e) {
				;
			}
			
		}

    return {
        pageInit: pageInit
    };
    
});