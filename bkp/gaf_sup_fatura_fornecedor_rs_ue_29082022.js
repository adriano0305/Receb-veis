/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 *@Author Rafael Oliveira
*/

const opcoes = {
    enableSourcing: true,
    ignoreMandatoryFields: true    
}

define(['N/record', 'N/search'], function(record, search) {
function atualizarTransacao(tipo, idInterno, valores) {
    record.submitFields({type: tipo,
        id: idInterno,
        values: valores,
        options: opcoes        
    });
    log.audit('atualizarTransacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, valores: valores});
}

const beforeLoad = (context) => {}

const beforeSubmit = (context) => {
    try {
        log.audit('beforeSubmit', context);

        const novoRegistro = context.newRecord;
        const transacao = novoRegistro.type;
        const tipo = context.type;

        var campos = {};

        if (tipo == 'delete') {
            for (i=0; i<novoRegistro.getLineCount('apply'); i++) {
                var objAplicado = {
                    internalid: novoRegistro.getSublistValue('apply', 'internalid', i),
                    trantype: novoRegistro.getSublistValue('apply', 'trantype', i),
                    type: novoRegistro.getSublistValue('apply', 'type', i)
                }                        
                log.audit('objAplicado', objAplicado);

                if (objAplicado.trantype == 'VendBill') {
                    campos.custbody_rsc_etapa_requisicao = 103; // (Etapa da Transação: Em pagamento)
                    atualizarTransacao('vendorbill', objAplicado.internalid, campos);
                }
            }  
    }
    } catch (error) {
        log.audit('error beforeSubmit', error)
    }
}

const afterSubmit = (context) => {
    try {
        log.audit('afterSubmit', context);
        const novoRegistro = context.newRecord;
        const transacao = novoRegistro.type;
        const tipo = context.type;

        var campos = {};

        switch(transacao) {
            case 'vendorbill': 
                if (tipo == 'create' || tipo == 'edit') {
                    if (novoRegistro.id) {
                        var recebimentoFisico = novoRegistro.getValue('custbody_rsc_recebimento_fisico'); // ID Recebimento de Item
                        if (recebimentoFisico) {
                            campos.custbody_rsc_link_fatura_fornecedor = novoRegistro.id;
                            atualizarTransacao('itemreceipt', recebimentoFisico, campos);
                        }  
                        
                        var status = novoRegistro.getText('status');

                        if (status == 'Pago integralmente' || status == 'Paid In Full') {
                            campos.custbody_rsc_etapa_requisicao = 112; // (Etapa da Transação: Pago)
                            atualizarTransacao('vendorbill', novoRegistro.id, campos);
                        }                    
                    }           
                }
            break;

            case 'vendorpayment': 
                if (tipo == 'create' || tipo == 'edit') {
                    if (novoRegistro.id) {
                        for (i=0; i<novoRegistro.getLineCount('apply'); i++) {
                            var objAplicado = {
                                internalid: novoRegistro.getSublistValue('apply', 'internalid', i),
                                trantype: novoRegistro.getSublistValue('apply', 'trantype', i),
                                type: novoRegistro.getSublistValue('apply', 'type', i)
                            }                        
                            log.audit('objAplicado', objAplicado);

                            if (objAplicado.trantype == 'VendBill') {
                                var dadosVB = search.lookupFields({type: 'vendorbill',
                                    id: objAplicado.internalid,
                                    columns: ['status']
                                });
                                log.audit('dadosVB', dadosVB);
                
                                if (dadosVB.status[0].text == 'Pago integralmente' || dadosVB.status[0].text == 'Paid In Full') {
                                    campos.custbody_rsc_etapa_requisicao = 112; // (Etapa da Transação: Pago)
                                    atualizarTransacao('vendorbill', objAplicado.internalid, campos);
                                }
                            }
                        }                    
                    }           
                }
            break;
        }    
    } catch (error) {
        log.audit('error afterSubmit', error)
    }
}

return {
    // beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
}
});
