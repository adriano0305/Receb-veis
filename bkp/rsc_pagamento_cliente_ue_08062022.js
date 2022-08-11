/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
const saldoContrato = (id, amountPaid) => {
    log.audit('saldoContrato', {id: id, amountPaid: amountPaid});

    var loadReg = record.load({type: 'invoice', id: id, isDynamic: true});
    log.audit('loadReg', loadReg);

    const total = loadReg.getValue('total');

    var amount;

    loadReg.selectLine('item', 0);    

    var quantity = loadReg.getCurrentSublistValue('item', 'quantity');
    var rate = loadReg.getCurrentSublistValue('item', 'rate');  
    var discamount = loadReg.getCurrentSublistValue('item', 'custcol_enl_discamount');  

    if (!rate || rate == 0) {
        loadReg.setCurrentSublistValue('item', 'rate', total);
        amount = total - amountPaid;
    } else {
        amount = rate - amountPaid;
    }

    log.audit('amount: '+amount, 'discamount: '+discamount);

    if (!discamount || discamount == 0) {
        loadReg.setCurrentSublistValue('item', 'custcol_enl_discamount', amountPaid);
    } else {
        loadReg.setCurrentSublistValue('item', 'custcol_enl_discamount', discamount + amountPaid);
    }

    loadReg.setCurrentSublistValue('item', 'amount', amount);   

    loadReg.commitLine('item');

    try {
        loadReg.save();
    } catch(e) {
        log.error('Erro', e);
    }    
}

const startPlugin = (tipo, internalid) => {    
    record.load({type: tipo, id: internalid})
    .save({ignoreMandatoryFields: true});  
    log.audit('startPlugin', {status: 'Sucesso', tipo: tipo, internalid: internalid});
}

const beforeLoad = (context) => {}

const beforeSubmit = (context) => {}

const afterSubmit = (context) => {
    log.audit('afterSubmit', context);
    
    const novoRegistro = context.newRecord;

    const status = novoRegistro.getValue('status');

    if (novoRegistro.id) {
        for (i=0; i<novoRegistro.getLineCount('apply'); i++) {
            var internalid = novoRegistro.getSublistValue('apply', 'internalid', i);
            var tipoTransacao = novoRegistro.getSublistValue('apply', 'trantype', i);

            if (tipoTransacao == 'CustInvc') {
                var lkpFatura = search.lookupFields({type: 'invoice',
                    id: internalid,
                    columns: ['source']
                });
                // log.audit({tipoTransacao: tipoTransacao, internalid: internalid}, lkpFatura);

                if (lkpFatura.source[0] && lkpFatura.source[0].value == 'CSV') {
                    startPlugin(novoRegistro.type, novoRegistro.id);                    
                }
            }
        }

        // if (status == 'Depositado' || status == 'Deposited') {
        //     for (i=0; i<novoRegistro.getLineCount('apply'); i++) {
        //         var aplicado = novoRegistro.getSublistValue('apply', 'apply', i);
        //         var id = novoRegistro.getSublistValue('apply', 'internalid', i);
        //         var tipoTransacao = novoRegistro.getSublistValue('apply', 'trantype', i);
        //         var total = novoRegistro.getSublistValue('apply', 'amount', i);

        //         if (aplicado == true && tipoTransacao == 'CuTrSale') {
        //             log.audit(tipoTransacao, {aplicado: aplicado, id: id, total: total});

        //             var lookupFI = search.lookupFields({type: 'customsale_rsc_financiamento',
        //                 id: id,
        //                 columns: ['custbody_lrc_fatura_principal']
        //             }).custbody_lrc_fatura_principal;
        //             log.audit('lookupFI', lookupFI);

        //             saldoContrato(lookupFI[0].value, (total).toFixed(2));
        //         }
        //     }            
        // }
    }
}
 
return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
}
});
