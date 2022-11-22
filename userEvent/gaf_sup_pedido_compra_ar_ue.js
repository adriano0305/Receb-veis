/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
*/

const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/log', 'N/record', 'N/search'], function(log, record, search) {
const atualizar_linhas_pedido = (tipo, idInterno) => {
    // log.audit('atualizar_linhas_pedido', {tipo: tipo, idInterno: idInterno});

    var loadReg = record.load({type: tipo, id: idInterno});

    var numDoc = loadReg.getValue('tranid');

    var linhaDespesas = loadReg.getLineCount('expense');
    // log.audit(numDoc, linhaDespesas);

    for (i=0; i<linhaDespesas; i++) {
        var objDespesa = {
            departamento: loadReg.getSublistValue('expense', 'department', i),
            centroCusto: loadReg.getSublistValue('expense', 'class', i),
            nomeProjeto: loadReg.getSublistValue('expense', 'customer', i)
        }
        // log.audit('objDespesa', objDespesa);

        if (objDespesa.centroCusto && objDespesa.nomeProjeto) {
            log.audit(numDoc, {linhaDespesa: i, objDespesa: objDespesa, status: 'Limpar departamento'});
            loadReg.setSublistValue('expense', 'department', i, '');
        }
    }

    // Preencher o campo "Tratativas CSV" para não aparecer nas próximas execuções.
    loadReg.setValue('custbody_rsc_tratativas_csv', 'OK');

    try {
        loadReg.save(opcoes);
        log.audit('atualizar_linhas_pedido', {status: 'Sucesso', numDoc: numDoc});
    } catch (e) {
        log.audit('atualizar_linhas_pedido', {status: 'Erro', numDoc: numDoc, msg: e});
    }    
}

const atualizarTransacao = (tipo, idInterno, campos) => {
    // log.audit('atualizarTransacao', {tipo: tipo, idInterno: idInterno, campos: campos});

    record.submitFields({type: tipo,
        id: idInterno,
        values: campos,
        options: opcoes        
    });

    log.audit('atualizarTransacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, campos: campos});
}

const saldoLinha = (tipo, idInterno) => {
    var loadReg = record.load({type: tipo, id: idInterno});

    var linhaItens = loadReg.getLineCount('item');

    for (i=0; i<linhaItens; i++) {
        var quantidade = loadReg.getSublistValue('item', 'quantity', i);
        var recebido = loadReg.getSublistValue('item', 'quantityreceived', i);
        var taxa = loadReg.getSublistValue('item', 'rate', i);

        var sl = (quantidade - recebido) * taxa;
        log.audit(i, {quantidade: quantidade, recebido: recebido, taxa: taxa, sl: sl});

        loadReg.setSublistValue('item', 'custcol_rsc_saldo_linha', i, sl);
    }

    loadReg.save(opcoes);
    log.audit('saldoLinha', {status: 'Sucesso', tipo: tipo, idInterno: idInterno});
}

function beforeLoad(context) {
    log.audit('beforeLoad', context);

    const novoRegistro = context.newRecord;

    const tipo = context.type;

    var valores = {};

    if (tipo == 'view' && novoRegistro.id) {
        saldoLinha(novoRegistro.type, novoRegistro.id);

        var departamento = novoRegistro.getValue('department');
   
        if (!departamento) {
            var idRequisicao = novoRegistro.getValue('custbody_rsc_id_requisicao');
            // log.audit('idRequisicao', idRequisicao);

            var lkpRequisicao;

            if (idRequisicao) {
                lkpRequisicao = search.lookupFields({type: 'purchaserequisition',
                    id: idRequisicao,
                    columns: ['department']
                });
                // log.audit('lkpRequisicao', lkpRequisicao);

                if (lkpRequisicao.department.length > 0) {
                    valores.department = lkpRequisicao.department[0].value;
                }
            } else {
                var linhaItens = novoRegistro.getLineCount('item');

                for (i=0; i<linhaItens; i++) {
                    var pedidoVinculado = novoRegistro.getSublistValue('item', 'linkedorder', i);
                    log.audit('pedidoVinculado', pedidoVinculado);

                    if (pedidoVinculado.length > 0) {
                        lkpRequisicao = search.lookupFields({type: 'purchaserequisition',
                            id: pedidoVinculado,
                            columns: ['department']
                        });
                        // log.audit('lkpRequisicao', lkpRequisicao);

                        if (lkpRequisicao.department.length > 0) {
                            valores.department = lkpRequisicao.department[0].value;
                        }

                        valores.custbody_rsc_id_requisicao = pedidoVinculado;
                        break;
                    }
                }
            }

            atualizarTransacao(novoRegistro.type, novoRegistro.id, valores);
        } 
    }
}

function afterSubmit(context) {
    log.audit('afterSubmit', context);

    const novoRegistro = context.newRecord;

    var valores = {};

    if (novoRegistro.id) {
        var fornecedor = novoRegistro.getValue('entity');      

        if (fornecedor) {
            var lkpFornecedor = search.lookupFields({type: 'vendor',
                id: fornecedor,
                columns: ['email','custentity_enl_cnpjcpf']
            });

            valores.custbody_emaildofornecedor = lkpFornecedor.email;
            valores.custbody_rsc_cnpjdofornecedor = lkpFornecedor.custentity_enl_cnpjcpf;
        }       

        var departamento = novoRegistro.getValue('department');

        if (!departamento) {
            var idRequisicao = novoRegistro.getValue('custbody_rsc_id_requisicao');
            // log.audit('idRequisicao', idRequisicao);
    
            if (idRequisicao) {
                var lkpRequisicao = search.lookupFields({type: 'purchaserequisition',
                    id: idRequisicao,
                    columns: ['department']
                });
                // log.audit('lkpRequisicao', lkpRequisicao);
    
                if (lkpRequisicao.department.length > 0) {
                    valores.department = lkpRequisicao.department[0].value;
                }
            } else {
                var linhaItens = novoRegistro.getLineCount('item');
    
                for (i=0; i<linhaItens; i++) {
                    var pedidoVinculado = novoRegistro.getSublistValue('item', 'linkedorder', i);
    
                    if (pedidoVinculado) {
                        valores.custbody_rsc_id_requisicao = pedidoVinculado;
                        break;
                    }
                }
            }
        }       

        atualizarTransacao(novoRegistro.type, novoRegistro.id, valores);

        var origem = novoRegistro.getValue('source');

        if (origem && origem == 'CSV') {
            atualizar_linhas_pedido(novoRegistro.type, novoRegistro.id);
        }
    }
}

function beforeSubmit(context) {}

return {
    beforeLoad : beforeLoad,
    afterSubmit : afterSubmit,
    beforeSubmit : beforeSubmit
}
});