/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/log','N/record','N/search', 'N/runtime', 'N/ui/serverWidget'], function(log,record,search,runtime, serverWidget) {
    var scriptName = "v_UE_SOLockdown.";
        
        //hard code the roles that will not get locked down
        var ADMIN_ROLES = [3,1063];

    function beforeLoad(context) {
        var funcName = scriptName + "beforeLoad";
        	
            //test record situation where we will perform lock
            if ((runtime.executionContext == runtime.ContextType.USER_INTERFACE) && (context.type == context.UserEventType.EDIT) && (context.newRecord.getValue("orderstatus") != "A")) {

            	
                if (ADMIN_ROLES.indexOf(runtime.getCurrentUser().role) >= 0)  {
                    return;  //exit the admin roles as specificed above
                }
                
            		
            	//get the list of fields available via NetSuite's library offer
                var REC = context.newRecord;
                var fieldList = REC.getFields();
            	
                //attack the fields that we can't get control of via NetSuite's standard field list lookup [don't know why; but get control anyways]
            	var OTHER_FIELDS = ["custbody_v_az_latest_ship_date","memo","otherrefnum"];
            	
	    		//spin through the lists and disable
	        	for (var i = 0; i < fieldList.length; i++) disableField(context, fieldList[i]); for (var f in OTHER_FIELDS) disableField(context, OTHER_FIELDS[f]); } } function disableField(context, fieldName) { var funcName = scriptName + "disableField " + fieldName; //create an exception list of fields that we do NOT want disabled var FIELDS_TO_EXCLUDE = ["custbody_v_order_notes"]; if (FIELDS_TO_EXCLUDE.indexOf(fieldName) >= 0){
        		return;
            }
        	
    		//get reference to the form field to disable it.
            var fld = context.form.getField(fieldName);
    		if (fld) {
				fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});	        				
        		log.debug(funcName, "Disabling field");        			
    		} else
    			log.debug(funcName, "Unable to get reference to field");
            }
    }

    function beforeSubmit(context) {
        
    }

    function afterSubmit(context) {
        
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
