/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
*/

const opcoes = {
    enableSourcing: true,
    ignoreMandatoryFields: true    
}

define(['N/log', 'N/record', 'N/search'], function(log, record, search) {
function atualizar_linhas_transacao(tipo, idInterno) {
    const loadReg = record.load({type: tipo, id: idInterno});

    var valorNF = loadReg.getValue('usertotal');
    var total_pago_nf = loadReg.getValue('custbody_rsc_total_pago_nf');
    var valor_restante_nf = loadReg.getValue('custbody_valor_restante_nf');

    var linhaDespesas = loadReg.getLineCount('expense');

    if (linhaDespesas > 0) {
        for (ld=0; ld<linhaDespesas; ld++) {
            var valor = loadReg.getSublistValue('expense', 'amount', ld);
            var valor_pago_linha = (total_pago_nf / valorNF) * valor;
            var valor_restante_linha = (valor_restante_nf / valorNF) * valor;

            loadReg.setSublistValue('expense', 'custcol_rsc_valor_pago_linha', ld, valor_pago_linha)
            .setSublistValue('expense', 'custcol_rsc_valor_restante_linha', ld, valor_restante_linha);
        }
    }

    var linhaItens = loadReg.getLineCount('item');    

    if (linhaItens > 0) {
        for (li=0; li<linhaItens; li++) {
            var valor = loadReg.getSublistValue('item', 'amount', li);
            var valor_pago_linha = (total_pago_nf / valorNF) * valor;
            var valor_restante_linha = (valor_restante_nf / valorNF) * valor;

            loadReg.setSublistValue('item', 'custcol_rsc_valor_pago_linha', li, valor_pago_linha)
            .setSublistValue('item', 'custcol_rsc_valor_restante_linha', li, valor_restante_linha);
        }
    }

    try {
        loadReg.save(opcoes);
        log.audit('atualizar_linhas_transacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno});
    } catch (e) {
        log.error('atualizar_linhas_transacao', {status: 'Erro', tipo: tipo, idInterno: idInterno, msg: e});
    }
}

function somatorioPagamentos(idInterno) {
    var bscPagtos = search.create({type: "transaction",
        filters:
        [
           ["type","anyof","VendPymt","VendCred"], "AND", 
           ["appliedtotransaction","anyof",idInterno]
        ],
        columns: [
            search.createColumn({name: "datecreated", sort: search.Sort.ASC, label: "Data de criação"}),
            "internalid","type","tranid","total"
        ]
    }).run().getRange(0,1000);
    log.audit('bscPagtos', bscPagtos);

    var sp = 0;

    if (bscPagtos.length > 0) {
        for (var prop in bscPagtos) {
            if (bscPagtos.hasOwnProperty(prop)) {
                var tipo = bscPagtos[prop].getValue('type');
                
                var loadReg = record.load({
                    type: tipo == 'VendPymt' ? 'vendorpayment' : 'vendorcredit',
                    id: bscPagtos[prop].getValue('internalid')
                });

                var linhaAplicada = loadReg.findSublistLineWithValue('apply', 'internalid', idInterno);

                if (linhaAplicada != -1) {
                    sp += loadReg.getSublistValue('apply', 'total', linhaAplicada);
                }  
            }
        }
    }

    return sp;
}

function atualizarTransacao(tipo, idInterno, valores) {
    log.audit('Valores: ', valores)
    record.submitFields({type: tipo,
        id: idInterno,
        values: valores,
        options: opcoes        
    });
    log.audit('atualizarTransacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, valores: valores});
}

const beforeLoad = (context) => {
    
}

const beforeSubmit = (context) => {
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
}

const afterSubmit = (context) => {
    log.audit('afterSubmit', context);

    const novoRegistro = context.newRecord;
    const transacao = novoRegistro.type;
    const tipo = context.type;
    var camposVendorbill = {}     
    var campos = {};

    switch(transacao) {
        case 'vendorbill': 
            if (tipo == 'create' || tipo == 'edit') {
                if (novoRegistro.id) {
                    var recebimentoFisico = novoRegistro.getValue('custbody_rsc_recebimento_fisico'); // ID Recebimento de Item

                    if (recebimentoFisico) {
                        campos.custbody_rsc_link_fatura_fornecedor = novoRegistro.id;

                        atualizarTransacao('itemreceipt', recebimentoFisico, campos);

                        if(tipo == 'create') camposVendorbill.custbody_rsc_data_criacao = new Date()
                        atualizarTransacao(transacao, novoRegistro.id, camposVendorbill);
                    }  
                    
                    var status = novoRegistro.getText('status');

                    if (status == 'Pago integralmente' || status == 'Paid In Full') {
                        campos.custbody_rsc_etapa_requisicao = 112; // (Etapa da Transação: Pago)
                    }

                    var valorNF = novoRegistro.getValue('usertotal');
                    var totalPagtos = somatorioPagamentos(novoRegistro.id);

                    campos.custbody_rsc_total_pago_nf = totalPagtos;
                    campos.custbody_valor_restante_nf = totalPagtos > 0 ? valorNF - Math.abs(totalPagtos): valorNF;
                                    
                    atualizarTransacao(transacao, novoRegistro.id, campos);  
                    atualizar_linhas_transacao(transacao, novoRegistro.id);
                    
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
}

return {
    // beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
}
});