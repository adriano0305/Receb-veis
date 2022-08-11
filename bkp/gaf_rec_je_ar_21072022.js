/**
*@NApiVersion 2.1
*@NScriptType ScheduledScript
*/
define(['N/log', 'N/query', 'N/record', 'N/runtime', 'N/search'], function(log, query, record, runtime, search) {
const atualizarLancamentos = (dados) => {
    log.audit('atualizarLancamentos', dados);

    dados.forEach(function(campos, indice) {
        if (!campos.custbody_lrc_fatura_principal) {// Para não aprovar a fatura
            record.submitFields({type: 'invoice',
                id: campos.custbody_ref_parcela,
                values: {
                    approvalstatus: 2, // Aprovado
                    custbody_rsc_tipo_transacao_workflow: 102, // PV - Contrato
                    custbody_rsc_status_contrato: 2, // Contrato
                    custbody_rsc_pago: campos.custbody_rsc_pago ? campos.custbody_rsc_pago : ''
                },
                options: {
                    ignoreMandatoryFields : true
                }
            });
        }        

        var num = Number(indice+1);
        log.audit('Fatura aprovada!', (num)+'º Lançamento: '+JSON.stringify(campos));

        var lancamento = record.load({type: 'journalentry', id: campos.internalid, isDynamic: true});
        
        // Adicionar valores as contas
        campos.line.forEach(function(linha, indice) {
            var linhaConta = lancamento.findSublistLineWithValue('line', 'account', linha.account);

            if (linhaConta != -1) {
                lancamento.selectLine('line', linhaConta);   

                var debit = lancamento.getCurrentSublistValue('line', 'debit');
                var credit = lancamento.getCurrentSublistValue('line', 'credit');                

                if (credit > 0) {
                    // log.audit(indice, {linhaConta: linhaConta, credit: credit});
                    lancamento.setCurrentSublistValue('line', 'credit', credit + linha.credit);
                } 
                
                if (debit > 0) {
                    // log.audit(indice, {linhaConta: linhaConta, debit: debit});
                    lancamento.setCurrentSublistValue('line', 'debit', debit + linha.debit);
                }

                lancamento.commitLine('line');
            }
        });

        // Adicionar novas contas
        for (i=0; i<lancamento.getLineCount('line'); i++) {
            for (var key in campos.line) {
                var linha = lancamento.findSublistLineWithValue('line', 'account', campos.line[key].account);
                // log.audit(i, linha);

                if (linha == -1) {
                    lancamento.selectNewLine('line')
                    .setCurrentSublistValue('line', 'account', campos.line[key].account);
        
                    if (campos.line[key].credit > 0) {
                        lancamento.setCurrentSublistValue('line', 'credit', campos.line[key].credit);
                    } else {
                        lancamento.setCurrentSublistValue('line', 'debit', campos.line[key].debit);
                    }
        
                    lancamento.setCurrentSublistValue('line', 'memo', campos.line[key].memo)
                    // .setCurrentSublistValue('line', 'entity', campos.line[key].entity)
                    .setCurrentSublistValue('line', 'location', campos.line[key].location);

                    lancamento.commitLine('line');
                }
            }
        }           

        lancamento.save({ignoreMandatoryFields: true});
       
        var lpkLancamento = search.lookupFields({type: 'journalentry',
            id: campos.internalid,
            columns: ['tranid']
        });
        log.audit('Atualizado!', {idLancamento: campos.internalid, numeroEntrada: lpkLancamento.tranid});
    });      
}

const reverterLancamentos = (dados) => {
    log.audit('reverterLancamentos', dados);

    var sql = "SELECT recordtype, id, tranid, custbody_ref_parcela "+ 
    "FROM transaction "+
    "WHERE transaction.recordtype = 'journalentry' "+
    "AND transaction.custbody_ref_parcela IN ? ";
    // "AND transaction.custbody_ref_parcela = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [dados[0].custbody_ref_parcela]
    });

    var sqlResults = consulta.asMappedResults();

    if (sqlResults.length > 0) {
        for (i=0; i<sqlResults.length; i++) {
            var loadReg = record.load({type: 'journalentry', id: sqlResults[i].id});
            loadReg.setValue('reversaldefer', true)
            .setValue('reversaldate', new Date())
            .save({ignoreMandatoryFields: true});
            log.audit((i+1)+'º Lançamento', {status: 'Revertido', tranid: sqlResults[i].tranid});
        }        
    }
}

const localizarJE = (invoice) => {
    log.audit('localizarJE', invoice);

    var sql = "SELECT recordtype, id, custbody_ref_parcela "+ 
    "FROM transaction "+
    "WHERE transaction.recordtype = 'journalentry' "+
    "AND transaction.custbody_ref_parcela IN ? ";
    // "AND transaction.custbody_ref_parcela = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [invoice]
    });

    var sqlResults = consulta.asMappedResults();

    if (sqlResults.length > 0) {
        for (i=0; i<sqlResults.length; i++) {
            record.delete({type: 'journalentry', id: sqlResults[i].id});
            log.audit((i+1)+'º Lançamento', 'Excluído!');
        }        
    }
}

const excluirContrato = (dados) => {
    log.audit('excluirContrato', dados);

    var arrayjE = [];

    dados.forEach(function(campos, indice) {
        // arrayjE.push(campos.custbody_ref_parcela);        
        localizarJE(campos.custbody_ref_parcela);  
    });    

    // localizarJE(arrayjE); 

    dados.forEach(function(campos, indice) {
        var num = Number(indice+1);
        record.delete({type: 'invoice', id: campos.custbody_ref_parcela});
        log.audit((num)+'ª Invoice', 'Excluída!');                 
    }); 

    if (dados[0].id) {        
        var sql = "SELECT id FROM transaction "+
        "WHERE transaction.id = ? ";

        var consulta = query.runSuiteQL({
            query: sql,
            params: [dados[0].id]
        });

        var sqlResults = consulta.asMappedResults();

        if (sqlResults.length > 0) {
            record.delete({type: 'salesorder', id: sqlResults[0].id});
            log.audit('Pedido', 'Excluído!');      
        }        
    }    
}

