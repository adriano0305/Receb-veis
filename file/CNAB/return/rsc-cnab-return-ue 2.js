/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @scriptName rsc-cnab-return-ue
 */
define([ 'N/log', 'N/task', 'N/runtime' ],

    /**
     * @function
     * @param log
     * @param task
     * @param runtime
     * @return {{beforeLoad: beforeLoad}}
     */
    function( log, task, runtime )
    {
        /**
         * @function
         * @param context
         */
        function afterSubmit( context )
        {
            try {
                if( context.UserEventType.CREATE === context.type )
                {
                    var record = context.newRecord;
                    var data = {
                        processingId: record.id,
                        layoutId: record.getValue({ fieldId: 'custrecord_rsc_cnab_rfp_layout_ls' }),
                        bankId: record.getValue({ fieldId: 'custrecord_rsc_cnab_rfp_bank_ls' }),
                        fileId: record.getValue({ fieldId: 'custrecord_rsc_cnab_rfp_file_ls' }),
                        userId: runtime.getCurrentUser().id
                    };
                    task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_rsc_cnab_return_mr',
                        deploymentId: 'customdeploy_rsc_cnab_return_mr',
                        params: { custscript_rsc_cnab_returndata_ds: JSON.stringify(data) }
                    }).submit();
                }
            } catch (e) {
                log.error( 'afterSubmit', e );
            }
        }

        return {
            afterSubmit: afterSubmit
        };
    }
);