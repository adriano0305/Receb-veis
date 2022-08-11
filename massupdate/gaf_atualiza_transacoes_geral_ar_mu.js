/**
 *@NApiVersion 2.1
*@NScriptType MassUpdateScript
*/
define(['N/log', 'N/record'], function(log, record) {
const each = (params) => {
    try {
        log.audit('params', params);

        // const loadReg = record.load({type: params.type, id: params.id, isDynamic: true});

        // loadReg.save({ignoreMandatoryFields: true});

        // for (i=0; i<loadReg.getLineCount('links'); i++) {
        //     var id = loadReg.getSublistValue('links', 'id', i);
        //     record.delete({type: 'customerpayment', id: id});
        // }

        record.delete({type: params.type, id: params.id});

        log.audit('Excluído!', {params: params});
    } catch(e) {
        log.error(params.id, e);
        if (e.name == 'RCRD_DSNT_EXIST') {
            record.delete({type: params.type, id: params.id});
        }
    }
}

return {
    each: each
}
});