const formatData = (data) => {
    var partesData = data.split("/");
    var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);
    return novaData;
}

const gerarLancamentos = (dados) => {
    log.audit('gerarLancamentos', dados);

    dados.forEach(function(campos, indice) {
        // var approvalStatus = record.load({type: 'invoice', id: campos.custbody_ref_parcela}).getValue('approvalstatus');

        if (!campos.custbody_lrc_fatura_principal) {// Para não aprovar a fatura
            record.submitFields({type: 'invoice',
                id: campos.custbody_ref_parcela,
                values: {
                    approvalstatus: 2, // Aprovado
                    custbody_rsc_tipo_transacao_workflow: 102, // PV - Contrato
                    custbody_rsc_status_contrato: 2, // Contrato
                    custbody_rsc_pago: campos.custbody_rsc_pago ? campos.custbody_rsc_pago : ''
                },
                options: {
                    ignoreMandatoryFields : true
                }
            });
        }        

        var num = Number(indice+1);
        log.audit('Fatura aprovada!', (num)+'º Lançamento: '+JSON.stringify(campos));

        var lancamento = record.create({type: 'journalentry', 
            isDynamic: true,
            defaultValues: {'bookje': 'T'}
        });

        Object.keys(campos).forEach(function(bodyField) {
            if (bodyField == 'trandate') {
                lancamento.setValue({fieldId: bodyField, value: formatData(campos[bodyField]), ignoreFieldChange: true});
            } else {
                lancamento.setValue(bodyField, campos[bodyField]);     
            }              
        });

        for (var key in campos.line) {
            lancamento.selectNewLine('line')
            .setCurrentSublistValue('line', 'account', campos.line[key].account);

            if (campos.line[key].credit > 0) {
                lancamento.setCurrentSublistValue('line', 'credit', campos.line[key].credit);
            } else {
                lancamento.setCurrentSublistValue('line', 'debit', campos.line[key].debit);
            }

            lancamento.setCurrentSublistValue('line', 'memo', campos.line[key].memo)
            // .setCurrentSublistValue('line', 'entity', campos.line[key].entity)
            .setCurrentSublistValue('line', 'location', campos.line[key].location)
            .commitLine('line');
        }

        var idLancamento = lancamento.save({ignoreMandatoryFields: true});

        if (idLancamento) {
            var lpkLancamento = search.lookupFields({type: 'journalentry',
                id: idLancamento,
                columns: ['tranid']
            });
            log.audit('Sucesso', {idLancamento: idLancamento, numeroEntrada: lpkLancamento.tranid});
        }
    });      
}

const fecharContrato = (dados) => {
    log.audit('fecharContrato', dados);

    var loadReg = record.load({type: dados[0].transacao, id: dados[0].id});

    loadReg.setValue('memo', dados[0].memo)
    .setValue('custbody_rsc_tipo_transacao_workflow', dados[0].custbody_rsc_tipo_transacao_workflow)
    .setValue('custbody_rsc_status_contrato', dados[0].custbody_rsc_status_contrato)
    .setValue('custbody_lrc_numero_contrato', dados[0].custbody_lrc_numero_contrato)
    .setValue('custbody_lrc_tipo_contrato', dados[0].custbody_lrc_tipo_contrato)
    .save({ignoreMandatoryFields : true});
    log.audit('status', 'Contrato Fechado!');
}

function execute(context) {
    log.audit('execute', context);

    const scriptAtual = runtime.getCurrentScript();
    const parametros = JSON.parse(scriptAtual.getParameter({name: 'custscript_rsc_journal_entries'}));

    const acao = parametros[0].acao;
    const transacao = parametros[0].transacao;

    switch(transacao) {
        case 'salesorder': 
            if (acao == 'edit') {
                if (!parametros[0].line) {
                    fecharContrato(parametros);
                } else {
                    gerarLancamentos(parametros);
                }                
            }

            if (acao == 'delete') {
                excluirContrato(parametros)
            }
        break;

        case 'invoice':
            if (acao == 'create') {
                gerarLancamentos(parametros);
            }

            if (acao == 'edit') {
                if (parametros[0].anulado) {
                    reverterLancamentos(parametros);
                } else {
                    atualizarLancamentos(parametros);
                }                
            }            
        break;

        case 'customerpayment':
            if (acao == 'create') {
                gerarLancamentos(parametros);
            } 
            
            if (acao == 'delete') {
                reverterLancamentos(parametros);
            }            
        break;

        case 'creditmemo':
            if (acao == 'edit') {
                gerarLancamentos(parametros);
            } 
            
            if (acao == 'delete') {
                reverterLancamentos(parametros);
            }            
        break;
        
        case 'job':
            if (acao == 'create') {
                gerarLancamentos(parametros);
            }          
        break;

        case 'journalentry':
            if (acao == 'delete') {
                parametros.forEach(function(dados, indice) {
                    var loadReg = record.load({type: 'journalentry', id: dados.id});
                    loadReg.setValue('reversaldefer', true)
                    .setValue('reversaldate', new Date())
                    .save({ignoreMandatoryFields: true});
                    log.audit((indice+1)+'º Lançamento', {status: 'Revertido', tranid: dados.tranid});
                })
            }            
        break;
    }
}

return {
    execute: execute
}
});