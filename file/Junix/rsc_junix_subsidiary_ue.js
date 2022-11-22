/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/https', 'N/runtime','N/record'], function(https, runtime,record) {

    function beforeLoad(context) {
        var newRecord = context.newRecord;
        newRecord.getField({
            fieldId:'legalname'
        }).isMandatory = true
        newRecord.getField({
            fieldId:'federalidnumber'
        }).isMandatory = true
    }

    function beforeSubmit(context) {
        /*Valida apenas se permanece o valor do campo igual. */
        if (context.oldRecord){
            if (context.oldRecord.getValue('custrecord_rsc_atualizado_spe_junix') == context.newRecord.getValue('custrecord_rsc_atualizado_spe_junix')){
                if (context.type !== context.UserEventType.DELETE){
                    context.newRecord.setValue('custrecord_rsc_atualizado_spe_junix', false);
                    context.newRecord.setValue('custrecord_rsc_id_spe_junix', context.newRecord.id);
                }
            }
        }else {
            context.newRecord.setValue('custentity_rsc_atualizado_emp_junix', false);
            context.newRecord.setValue('custrecord_rsc_id_spe_junix', context.newRecord.id);
        }

    }

    function afterSubmit(context) {
        var recorde = record.load({
            type:'subsidiary',
            id: context.newRecord.id
        })
        recorde.setValue('custrecord_rsc_id_spe_junix', context.newRecord.id);
        recorde.save()
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
