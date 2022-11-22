/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record'],
    /**
   * @param{search} search
   */
    (search, record) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (context) => {
            
            
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
            log.audit({ title: 'Context Value', details: context.oldRecord });
            /*Valida apenas se permanece o valor do campo igual. */
            if (context.oldRecord) {
                if (context.oldRecord.getValue('custrecord_rsc_atualizado_und_junix') == context.newRecord.getValue('custrecord_rsc_atualizado_und_junix')) {
                    if (context.type !== context.UserEventType.DELETE) {
                        context.newRecord.setValue('custrecord_rsc_atualizado_und_junix', false);
                        context.newRecord.setValue('custrecord_rsc_id_unidade_junix', context.newRecord.id);
                    }
                }
            } else {
                context.newRecord.setValue('custrecord_rsc_atualizado_und_junix', false);
                context.newRecord.setValue('custrecord_rsc_id_unidade_junix', context.newRecord.id);
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (context) => {
            var recorde = record.load({
                type:'customrecord_rsc_unidades_empreendimento',
                id: context.newRecord.id
            })
            recorde.setValue('custrecord_rsc_id_unidade_junix', context.newRecord.id);
            recorde.save()
        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });
