/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/record'],
/**
 * @param{currentRecord} currentRecord
 * @param{search} search
 */
function(currentRecord, search, record) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    function buscarContratos(newRecId){

        debugger;
        //Check is is there a processing line 
        var scheduledscriptinstanceSearchObj = search.create({
            type: "scheduledscriptinstance",
            filters:
            [
               ["script.scriptid","is","customscript_gaf_seguro_prestamista_mr"], 
               "AND", 
               ["status","noneof","COMPLETE","FAILED","CANCELED"]
            ],
            columns:
            [
               search.createColumn({
                  name: "datecreated",
                  sort: search.Sort.ASC
               }),
               "startdate",
               "enddate",
               "queue",
               "status",
               "mapreducestage",
               "percentcomplete",
               "queueposition"
            ]
         });
         var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
         if(searchResultCount > 0){

            alert("No momento todas as filas para este processamento estão ocupadas, tente enviar novamente quando os processamentos anteriores já estiverem terminado")

         } else {

            record.submitFields({
                type: "customrecord_gaf_seguro_prestamista",
                id: newRecId,
                values: {
                    custrecord_gaf_seg_presta_status:6
                }            
            }) 
            location.reload()


         }
    }

    function getRecordData(newRecId) {

        return search.lookupFields({
            type: "customrecord_gaf_seguro_prestamista",
            id: newRecId,
            columns: [
                "custrecord_gaf_seg_presta_status",
                "custrecord_gaf_seg_presta_tx_seguro",
                "custrecord_gaf_seg_presta_iof", 
                "custrecord_gaf_seg_presta_perc_residual", 
                "custrecord_gaf_seg_presta_subsidiaria",
                "custrecord_gaf_seg_presta_periodo",
                "custrecord_gaf_seg_presta_periodo.startdate"
            ]
        })

    }
    function processar(newRecId){

        debugger;
        //Check is is there a processing line 
        var scheduledscriptinstanceSearchObj = search.create({
            type: "scheduledscriptinstance",
            filters:
            [
               ["script.scriptid","is","customscript_gaf_seguro_prest_pedidos_mr"], 
               "AND", 
               ["status","noneof","COMPLETE","FAILED","CANCELED"]
            ],
            columns:
            [
               search.createColumn({
                  name: "datecreated",
                  sort: search.Sort.ASC
               }),
               "startdate",
               "enddate",
               "queue",
               "status",
               "mapreducestage",
               "percentcomplete",
               "queueposition"
            ]
         });
         var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
         if(searchResultCount > 0){

            alert("No momento todas as filas para este processamento estão ocupadas, tente enviar novamente quando os processamentos anteriores já estiverem terminado")

         } else {

            record.submitFields({
                type: "customrecord_gaf_seguro_prestamista",
                id: newRecId,
                values: {
                    custrecord_gaf_seg_presta_status:9
                }            
            }) 
            location.reload()


         }

    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord,
        buscarContratos:buscarContratos,
        processar:processar
    };
    
});
