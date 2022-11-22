/**
 * @NScriptType suitelet
 * @NApiVersion 2.1
 * @scriptName rsc-cnab-batch-st
 */
 define([ 'N/ui/serverWidget', './rsc_junix_call_api.js', 'N/task' ],

 function( ui, api, task )
 {
     function onRequest(context)
     {
        api.getRequest('MARCARCOMOPROCES_JUNIX/1.0/' + 15961)
     }
     return {
        onRequest: onRequest
    };
});   