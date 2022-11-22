/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
 define(['N/search', "N/ui/serverWidget"],
 /**
* @param{search} search
*/
 (search, serverWidget) => {
     /**
      * Defines the function definition that is executed before record is loaded.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @param {Form} scriptContext.form - Current form
      * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
      * @since 2015.2
      */
     const beforeLoad = (scriptContext) => {
        log.audit({title: 'Context Value', details: scriptContext.newRecord});
        /*Valida apenas se permanece o valor do campo igual. */
        var form = scriptContext.form
        var newRecord = scriptContext.newRecord;
        if(newRecord.getValue('custbody_rsc_comissao_relacionada')){
            form.getField({
                id:'custbody_rsc_contrato_relacionado'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN 
            });
        }
        if(newRecord.getValue('custbody_rsc_contrato_relacionado')){
            form.getField({
                id:'custbody_rsc_comissao_relacionada'
            }).updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN 
            });
        }
     }

     /**
      * Defines the function definition that is executed before record is submitted.
      * @param {Object} context
      * @param {Record} context.newRecord - New record
      * @param {Record} context.oldRecord - Old record
      * @param {string} context.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     const beforeSubmit = (context) => {
         
     }

     /**
      * Defines the function definition that is executed after record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     const afterSubmit = (scriptContext) => {


     }

     return {beforeLoad, beforeSubmit, afterSubmit}

 });
