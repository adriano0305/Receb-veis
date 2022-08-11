/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/log', 'N/record', 'N/search', 'N/task'], (log, record, search, task) => {
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

const taskLancamentos = (dados) => {
    var scriptTask = task.create({
        taskType: task.TaskType.SCHEDULED_SCRIPT,
        scriptId: 1534,                                
        params: {
            custscript_rsc_journal_entries: dados
        }
    });
    log.audit('scriptTask', scriptTask);

    var scriptTaskId = scriptTask.submit();
    log.audit('task', {scriptTaskId: scriptTaskId, scriptTask: scriptTask});
}

const conta = (numero) => {
    var bscConta = search.create({type: "account",
        filters: [
           ["number","is",numero]
        ],
        columns: [
            "name","number"
        ]
    }).run().getRange(0,1);
    // log.audit('bscConta', bscConta);

    return bscConta[0].id;
}

const unidadeCorrecao = (itemId) => {
    var bscUC = search.create({type: "customrecord_rsc_correction_unit",
        filters: [
           ["custrecord_rsc_ucr_calc_base_item","anyof",itemId]
        ],
        columns: [
            "internalid","name"
        ]
    }).run().getRange(0,1);
    // log.audit('bscUC', bscUC);

    return bscUC.length;
}

const beforeLoad = (context) => {}

const beforeSubmit = (context) => {}

const afterSubmit = (context) => {
    log.audit('afterSubmit', context);
    
    const novoRegistro = context.newRecord;

    const status = novoRegistro.getValue('status');

    if (novoRegistro.id) {
        var loadPag = record.load({type: 'customerpayment', id: novoRegistro.id});

        var linhaApply = loadPag.findSublistLineWithValue('apply', 'apply', 'T');

        var internalid = loadPag.getSublistValue('apply', 'internalid', linhaApply);
        var tipo = loadPag.getSublistValue('apply', 'type', linhaApply);
        
        if (tipo == 'Fatura' || tipo == 'Invoice') {
            var loadReg = record.load({type: 'invoice', id: internalid});

            var fracaoPrincipal = 0;
            var correcaoMonetaria = 0;
            var transitoriaRecebimento = 0;
            var apropriacao = [];

            var i = 0;

            while (i < loadReg.getLineCount('item')) {               
                var item = loadReg.getSublistValue('item', 'item', i);
                var amount = loadReg.getSublistValue('item', 'amount', i);

                // Fração Principal
                if (item == 28650) {
                    fracaoPrincipal += amount;
                } else {
                    // Correção Monetária
                    var cm = unidadeCorrecao(item);
                    if (cm > 0) {
                        correcaoMonetaria += amount;
                    }
                }

                i++;
            }

            // if (correcaoMonetaria > 0) {
                transitoriaRecebimento = correcaoMonetaria + fracaoPrincipal;
                
                apropriacao.push({
                    acao: 'create',
                    transacao: 'customerpayment',
                    memo: 'Apropriação',
                    subsidiary: novoRegistro.getValue('subsidiary'),
                    custbody_rsc_projeto_obra_gasto_compra: loadReg.getValue('custbody_rsc_projeto_obra_gasto_compra'),
                    custbody_ref_parcela: loadPag.id,
                    custbody_lrc_fatura_principal: internalid,
                    custbody_rsc_empproj_securitizado: false,
                    line: [{
                        account: conta('2811030100'), // APROPRIAÇÃO RECEITA IMOBILIÁRIA FISCAL - ACUMULADO
                        debit: fracaoPrincipal,
                        memo: 'Apropriação',
                        entity: loadReg.getValue('entity'),
                        location: novoRegistro.getValue('location')
                    },
                    // ,{
                    //     account: conta('2811030200'), // APROPRIAÇÃO RECEITA IMOBILIÁRIA FISCAL - ACUM. CM
                    //     debit: correcaoMonetaria,
                    //     memo: 'Apropriação',
                    //     entity: loadReg.getValue('entity'),
                    //     location: novoRegistro.getValue('location')
                    // },
                    {
                        account: conta('2811020100'), // APROPRIAÇÃO RECEITA IMOBILIÁRIA FISCAL - MÊS
                        credit: transitoriaRecebimento,
                        memo: 'Apropriação',
                        entity: loadReg.getValue('entity'),
                        location: novoRegistro.getValue('location')
                    }]               
                });

                if (correcaoMonetaria > 0) {
                    apropriacao.line.push({
                        account: conta('2811030200'), // APROPRIAÇÃO RECEITA IMOBILIÁRIA FISCAL - ACUM. CM
                        debit: correcaoMonetaria,
                        memo: 'Apropriação',
                        entity: loadReg.getValue('entity'),
                        location: novoRegistro.getValue('location')
                    });
                }



                log.audit('apropriacao', apropriacao);
                taskLancamentos(apropriacao);
            // }
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
