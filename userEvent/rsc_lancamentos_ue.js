/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/

const custPage = 'custpage_rsc_';
const hoje = new Date();

define(['N/file', 'N/log', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/ui/serverWidget'], (file, log, query, record, runtime, search, task, serverWidget) => {
const lancamentoAdicionais = (id, valor, status) => {
    log.audit('lancamentoAdicionais', {id: id, valor: valor, status: status});

    var lkpFI = search.lookupFields({type: 'customsale_rsc_financiamento',
        id: id,
        columns: ['entity','location','subsidiary','tranid']
    });

    var campos;
    
    if (!status) {
        campos = {
            memo: '',
            custbody_ref_parcela: id,
            subsidiary: lkpFI.subsidiary[0].value,
            line: [{
                account: contas.CREDITO.acrescimos.id,
                credit: valor,
                memo: contas.CREDITO.acrescimos.nome,
                entity: lkpFI.entity[0].value,
                location: lkpFI.location[0].value
            },{
                account: contas.DEBITO.acrescimos.id,
                debit: valor,
                memo: contas.DEBITO.acrescimos.nome,
                entity: lkpFI.entity[0].value,
                location: lkpFI.location[0].value
            }]
        }
    } else {
        campos = {
            memo: '',
            custbody_ref_parcela: id,
            subsidiary: lkpFI.subsidiary[0].value,
            line: [{
                account: contas.CREDITO.pagamentos.id,
                credit: valor,
                memo: contas.CREDITO.pagamentos.nome,
                entity: lkpFI.entity[0].value,
                location: lkpFI.location[0].value
            },{
                account: contas.DEBITO.pagamentos.id,
                debit: valor,
                memo: contas.DEBITO.pagamentos.nome,
                entity: lkpFI.entity[0].value,
                location: lkpFI.location[0].value
            }]
        } 
    }   
    
    log.audit('campos', campos);

    var lancamento = record.create({type: 'journalentry', 
        isDynamic: true,
        defaultValues: {'bookje': 'T'}
    });
    log.audit('lancamento', lancamento);

    Object.keys(campos).forEach(function(bodyField) {
        lancamento.setValue({
            fieldId: bodyField, 
            value: campos[bodyField]
        });
    });

    for (var key in campos.line) {
        lancamento.selectNewLine({
            sublistId: 'line' 
        });

        lancamento.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'account',
            value: campos.line[key].account
        });

        if (campos.line[key].credit > 0) {
            lancamento.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                value: campos.line[key].credit
            });
        } else {
            lancamento.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'debit',
                value: campos.line[key].debit
            });
        }

        lancamento.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'memo',
            value: campos.line[key].memo
        });

        lancamento.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'entity',
            value: campos.line[key].entity
        });

        lancamento.setCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'location',
            value: campos.line[key].location
        });

        lancamento.commitLine({
            sublistId: 'line'
        });
    }

    var idLancamento = lancamento.save({ignoreMandatoryFields: true});

    if (idLancamento) {
        var lpkLancamento = search.lookupFields({type: 'journalentry',
            id: idLancamento,
            columns: ['tranid']
        });
        log.audit(lkpFI.tranid, {idLancamento: idLancamento, numeroEntrada: lpkLancamento.tranid});
 
        if (status) {
            record.load({type: 'customsale_rsc_financiamento', id: id})
            .setValue('custbody_rsc_pago', status)
            .save({ignoreMandatoryFields: true})
        }
    }
}

const gerarLancamentos = (dados) => {
    log.audit('gerarLancamentos', dados);

    dados.forEach(function(campos, indice) {
        var num = Number(indice+1);
        log.audit((num)+'º Lançamento', campos);

        var lancamento = record.create({type: 'journalentry', 
            isDynamic: true,
            defaultValues: {'bookje': 'T'}
        });

        Object.keys(campos).forEach(function(bodyField) {
            lancamento.setValue(bodyField, campos[bodyField]);              
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
            .setCurrentSublistValue('line', 'entity', campos.line[key].entity)
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

const remold = (array) => {
    var arrayLancamentos = [];

    for (var prop in array) {
        if (arrayLancamentos.length > 0) {
            const result = arrayLancamentos.find(lancamento => lancamento.id === array[prop].id && lancamento.expenseaccount === array[prop].expenseaccount);

            if (result) {
                log.audit('Finded!', result);
            } else {
                arrayLancamentos.push({
                    id: array[prop].id,
                    tranid: array[prop].tranid,
                    trandate: array[prop].trandate,
                    custbody_ref_parcela: array[prop].custbody_ref_parcela,
                    expenseaccount: array[prop].expenseaccount,
                    memo: array[prop].memo,
                    debitforeignamount: array[prop].debitforeignamount,
                    creditforeignamount: array[prop].creditforeignamount,
                    location: array[prop].location
                });
            }
        } else {
            arrayLancamentos.push({
                id: array[prop].id,
                tranid: array[prop].tranid,
                trandate: array[prop].trandate,
                custbody_ref_parcela: array[prop].custbody_ref_parcela,
                expenseaccount: array[prop].expenseaccount,
                memo: array[prop].memo,
                debitforeignamount: array[prop].debitforeignamount,
                creditforeignamount: array[prop].creditforeignamount,
                location: array[prop].location
            });
        }
    }

    return arrayLancamentos;
}

const localizarLancamentos = (idFI) => {
    // log.audit('localizarLancamentos', {idFI: idFI});

    var arrayLancamentos = [];

    var sql = "SELECT t.id, t.tranid, t.trandate, t.custbody_ref_parcela, "+
    "tl.expenseaccount, tl.memo, tl.debitforeignamount, tl.creditforeignamount, tl.location "+
    "FROM transaction as t "+
    "INNER JOIN transactionline AS tl ON (tl.transaction = t.id) "+
    "WHERE t.custbody_ref_parcela = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [idFI]
    });

    var sqlResults = consulta.asMappedResults();  

    var fileObj = file.create({
        name: 'arrayLancamentos.txt',
        fileType: file.Type.PLAINTEXT,
        folder: 704, // SuiteScripts > teste > Arquivos
        contents: JSON.stringify(sqlResults)
    });

    var fileObjId = fileObj.save();

    if (sqlResults.length > 0) {
        // log.audit('sqlResults', sqlResults);

        for (i=0; i<sqlResults.length; i++) {
            arrayLancamentos.push({
                id: sqlResults[i].id,
                tranid: sqlResults[i].tranid,
                trandate: sqlResults[i].trandate,
                custbody_ref_parcela: sqlResults[i].custbody_ref_parcela,
                expenseaccount: sqlResults[i].expenseaccount,
                memo: sqlResults[i].memo,
                debitforeignamount: sqlResults[i].debitforeignamount,
                creditforeignamount: sqlResults[i].creditforeignamount,
                location: sqlResults[i].location
            });
        }
    }

    arrayLancamentos = arrayLancamentos.filter(function (dados) {
        return !this[JSON.stringify(dados)] && (this[JSON.stringify(dados)] = true);
    }, Object.create(null));

    arrayLancamentos = [...new Set(arrayLancamentos)];
    
    // var fileObj = file.create({
    //     name: 'arrayLancamentos.txt',
    //     fileType: file.Type.PLAINTEXT,
    //     folder: 704, // SuiteScripts > teste > Arquivos
    //     contents: JSON.stringify(arrayLancamentos)
    // });

    // var fileObjId = fileObj.save();
    // log.audit('fileObjId: '+fileObjId, {arrayParcelas: arrayParcelas});
    arrayLancamentos = remold(arrayLancamentos);
    // log.audit('arrayLancamentos', arrayLancamentos);

    return arrayLancamentos;
}

const sublistaLancamentos = (form, idFI) => {
    // log.audit('sublistaLancamentos', {form: form, idFI: idFI});

    // Guia Lançamentos
    const guia_fluxo_lancamentos = form.addTab({
        id: custPage+'guia_fluxo_lancamentos',
        label: 'Contabilidade'
    });

    // Sublista Lançamentos
    const listaLancamentos = form.addSublist({
        id: custPage+'lancamentos',
        type: 'list',
        label: 'Lançamentos',
        tab: custPage+'guia_fluxo_lancamentos'
    });

    var linhaLancamento = listaLancamentos.addField({
        id: custPage+'linha_lancamento',
        type: 'integer',
        label: '#'
    });

    var tranid = listaLancamentos.addField({
        id: custPage+'tranid',
        type: 'text',
        label: 'Tranid'
    });

    var data = listaLancamentos.addField({
        id: custPage+'data',
        type: 'date',
        label: 'Data'
    });

    var conta = listaLancamentos.addField({
        id: custPage+'conta',
        type: 'select',
        label: 'Conta',
        source: 'account'
    });

    conta.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var debito = listaLancamentos.addField({
        id: custPage+'debito',
        type: 'currency',
        label: 'Débito'
    });

    var credito = listaLancamentos.addField({
        id: custPage+'credito',
        type: 'currency',
        label: 'Crédito'
    });
    
    var memorando = listaLancamentos.addField({
        id: custPage+'memorando',
        type: 'text',
        label: 'Memorando'
    });

    var localidade = listaLancamentos.addField({
        id: custPage+'localidade',
        type: 'select',
        label: 'Localidade',
        source: 'location'
    });

    localidade.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.INLINE
    });

    var lancamentos = localizarLancamentos(idFI);

    if (lancamentos.length > 0) {
        for (i=0; i<lancamentos.length; i++) {
            listaLancamentos.setSublistValue({
                id: linhaLancamento.id,
                line: i,
                value: i+1
            });

            listaLancamentos.setSublistValue({
                id: tranid.id,
                line: i,
                value: lancamentos[i].tranid
            });

            listaLancamentos.setSublistValue({
                id: data.id,
                line: i,
                value: lancamentos[i].trandate
            });

            listaLancamentos.setSublistValue({
                id: conta.id,
                line: i,
                value: lancamentos[i].expenseaccount
            });

            listaLancamentos.setSublistValue({
                id: debito.id,
                line: i,
                value: lancamentos[i].debitforeignamount
            });

            listaLancamentos.setSublistValue({
                id: credito.id,
                line: i,
                value: lancamentos[i].creditforeignamount
            });

            listaLancamentos.setSublistValue({
                id: memorando.id,
                line: i,
                value: lancamentos[i].memo
            });

            listaLancamentos.setSublistValue({
                id: localidade.id,
                line: i,
                value: lancamentos[i].location
            });
        }
    }
}

const contaSubsidiaria = (cs) => {
    log.audit('contaSubsidiaria', cs);

    var bscCS = search.create({type: "account",
        filters: [
           ["type","anyof","Bank"], "AND", 
           ["subsidiary","anyof",cs]
        ],
        columns: [
            "name","subsidiary","type"
        ]
    }).run().getRange(0,5);
    log.audit('bscCS', bscCS);

    return bscCS[0].id;
}

const contaItem = (id) => {
    log.audit('contaItem', id);

    var sql = "SELECT t.id, t.foreigntotal, "+
    "tl.item, tl.rateamount "+
    "FROM transaction AS t "+
    "INNER JOIN transactionline AS tl ON (tl.transaction = t.id) "+
    "WHERE tl.item IS NOT NULL "+
    "AND tl.item <> 5 "+
    "AND t.id = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [id]
    });

    var sqlResults = consulta.asMappedResults();
    log.audit('sqlResults', sqlResults); 

    var contas = [];

    for (i=0; i<sqlResults.length; i++) { 
        // INCC, IGP-M, IPCA e INPC       
        if (sqlResults[i].item == 28651 || sqlResults[i].item == 28652 || sqlResults[i].item == 30697 || sqlResults[i].item == 30698) {
            var sql2 = "SELECT id, incomeaccount "+
            "FROM item "+
            "WHERE id = ? ";

            var consulta2 = query.runSuiteQL({
                query: sql2,
                params: [sqlResults[i].item]
            });

            var sqlResults2 = consulta2.asMappedResults();
            log.audit('sqlResults2', sqlResults2); 

            for (var prop in sqlResults2) {
                if (contas.length > 0) {
                    const result = contas.find(conta => conta === sqlResults2[prop].incomeaccount);
        
                    if (result) {
                        log.audit('Finded!', result);                        
                    } else {
                        contas.push(sqlResults2[prop].incomeaccount);
                    }
                } else {
                    contas.push(sqlResults2[prop].incomeaccount);
                }               
            }
        }
    }    
    
    log.audit('contas', contas);

    return contas;
}

const accounting = (id) => {
    log.audit('accounting', id);

    var sql = "SELECT t.id, t.foreigntotal, "+
    "tl.item, tl.rateamount "+
    "FROM transaction AS t "+
    "INNER JOIN transactionline AS tl ON (tl.transaction = t.id) "+
    "WHERE tl.item IS NOT NULL "+
    "AND tl.item <> 5 "+
    "AND t.id = ? ";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [id]
    });

    var sqlResults = consulta.asMappedResults();
    log.audit('sqlResults', sqlResults); 

    var obj = {};

    obj.total = 0;
    obj.acrescimos = 0;
    obj.cm = 0; // cm = correação monetária

    for (i=0; i<sqlResults.length; i++) {
        if (sqlResults[i].item == 28650) { // Fração Principal
            obj.total = sqlResults[i].rateamount;
        }    
        // INCC, IGP-M, IPCA, INPC e JUROS PRICE
        if (sqlResults[i].item == 28651 || sqlResults[i].item == 28652 || sqlResults[i].item == 30695 || sqlResults[i].item == 30697 || sqlResults[i].item == 30698) {
            obj.cm = obj.cm + sqlResults[i].rateamount;
        }
        // Acréscimos moratórios
        if (sqlResults[i].item == 30694) {
            obj.acrescimos = obj.acrescimos + sqlResults[i].rateamount;
        }
    }    
    
    log.audit('obj', obj);
    return obj;
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

const beforeLoad = (context) => {
    // log.audit('beforeLoad', context);

    const novoRegistro = context.newRecord;

    const form = context.form;

    const tipo = novoRegistro.type;

    var ambiente = runtime.envType;

    if (novoRegistro.id) {
        if (tipo != 'salesorder') {
            sublistaLancamentos(form, novoRegistro.id);
        }        
    }
}

const beforeSubmit = (context) => {
    // log.audit('beforeSubmit', context);

    const novoRegistro = context.newRecord;

    const tipo = context.type;

    const transacao = novoRegistro.type;

    var ambiente = runtime.envType;

    var usuarioAtual = runtime.getCurrentUser();

    var arrayLancamentos = [];
    var bscTransacao, scriptTask, scriptTaskId;

    switch(transacao) {
        case 'customerpayment': 
            if (tipo == 'delete') {
                bscTransacao = search.create({type: "journalentry",
                    filters: [
                        ["shipping","is","F"], "AND", 
                        ["taxline","is","F"], "AND", 
                        ["mainline","is","T"], "AND", 
                        ["type","anyof","Journal"], "AND", 
                        ["custbody_ref_parcela","anyof",novoRegistro.id]
                    ],
                    columns: [
                        "datecreated","internalid","custbody_ref_parcela","amount",
                        search.createColumn({name: "formulatext", formula: "{tranid}", label: "Fórmula (texto)"})
                    ]
                }).run().getRange(0,1000);
                log.audit(transacao, {bscTransacao: bscTransacao});
                
                if (bscTransacao.length > 0) {
                    for (i=0; i<bscTransacao.length; i++) {
                        var loadReg = record.load({type: 'journalentry', id: bscTransacao[i].id});

                        var reversao = {
                            id: loadReg.id, 
                            status: 'Revertido',
                            tranid: loadReg.getValue('tranid'),
                        }

                        loadReg.setValue('reversaldefer', true)
                        .setValue('reversaldate', new Date())
                        .save({ignoreMandatoryFields: true});
                        
                        log.audit(transacao, reversao);
                    }
                }
            }
        break;

        case 'invoice': 
            if (tipo == 'delete') {
                bscTransacao = search.create({type: "journalentry",
                    filters: [
                        ["shipping","is","F"], "AND", 
                        ["taxline","is","F"], "AND", 
                        ["mainline","is","T"], "AND", 
                        ["type","anyof","Journal"], "AND", 
                        ["custbody_ref_parcela","anyof",novoRegistro.id]
                    ],
                    columns: [
                        "datecreated","internalid","custbody_ref_parcela","amount",
                        search.createColumn({name: "formulatext", formula: "{tranid}", label: "Fórmula (texto)"})
                    ]
                }).run().getRange(0,1000);
                log.audit(transacao, {bscTransacao: bscTransacao});
                
                if (bscTransacao.length > 0) {
                    for (i=0; i<bscTransacao.length; i++) {
                        arrayLancamentos.push({
                            acao: 'delete',
                            transacao: 'journalentry',
                            id: bscTransacao[i].id,
                            tranid: bscTransacao[i].getValue({name: 'formulatext', formula:'{tranid}'})
                        });
                    }
                }

                if (arrayLancamentos.length > 0) {
                    taskLancamentos(arrayLancamentos);
                }
            }
        break;

        case 'salesorder': 
            if (tipo == 'delete') {
                bscTransacao = search.create({type: "invoice",
                    filters: [
                        ["shipping","is","F"], "AND", 
                        ["taxline","is","F"], "AND", 
                        ["mainline","is","T"], "AND", 
                        ["type","anyof","CustInvc"], "AND", 
                        ["custbody_lrc_fatura_principal","anyof",novoRegistro.id]
                    ],
                    columns: [
                        "internalid","tranid","trandate","total"
                    ]
                }).run().getRange(0,1000);
                log.audit(transacao, {bscTransacao: bscTransacao});
                
                if (bscTransacao.length > 0) {
                    for (i=0; i<bscTransacao.length; i++) {
                        arrayLancamentos.push({
                            acao: 'delete',
                            transacao: transacao,
                            id: novoRegistro.id,
                            custbody_ref_parcela: bscTransacao[i].id              
                        });
                    }
                }

                if (arrayLancamentos.length > 0) {
                    taskLancamentos(arrayLancamentos);
                }
            }
        break;
    }  
}

const afterSubmit = (context) => {
    log.audit('afterSubmit', context);

    const novoRegistro = context.newRecord;
    const velhoRegistro = context.oldRecord;

    const tipo = context.type;

    const transacao = novoRegistro.type;
    log.audit(transacao, tipo);

    const parametroScript = runtime.getCurrentScript();

    var ambiente = runtime.envType;
    var usuarioAtual = runtime.getCurrentUser();

    var arrayLancamentos = [];
    var sql, consulta, sqlResults, bscTransacao, conta, scriptTask, scriptTaskId;
    
    var contabilizacao = accounting(novoRegistro.id);

    switch(transacao) {
        case 'salesorder': 
            if (tipo == 'edit') {
                var tipoTransacaoWF = novoRegistro.getValue('custbody_rsc_tipo_transacao_workflow');

                if (tipoTransacaoWF == 102) {// PV - Contrato
                    bscTransacao = search.create({type: "invoice",
                        filters: [
                            ["shipping","is","F"], "AND", 
                            ["taxline","is","F"], "AND", 
                            ["mainline","is","T"], "AND", 
                            ["type","anyof","CustInvc"], "AND", 
                            ["custbody_lrc_fatura_principal","anyof",novoRegistro.id]
                        ],
                        columns: [
                            "internalid","tranid","trandate","total"
                        ]
                    }).run().getRange(0,1000);
                    log.audit(transacao, {bscTransacao: bscTransacao});

                    conta = search.lookupFields({type: 'serviceitem',
                        id: parametroScript.getParameter('custscript_rsc_cdt_venda_unidade_1'),
                        columns: ['incomeaccount']
                    }).incomeaccount[0].value;
                    log.audit('conta', conta);
                    
                    if (bscTransacao.length > 0) {
                        for (i=0; i<bscTransacao.length; i++) {
                            sql = "SELECT id, voided "+
                            "FROM transaction "+
                            "WHERE transaction.id = ? ";

                            consulta = query.runSuiteQL({
                                query: sql,
                                params: [bscTransacao[i].id]
                            });
                        
                            sqlResults = consulta.asMappedResults();
                            log.audit('sqlResults', sqlResults);

                            if (sqlResults.length == 0) {
                                arrayLancamentos.push({
                                    acao: tipo,
                                    transacao: transacao,
                                    trandate: bscTransacao[i].getValue('trandate'),
                                    memo: '',
                                    subsidiary: novoRegistro.getValue('subsidiary'),
                                    custbody_ref_parcela: bscTransacao[i].id,
                                    line: [{
                                        account: parametroScript.getParameter('custscript_rsc_dbt_venda_unidade_1'),
                                        debit: bscTransacao[i].getValue('total'),
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    },{
                                        account: conta,
                                        credit: bscTransacao[i].getValue('total'),
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    }]               
                                });
                            }
                        }
                    }

                    if (arrayLancamentos.length > 0) {
                        log.audit('arrayLancamentos', arrayLancamentos);
                        taskLancamentos(arrayLancamentos);
                    }
                }
            }
        break;

        case 'invoice':                
            var total = novoRegistro.getValue('total');
            var criadoDe = novoRegistro.getValue('createdfrom');
            var approvalstatus = novoRegistro.getValue('approvalstatus');
            var cessaoDireito = novoRegistro.getValue('custbody_rsc_cessao_direito');
            var status = novoRegistro.getValue('status');
            var subsidiaria = novoRegistro.getValue('subsidiary');
            var tipoRenegociacao = novoRegistro.getValue('custbody_rsc_tipo_renegociacao');
            var pago = novoRegistro.getValue('custbody_rsc_pago');

            if (tipo == 'create') {
                if (approvalstatus == 1 || criadoDe || !tipoRenegociacao) {
                    for (i=0; i<novoRegistro.getLineCount('item'); i++) {
                        var item = novoRegistro.getSublistValue('item', 'item', i);
                        var amount = novoRegistro.getSublistValue('item', 'amount', i);

                        switch(item) {
                            case '28650': // FRAÇÃO PRINCIPAL                                
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_venda_unidade_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                arrayLancamentos.push({
                                    acao: tipo,
                                    transacao: transacao,
                                    memo: '',
                                    subsidiary: novoRegistro.getValue('subsidiary'),
                                    custbody_ref_parcela: novoRegistro.id,                                            
                                    custbody_lrc_fatura_principal: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                                    line: [{
                                        account: parametroScript.getParameter('custscript_rsc_dbt_venda_unidade_1'),
                                        debit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    },{
                                        account: conta,
                                        credit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    }]               
                                });
                            break; 

                            case '28651': // INCC 
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_incc_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                arrayLancamentos.push({
                                    acao: tipo,
                                    transacao: transacao,
                                    memo: '',
                                    subsidiary: novoRegistro.getValue('subsidiary'),
                                    custbody_ref_parcela: novoRegistro.id,                                            
                                    custbody_lrc_fatura_principal: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                                    line: [{
                                        account: parametroScript.getParameter('custscript_rsc_dbt_incc_1'),
                                        debit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    },{
                                        account: conta,
                                        credit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    }]               
                                });
                            break; 

                            case '28652': // IGP-M
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_igpm_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                arrayLancamentos.push({
                                    acao: tipo,
                                    transacao: transacao,
                                    memo: '',
                                    subsidiary: novoRegistro.getValue('subsidiary'),
                                    custbody_ref_parcela: novoRegistro.id,                                            
                                    approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                                    line: [{
                                        account: parametroScript.getParameter('custscript_rsc_dbt_igpm_1'),
                                        debit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    },{
                                        account: conta,
                                        credit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    }]               
                                });
                            break;

                            // case '19593': // 6000013 (Serviço Modificação Unidade)
                            //     conta = search.lookupFields({type: 'serviceitem',
                            //         id: parametroScript.getParameter('custscript_rsc_cdt_srv_mod_unidade_1'),
                            //         columns: ['incomeaccount']
                            //     }).incomeaccount[0].value;

                            //     arrayLancamentos.push({
                            //         acao: 'create',
                            //         transacao: transacao,
                            //         memo: '',
                            //         subsidiary: novoRegistro.getValue('subsidiary'),
                            //         custbody_ref_parcela: novoRegistro.id,                                            
                            //         approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                            //         line: [{
                            //             account: parametroScript.getParameter('custscript_rsc_dbt_srv_mod_unidade_1'),
                            //             debit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         },{
                            //             account: conta,
                            //             credit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         }]               
                            //     });
                            // break;

                            // case '19594': // 6000101 (Faturamento Serviço Corretagem)
                            //     conta = search.lookupFields({type: 'serviceitem',
                            //         id: parametroScript.getParameter('custscript_rsc_cdt_fat_srv_corretagem_1'),
                            //         columns: ['incomeaccount']
                            //     }).incomeaccount[0].value;

                            //     arrayLancamentos.push({
                            //         acao: 'create',
                            //         transacao: transacao,
                            //         memo: '',
                            //         subsidiary: novoRegistro.getValue('subsidiary'),
                            //         custbody_ref_parcela: novoRegistro.id,                                            
                            //         approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                            //         line: [{
                            //             account: parametroScript.getParameter('custscript_rsc_dbt_fat_srv_corretagem_1'),
                            //             debit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         },{
                            //             account: conta,
                            //             credit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         }]               
                            //     });
                            // break;

                            // case '19595': // 6000003 (Gestão Imobiliária)
                            //     conta = search.lookupFields({type: 'serviceitem',
                            //         id: parametroScript.getParameter('custscript_rsc_cdt_gestao_imobiliaria_1'),
                            //         columns: ['incomeaccount']
                            //     }).incomeaccount[0].value;

                            //     arrayLancamentos.push({
                            //         acao: 'create',
                            //         transacao: transacao,
                            //         memo: '',
                            //         subsidiary: novoRegistro.getValue('subsidiary'),
                            //         custbody_ref_parcela: novoRegistro.id,                                            
                            //         approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                            //         line: [{
                            //             account: parametroScript.getParameter('custscript_rsc_dbt_gestao_imobiliaria_1'),
                            //             debit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         },{
                            //             account: conta,
                            //             credit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         }]               
                            //     });
                            // break;

                            // case '19596': // 6000017 (Taxa de Cessão)
                            //     conta = search.lookupFields({type: 'serviceitem',
                            //         id: parametroScript.getParameter('custscript_rsc_cdt_taxa_cessao_1'),
                            //         columns: ['incomeaccount']
                            //     }).incomeaccount[0].value;

                            //     arrayLancamentos.push({
                            //         acao: 'create',
                            //         transacao: transacao,
                            //         memo: '',
                            //         subsidiary: novoRegistro.getValue('subsidiary'),
                            //         custbody_ref_parcela: novoRegistro.id,                                            
                            //         approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                            //         line: [{
                            //             account: parametroScript.getParameter('custscript_rsc_dbt_taxa_cessao_1'),
                            //             debit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         },{
                            //             account: conta,
                            //             credit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         }]               
                            //     });
                            // break;

                            // case '19597': // 6000020 (Taxa de distrato)
                            //     conta = search.lookupFields({type: 'serviceitem',
                            //         id: parametroScript.getParameter('custscript_rsc_cdt_taxa_distrato_1'),
                            //         columns: ['incomeaccount']
                            //     }).incomeaccount[0].value;

                            //     arrayLancamentos.push({
                            //         acao: 'create',
                            //         transacao: transacao,
                            //         memo: '',
                            //         subsidiary: novoRegistro.getValue('subsidiary'),
                            //         custbody_ref_parcela: novoRegistro.id,                                            
                            //         approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                            //         line: [{
                            //             account: parametroScript.getParameter('custscript_rsc_dbt_taxa_distrato_1'),
                            //             debit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         },{
                            //             account: conta,
                            //             credit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         }]               
                            //     });
                            // break;

                            // case '19598': // 6000102 (Comissionamento House UP)
                            //     conta = search.lookupFields({type: 'serviceitem',
                            //         id: parametroScript.getParameter('custscript_rsc_cdt_comiss_house_up_1'),
                            //         columns: ['incomeaccount']
                            //     }).incomeaccount[0].value;

                            //     arrayLancamentos.push({
                            //         acao: 'create',
                            //         transacao: transacao,
                            //         memo: '',
                            //         subsidiary: novoRegistro.getValue('subsidiary'),
                            //         custbody_ref_parcela: novoRegistro.id,                                            
                            //         approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                            //         line: [{
                            //             account: parametroScript.getParameter('custscript_rsc_dbt_comiss_house_up_1'),
                            //             debit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         },{
                            //             account: conta,
                            //             credit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         }]               
                            //     });
                            // break;

                            // case '19599': // 6000013 (Taxa Administrativa)
                            //     conta = search.lookupFields({type: 'serviceitem',
                            //         id: parametroScript.getParameter('custscript_rsc_cdt_taxa_administrativa_1'),
                            //         columns: ['incomeaccount']
                            //     }).incomeaccount[0].value;

                            //     arrayLancamentos.push({
                            //         acao: 'create',
                            //         transacao: transacao,
                            //         memo: '',
                            //         subsidiary: novoRegistro.getValue('subsidiary'),
                            //         custbody_ref_parcela: novoRegistro.id,                                            
                            //         approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                            //         line: [{
                            //             account: parametroScript.getParameter('custscript_rsc_dbt_taxa_administrativa_1'),
                            //             debit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         },{
                            //             account: conta,
                            //             credit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         }]               
                            //     });
                            // break;

                            // case '19600': // 6000002 (Equipe Técnica Taxa Administrativa)
                            //     conta = search.lookupFields({type: 'serviceitem',
                            //         id: parametroScript.getParameter('custscript_rsc_cdt_eqp_tec_tx_adm_1'),
                            //         columns: ['incomeaccount']
                            //     }).incomeaccount[0].value;

                            //     arrayLancamentos.push({
                            //         acao: tipo,
                            //         transacao: transacao,
                            //         memo: '',
                            //         subsidiary: novoRegistro.getValue('subsidiary'),
                            //         custbody_ref_parcela: novoRegistro.id,                                            
                            //         custbody_lrc_fatura_principal: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                            //         line: [{
                            //             account: parametroScript.getParameter('custscript_rsc_dbt_eqp_tec_tx_adm_1'),
                            //             debit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         },{
                            //             account: conta,
                            //             credit: amount,
                            //             memo: '',
                            //             entity: novoRegistro.getValue('entity'),
                            //             location: novoRegistro.getValue('location')
                            //         }]               
                            //     });
                            // break;

                            case '28653': // JUROS PRICE INCORRIDO
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_juros_incorridos_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                arrayLancamentos.push({
                                    acao: tipo,
                                    transacao: transacao,
                                    memo: '',
                                    subsidiary: novoRegistro.getValue('subsidiary'),
                                    custbody_ref_parcela: novoRegistro.id,                                            
                                    custbody_lrc_fatura_principal: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                                    line: [{
                                        account: parametroScript.getParameter('custscript_rsc_dbt_juros_incorridos_1'),
                                        debit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    },{
                                        account: conta,
                                        credit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    }]               
                                });
                            break;

                            case '28654': // JUROS PRICE A INCORRER
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_juros_incorrer_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                arrayLancamentos.push({
                                    acao: tipo,
                                    transacao: transacao,
                                    memo: '',
                                    subsidiary: novoRegistro.getValue('subsidiary'),
                                    custbody_ref_parcela: novoRegistro.id,                                            
                                    custbody_lrc_fatura_principal: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                                    line: [{
                                        account: parametroScript.getParameter('custscript_rsc_dbt_juros_incorrer_1'),
                                        debit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    },{
                                        account: conta,
                                        credit: amount,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    }]               
                                });
                            break;
                        }
                    }
                }

                if (cessaoDireito) {
                    conta = search.lookupFields({type: 'serviceitem',
                        id: parametroScript.getParameter('custscript_rsc_cdt_taxa_cessao_1'),
                        columns: ['incomeaccount']
                    }).incomeaccount[0].value;

                    arrayLancamentos.push({
                        acao: tipo,
                        transacao: transacao,
                        memo: '',
                        subsidiary: novoRegistro.getValue('subsidiary'),
                        custbody_ref_parcela: novoRegistro.id,                                            
                        approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                        line: [{
                            account: parametroScript.getParameter('custscript_rsc_dbt_taxa_cessao_1'),
                            debit: total,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        },{
                            account: conta,
                            credit: total,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        }]               
                    });

                    conta = search.lookupFields({type: 'serviceitem',
                        id: parametroScript.getParameter('custscript_rsc_cdt_taxa_cessao_2'),
                        columns: ['incomeaccount']
                    }).incomeaccount[0].value;

                    arrayLancamentos.push({
                        acao: tipo,
                        transacao: transacao,
                        memo: '',
                        subsidiary: novoRegistro.getValue('subsidiary'),
                        custbody_ref_parcela: novoRegistro.id,                                            
                        approvalstatus: novoRegistro.getValue('custbody_lrc_fatura_principal'),
                        line: [{
                            account: contaSubsidiaria(subsidiaria),
                            debit: total,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        },{
                            account: conta,
                            credit: total,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        }]               
                    });
                }
                
                log.audit('tipoRenegociacao', tipoRenegociacao);
                
                if (tipoRenegociacao == 1) { // Amortização
                    var idEmpreendimento = novoRegistro.getValue('custbody_rsc_projeto_obra_gasto_compra');

                    var lookupProjeto = search.lookupFields({type: 'job',
                        id: idEmpreendimento,
                        columns: ['companyname','custentity_rsc_securitizado','custentity_rsc_d_amortizacao_divida','custentity_rsc_c_amortizacao_divida']
                    });

                    if (lookupProjeto.custentity_rsc_securitizado && (lookupProjeto.custentity_rsc_d_amortizacao_divida && lookupProjeto.custentity_rsc_c_amortizacao_divida)) {
                        // Contas de amortização nas preferências gerais + contas de amortização no cadastro do projeto
                        arrayLancamentos.push({
                            acao: 'create',
                            transacao: 'job',
                            memo: '',
                            subsidiary: novoRegistro.getValue('subsidiary'),
                            custbody_rsc_projeto_obra_gasto_compra: idEmpreendimento,
                            custbody_ref_parcela: novoRegistro.id,
                            custbody_rsc_empproj_securitizado: lookupProjeto.custentity_rsc_securitizado,
                            line: [{
                                account: lookupProjeto.custentity_rsc_d_amortizacao_divida[0].value,
                                debit: total,
                                memo: 'Securitização: Projeto '+lookupProjeto.companyname,
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            },{
                                account: lookupProjeto.custentity_rsc_c_amortizacao_divida[0].value,
                                credit: total,
                                memo: 'Securitização: Projeto '+lookupProjeto.companyname,
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            },{
                                account: parametroScript.getParameter('custscript_rsc_dbt_amortizacao_1'),
                                debit: contabilizacao.total + contabilizacao.cm,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            },{
                                account: parametroScript.getParameter('custscript_rsc_cdt_amortizacao_2'),
                                credit: contabilizacao.total,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            }]               
                        });

                        if (contabilizacao.cm > 0) {
                            arrayLancamentos[0].line.push({
                                account: parametroScript.getParameter('custscript_rsc_cdt_amortizacao_1'),
                                credit: contabilizacao.cm,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            });
                        }
                    } else { // Contas de amortização nas preferênciaa gerais
                        arrayLancamentos.push({
                            acao: tipo,
                            transacao: transacao,
                            memo: '',
                            subsidiary: novoRegistro.getValue('subsidiary'),
                            custbody_ref_parcela: novoRegistro.id, 
                            line: [{
                                account: parametroScript.getParameter('custscript_rsc_dbt_amortizacao_1'),
                                debit: contabilizacao.total + contabilizacao.cm,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            },{
                                account: parametroScript.getParameter('custscript_rsc_cdt_amortizacao_2'),
                                credit: contabilizacao.total,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            }]               
                        });

                        if (contabilizacao.cm > 0) {
                            arrayLancamentos[0].line.push({
                                account: parametroScript.getParameter('custscript_rsc_cdt_amortizacao_1'),
                                credit: contabilizacao.cm,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            });
                        }
                    }
                }

                if (tipoRenegociacao == 2) { // Inadimplentes
                    arrayLancamentos.push({
                        acao: tipo,
                        transacao: transacao,
                        memo: '',
                        subsidiary: novoRegistro.getValue('subsidiary'),
                        custbody_ref_parcela: novoRegistro.id,
                        approvalstatus: 2,
                        line: [{
                            account: parametroScript.getParameter('custscript_rsc_dbt_inadimplentes_1'),
                            debit: contabilizacao.total + contabilizacao.cm + contabilizacao.acrescimos,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        },{
                            account: parametroScript.getParameter('custscript_rsc_cdt_inadimplentes_2'),
                            credit: contabilizacao.total,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        }]               
                    }); 
    
                    if (contabilizacao.cm > 0) {
                        arrayLancamentos[0].line.push({
                            account: parametroScript.getParameter('custscript_rsc_cdt_inadimplentes_1'),
                            credit: contabilizacao.cm,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        });
                    }

                    if (contabilizacao.acrescimos > 0) {
                        var linhaItem = novoRegistro.findSublistLineWithValue('item', 'item', 30694); // Acréscimos moratórios
                        var item = novoRegistro.getSublistValue('item', 'item', linhaItem);

                        conta = search.lookupFields({type: 'serviceitem',
                            id: item,
                            columns: ['incomeaccount']
                        }).incomeaccount[0].value;

                        arrayLancamentos[0].line.push({
                            account: conta,
                            credit: contabilizacao.acrescimos,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        });                        
                    }
                }

                if (tipoRenegociacao == 3) { // Adimplentes
                    arrayLancamentos.push({
                        acao: tipo,
                        transacao: transacao,
                        memo: '',
                        subsidiary: novoRegistro.getValue('subsidiary'),
                        custbody_ref_parcela: novoRegistro.id,
                        approvalstatus: 2,
                        line: [{
                            account: parametroScript.getParameter('custscript_rsc_dbt_adimplentes_1'),
                            debit: contabilizacao.total + contabilizacao.cm + contabilizacao.acrescimos,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        },{
                            account: parametroScript.getParameter('custscript_rsc_cdt_adimplentes_2'),
                            credit: contabilizacao.total,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        }]               
                    });

                    if (contabilizacao.cm > 0) {
                        arrayLancamentos[0].line.push({
                            account: parametroScript.getParameter('custscript_rsc_cdt_adimplentes_1'),
                            credit: contabilizacao.cm,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        });
                    }

                    if (contabilizacao.acrescimos > 0) {
                        var linhaItem = novoRegistro.findSublistLineWithValue('item', 'item', 30694); // Acréscimos moratórios
                        var item = novoRegistro.getSublistValue('item', 'item', linhaItem);

                        conta = search.lookupFields({type: 'serviceitem',
                            id: item,
                            columns: ['incomeaccount']
                        }).incomeaccount[0].value;

                        arrayLancamentos[0].line.push({
                            account: conta,
                            credit: contabilizacao.acrescimos,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        });                        
                    }
                }

                if (tipoRenegociacao == 4) { // Recáculo de Atraso
                    arrayLancamentos.push({
                        acao: tipo,
                        transacao: transacao,
                        memo: '',
                        subsidiary: novoRegistro.getValue('subsidiary'),
                        custbody_ref_parcela: novoRegistro.id,
                        approvalstatus: 2,
                        line: [{
                            account: contaSubsidiaria(subsidiaria),
                            debit: contabilizacao.total + contabilizacao.cm + contabilizacao.acrescimos,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        },{
                            account: parametroScript.getParameter('custscript_rsc_cdt_recalculo_atraso_1'),
                            credit: contabilizacao.total + contabilizacao.cm,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        }]               
                    }); 
                }

                if (tipoRenegociacao == 5) { // Antecipação
                    arrayLancamentos.push({
                        acao: tipo,
                        transacao: transacao,
                        memo: '',
                        subsidiary: novoRegistro.getValue('subsidiary'),
                        custbody_ref_parcela: novoRegistro.id,
                        approvalstatus: 2,
                        line: [{
                            account: contaSubsidiaria(subsidiaria),
                            debit: contabilizacao.total + contabilizacao.cm,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        },{
                            account: parametroScript.getParameter('custscript_rsc_cdt_antecipacao_1'),
                            credit: contabilizacao.total + contabilizacao.cm,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location')
                        }]               
                    });
                }

                if (arrayLancamentos.length > 0) {
                    log.audit('arrayLancamentos', arrayLancamentos);
                    taskLancamentos(arrayLancamentos);
                }
            }

            if (tipo == 'edit') {                    
                sql = "SELECT id, voided "+
                "FROM transaction "+
                "WHERE transaction.id = ? ";

                consulta = query.runSuiteQL({
                    query: sql,
                    params: [novoRegistro.id]
                });
            
                sqlResults = consulta.asMappedResults();

                var anulado = sqlResults[0].voided;

                if (anulado == 'T' || anulado == true) {
                    arrayLancamentos.push({
                        acao: tipo,
                        transacao: transacao,
                        custbody_ref_parcela: novoRegistro.id,
                        anulado: anulado           
                    });

                    taskLancamentos(arrayLancamentos);
                } else {
                    var diferenca = 0;
                    for (i=0; i<novoRegistro.getLineCount('item'); i++) {
                        var item = novoRegistro.getSublistValue('item', 'item', i);
                        var amount = novoRegistro.getSublistValue('item', 'amount', i);
                        var oldAmount = velhoRegistro.getSublistValue('item', 'amount', i);
                        diferenca = Math.abs(amount - oldAmount);
                        
                        log.audit('record', {item: item, amount: amount, oldAmount: oldAmount, diferenca: diferenca});
                       
                        switch(item) {
                            case '28650': // FRAÇÃO PRINCIPAL                                
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_venda_unidade_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                if (diferenca > 0) {
                                    arrayLancamentos.push({
                                        acao: 'create',
                                        transacao: transacao,
                                        memo: '',
                                        subsidiary: novoRegistro.getValue('subsidiary'),
                                        custbody_ref_parcela: novoRegistro.id,
                                        line: [{
                                            account: parametroScript.getParameter('custscript_rsc_dbt_venda_unidade_1'),
                                            debit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        },{
                                            account: conta,
                                            credit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        }]               
                                    });
                                }
                            break; 

                            case '28651': // INCC 
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_incc_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                if (diferenca > 0) {
                                    arrayLancamentos.push({
                                        acao: 'create',
                                        transacao: transacao,
                                        memo: '',
                                        subsidiary: novoRegistro.getValue('subsidiary'),
                                        custbody_ref_parcela: novoRegistro.id,
                                        line: [{
                                            account: parametroScript.getParameter('custscript_rsc_dbt_incc_1'),
                                            debit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        },{
                                            account: conta,
                                            credit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        }]               
                                    });
                                }
                            break; 

                            case '28652': // IGP-M
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_igpm_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;
                                
                                if (diferenca > 0) {
                                    arrayLancamentos.push({
                                        acao: 'create',
                                        transacao: transacao,
                                        memo: '',
                                        subsidiary: novoRegistro.getValue('subsidiary'),
                                        custbody_ref_parcela: novoRegistro.id,
                                        line: [{
                                            account: parametroScript.getParameter('custscript_rsc_dbt_igpm_1'),
                                            debit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        },{
                                            account: conta,
                                            credit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        }]               
                                    });
                                }
                            break;

                            case '28653': // JUROS PRICE INCORRIDO
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_juros_incorridos_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                if (diferenca > 0) {
                                    arrayLancamentos.push({
                                        acao: 'create',
                                        transacao: transacao,
                                        memo: '',
                                        subsidiary: novoRegistro.getValue('subsidiary'),
                                        custbody_ref_parcela: novoRegistro.id,
                                        line: [{
                                            account: parametroScript.getParameter('custscript_rsc_dbt_juros_incorridos_1'),
                                            debit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        },{
                                            account: conta,
                                            credit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        }]               
                                    });
                                }
                            break;

                            case '28654': // JUROS PRICE A INCORRER
                                conta = search.lookupFields({type: 'serviceitem',
                                    id: parametroScript.getParameter('custscript_rsc_cdt_juros_incorrer_1'),
                                    columns: ['incomeaccount']
                                }).incomeaccount[0].value;

                                if (diferenca > 0) {
                                    arrayLancamentos.push({
                                        acao: 'create',
                                        transacao: transacao,
                                        memo: '',
                                        subsidiary: novoRegistro.getValue('subsidiary'),
                                        custbody_ref_parcela: novoRegistro.id,
                                        line: [{
                                            account: parametroScript.getParameter('custscript_rsc_dbt_juros_incorrer_1'),
                                            debit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        },{
                                            account: conta,
                                            credit: diferenca,
                                            memo: '',
                                            entity: novoRegistro.getValue('entity'),
                                            location: novoRegistro.getValue('location')
                                        }]               
                                    });
                                }
                            break;
                        }
                    }
                    
                    if (approvalstatus == 1) { // Esperando aprovação
                        conta = search.lookupFields({type: 'serviceitem',
                            id: parametroScript.getParameter('custscript_rsc_cdt_venda_unidade_1'),
                            columns: ['incomeaccount']
                        }).incomeaccount[0].value;
    
                        arrayLancamentos.push({
                            acao: 'create',
                            transacao: transacao,
                            memo: '',
                            subsidiary: novoRegistro.getValue('subsidiary'),
                            custbody_ref_parcela: novoRegistro.id,
                            line: [{
                                account: parametroScript.getParameter('custscript_rsc_dbt_venda_unidade_1'),
                                debit: total,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            },{
                                account: conta,
                                credit: total,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location')
                            }]               
                        });
                    }

                    if (tipoRenegociacao == 4 && (!pago || pago == 2)) { // Recáculo de Atraso
                        bscTransacao = search.create({type: "journalentry",
                            filters: [
                                ["shipping","is","F"], "AND", 
                                ["taxline","is","F"], "AND", 
                                ["mainline","is","T"], "AND", 
                                ["type","anyof","Journal"], "AND", 
                                ["custbody_ref_parcela","anyof",novoRegistro.id]
                            ],
                            columns: [
                                "datecreated","internalid","custbody_ref_parcela","amount",
                                search.createColumn({name: "formulatext", formula: "{tranid}", label: "Fórmula (texto)"})
                            ]
                        }).run().getRange(0,1000);
                        log.audit(transacao, {bscTransacao: bscTransacao});

                        if (bscTransacao.length > 0) {
                            arrayLancamentos.push({
                                acao: tipo,
                                transacao: transacao,
                                memo: '',
                                subsidiary: novoRegistro.getValue('subsidiary'),
                                custbody_ref_parcela: novoRegistro.id,
                                custbody_rsc_pago: 1,
                                internalid: bscTransacao[0].id,
                                line: [{
                                    account: parametroScript.getParameter('custscript_rsc_cdt_recalculo_atraso_1'),
                                    debit: contabilizacao.cm,
                                    memo: '',
                                    entity: novoRegistro.getValue('entity'),
                                    location: novoRegistro.getValue('location')
                                }]               
                            });
    
                            if (contabilizacao.cm > 0) {
                                var ci = contaItem(novoRegistro.id);
                                
                                for (var key in ci) {                                    
                                    arrayLancamentos[0].line.push({
                                        account: ci[key],
                                        credit: contabilizacao.cm,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    });                                   
                                }                           
                            }
                        }

                        // arrayLancamentos.push({
                        //     acao: 'create',
                        //     transacao: transacao,
                        //     memo: '',
                        //     subsidiary: novoRegistro.getValue('subsidiary'),
                        //     custbody_ref_parcela: novoRegistro.id,
                        //     custbody_rsc_pago: 1,
                        //     line: [{
                        //         account: parametroScript.getParameter('custscript_rsc_cdt_recalculo_atraso_1'),
                        //         debit: contabilizacao.total + contabilizacao.cm,
                        //         memo: '',
                        //         entity: novoRegistro.getValue('entity'),
                        //         location: novoRegistro.getValue('location')
                        //     },{
                        //         account: parametroScript.getParameter('custscript_rsc_dbt_recalculo_atraso_1'),
                        //         credit: contabilizacao.total,
                        //         memo: '',
                        //         entity: novoRegistro.getValue('entity'),
                        //         location: novoRegistro.getValue('location')
                        //     }]               
                        // }); 

                        // if (contabilizacao.cm > 0) {
                        //     var ci = contaItem(novoRegistro.id);
                            
                        //     for (var key in ci) {
                        //         arrayLancamentos[0].line.push({
                        //             account: ci[key],
                        //             credit: contabilizacao.cm,
                        //             memo: '',
                        //             entity: novoRegistro.getValue('entity'),
                        //             location: novoRegistro.getValue('location')
                        //         });
                        //     }                           
                        // }
                    } else if (tipoRenegociacao == 5 && (!pago || pago == 2)) { // Antecipação
                        bscTransacao = search.create({type: "journalentry",
                            filters: [
                                ["shipping","is","F"], "AND", 
                                ["taxline","is","F"], "AND", 
                                ["mainline","is","T"], "AND", 
                                ["type","anyof","Journal"], "AND", 
                                ["custbody_ref_parcela","anyof",novoRegistro.id]
                            ],
                            columns: [
                                "datecreated","internalid","custbody_ref_parcela","amount",
                                search.createColumn({name: "formulatext", formula: "{tranid}", label: "Fórmula (texto)"})
                            ]
                        }).run().getRange(0,1000);
                        log.audit(transacao, {bscTransacao: bscTransacao});

                        if (bscTransacao.length > 0) {
                            arrayLancamentos.push({
                                acao: tipo,
                                transacao: transacao,
                                memo: '',
                                subsidiary: novoRegistro.getValue('subsidiary'),
                                custbody_ref_parcela: novoRegistro.id,
                                custbody_rsc_pago: 1,
                                internalid: bscTransacao[0].id,
                                line: [{
                                    account: parametroScript.getParameter('custscript_rsc_cdt_antecipacao_1'),
                                    debit: contabilizacao.cm,
                                    memo: '',
                                    entity: novoRegistro.getValue('entity'),
                                    location: novoRegistro.getValue('location')
                                }]               
                            });
    
                            if (contabilizacao.cm > 0) {
                                var ci = contaItem(novoRegistro.id);
                                
                                for (var key in ci) {
                                    arrayLancamentos[0].line.push({
                                        account: ci[key],
                                        credit: contabilizacao.cm,
                                        memo: '',
                                        entity: novoRegistro.getValue('entity'),
                                        location: novoRegistro.getValue('location')
                                    });
                                }                           
                            }
                        } 
                        
                        // arrayLancamentos.push({
                        //     acao: 'create',
                        //     transacao: transacao,
                        //     memo: '',
                        //     subsidiary: novoRegistro.getValue('subsidiary'),
                        //     custbody_ref_parcela: novoRegistro.id,
                        //     custbody_rsc_pago: 1,
                        //     line: [{
                        //         account: parametroScript.getParameter('custscript_rsc_cdt_antecipacao_1'),
                        //         debit: contabilizacao.total + contabilizacao.cm,
                        //         memo: '',
                        //         entity: novoRegistro.getValue('entity'),
                        //         location: novoRegistro.getValue('location')
                        //     },{
                        //         account: parametroScript.getParameter('custscript_rsc_dbt_antecipacao_1'),
                        //         credit: contabilizacao.total,
                        //         memo: '',
                        //         entity: novoRegistro.getValue('entity'),
                        //         location: novoRegistro.getValue('location')
                        //     }]               
                        // });

                        // if (contabilizacao.cm > 0) {
                        //     var ci = contaItem(novoRegistro.id);
                            
                        //     for (var key in ci) {
                        //         arrayLancamentos[0].line.push({
                        //             account: ci[key],
                        //             credit: contabilizacao.cm,
                        //             memo: '',
                        //             entity: novoRegistro.getValue('entity'),
                        //             location: novoRegistro.getValue('location')
                        //         });
                        //     }                           
                        // }
                    } 
                    else if ((status == 'Pago integralmente' || status == 'Paid In Full') && (!pago || pago == 2) && !tipoRenegociacao) {
                        bscTransacao = search.create({type: "journalentry",
                            filters: [
                                ["shipping","is","F"], "AND", 
                                ["taxline","is","F"], "AND", 
                                ["mainline","is","T"], "AND", 
                                ["type","anyof","Journal"], "AND", 
                                ["custbody_ref_parcela","anyof",novoRegistro.id]
                            ],
                            columns: [
                                "datecreated","internalid","custbody_ref_parcela","amount",
                                search.createColumn({name: "formulatext", formula: "{tranid}", label: "Fórmula (texto)"})
                            ]
                        }).run().getRange(0,1000);
                        log.audit(transacao, {bscTransacao: bscTransacao});

                        if (bscTransacao.length > 0) {
                            for (i=0; i<bscTransacao.length; i++) {
                                arrayLancamentos.push({
                                    acao: 'delete',
                                    transacao: 'journalentry',
                                    id: bscTransacao[i].id,
                                    tranid: bscTransacao[i].getValue({name: 'formulatext', formula:'{tranid}'})
                                });
                            }
                        } 
                    }
                    
                    if (arrayLancamentos.length > 0) {
                        log.audit('arrayLancamentos', arrayLancamentos);
                        // taskLancamentos(arrayLancamentos);
                    }
                }                
            }
        break;

        case 'creditmemo':
            var status = novoRegistro.getValue('status');
            var pago = novoRegistro.getValue('custbody_rsc_pago');

            // var lkpRenegociacao = search.lookupFields({type: 'customrecord_rsc_tab_efetiva_reparcela',
            //     id: novoRegistro.getValue('custbody_rsc_numero_renegociacao'),
            //     columns: ['custrecord_rsc_tipo_renegociacao', 'custrecord_rsc_contrato_fatura_principal']
            // });
            // log.audit('lkpRenegociacao', lkpRenegociacao);
            
            var subsidiaria = novoRegistro.getValue('subsidiary');
            var total = novoRegistro.getValue('total');

            if (tipo == 'edit') {
                if ((status == 'Valores aplicados completamente' || status == 'Fully Applied') || (!pago || pago == 2)) {
                    for (i=0; i<novoRegistro.getLineCount('apply'); i++) {
                        var apply = novoRegistro.getSublistValue('apply', 'apply', i);
                        var internalid = novoRegistro.getSublistValue('apply', 'internalid', i);
                        var trantype = novoRegistro.getSublistValue('apply', 'trantype', i); 
                        if (trantype == 'CustInvc' && apply == true)
                        break;
                    }
                    
                    if (internalid) {
                        arrayLancamentos.push({
                            acao: tipo,
                            transacao: transacao,
                            memo: '',
                            subsidiary: novoRegistro.getValue('subsidiary'),
                            custbody_ref_parcela: novoRegistro.id,
                            custbody_lrc_fatura_principal: internalid,
                            line: [{
                                account: contaSubsidiaria(subsidiaria),
                                debit: total,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location'),
                                custcol_rsc_devido_subsidiary: subsidiaria
                            }]               
                        });
                    }                    

                    var cm = {
                        amount: 0
                    }

                    for (i=0; i<novoRegistro.getLineCount('item'); i++) {
                        var item = novoRegistro.getSublistValue('item', 'item', i);
                        var amount = novoRegistro.getSublistValue('item', 'amount', i);

                        var itemAccount = search.lookupFields({type: 'serviceitem',
                            id: item,
                            columns: ['incomeaccount']
                        });
                        log.audit('itemAccount', itemAccount);

                        // if (item == 28650) {
                        //     arrayLancamentos[0].line.push({
                        //         account: parametroScript.getParameter('custscript_rsc_cdt_pagamento_fatura_1'),
                        //         credit: amount,
                        //         memo: '',
                        //         entity: novoRegistro.getValue('entity'),
                        //         location: novoRegistro.getValue('location')
                        //     });
                        // }

                        if (item == 28650 || item == 28651 || item == 28652 || item == 30697 || item == 30698) {
                            cm.amount = cm.amount + amount;

                            if (!cm.account && (item == 28651 || item == 28652 || item == 30697 || item == 30698)) {
                                cm.account = itemAccount.incomeaccount[0].value;
                            }
                        } else {
                            arrayLancamentos[0].line.push({
                                account: itemAccount.incomeaccount[0].value,
                                credit: amount,
                                memo: '',
                                entity: novoRegistro.getValue('entity'),
                                location: novoRegistro.getValue('location'),
                                custcol_rsc_devido_subsidiary: subsidiaria
                            });
                        }
                    }

                    if (cm.amount > 0) {
                        arrayLancamentos[0].line.push({
                            account: cm.account ? cm.account : novoRegistro.getValue('account'),
                            credit: cm.amount,
                            memo: '',
                            entity: novoRegistro.getValue('entity'),
                            location: novoRegistro.getValue('location'),
                            custcol_rsc_devido_subsidiary: subsidiaria
                        });
                    }                    
                }                

                if (arrayLancamentos.length > 0) {
                    log.audit('arrayLancamentos', arrayLancamentos);
                    taskLancamentos(arrayLancamentos);
                }                     
            } 
        break;

        case 'customerpayment': 
            if (tipo == 'create' || tipo == 'edit') {  
                var id_url_transacao = novoRegistro.getValue('custbody_rsc_id_url_transacao');
                log.audit('id_url_transacao', id_url_transacao);              
                var subsidiaria = novoRegistro.getValue('subsidiary');
                var total = novoRegistro.getValue('applied');

                // for (i=0; i<novoRegistro.getLineCount('apply'); i++) {
                //     var amount = novoRegistro.getSublistValue('apply', 'amount', i);
                //     var aplicado = novoRegistro.getSublistValue('apply', 'apply', i);
                //     var internalid = novoRegistro.getSublistValue('apply', 'internalid', i);
                //     var tipoTransacao = novoRegistro.getSublistValue('apply', 'trantype', i);
                    
                //     if (aplicado == true && tipoTransacao == 'CustInvc') {
                        if (id_url_transacao) {
                            var sql = "select a.custbody_rsc_projeto_obra_gasto_compra, a.custbody_lrc_fatura_principal, a.entity, a.transferlocation, "+
                            "b.item, b.foreignamount, b.location, b.subsidiary, "+
                            "c.id, c.companyname "+
                            "from transaction a "+
                            "join transactionline b on b.transaction = a.id "+
                            "join job c on c.id = a.custbody_rsc_projeto_obra_gasto_compra "+
                            "where a.id = ? "+
                            "and b.item is not null ";

                            var consulta = query.runSuiteQL({
                                query: sql,
                                params: [id_url_transacao]
                            });

                            var sqlResults = consulta.asMappedResults();
                            log.audit('CustInvc', sqlResults);

                            // var loadReg = record.load({type: 'invoice', id: internalid});

                            var nomeProjeto = {
                                text: sqlResults[0].companyname,
                                value: sqlResults[0].id
                            }
                            log.audit('nomeProjeto', nomeProjeto);

                            var lkpProjeto = search.lookupFields({type: 'job',
                                id: nomeProjeto.value,
                                columns: [
                                    'companyname','custentity_rsc_securitizado','subsidiary','custentity_rsc_d_baixa_clientes','custentity_rsc_c_baixa_clientes','custentity_rsc_d_receb_clientes','custentity_rsc_c_receb_clientes'
                                ]
                            });
                            log.audit('lkpProjeto', lkpProjeto); 

                            if (lkpProjeto.custentity_rsc_securitizado[0]) {
                                var bsc_cnab_conta_bancaria = search.create({type: "customrecord_rsc_cnab_bankaccount",
                                    filters: [
                                       ["custrecord_rsc_cnab_ba_entity_ls","anyof",lkpProjeto.custentity_rsc_securitizado[0].value]
                                    ],
                                    columns: [
                                       search.createColumn({name: "custrecord_rsc_cnab_ba_accounting_ls", label: "Conta Contábil"})
                                    ]
                                }).run().getRange(0,1);
                                log.audit('bsc_cnab_conta_bancaria', bsc_cnab_conta_bancaria);

                                if (bsc_cnab_conta_bancaria.length > 0) {
                                    if (lkpProjeto.custentity_rsc_c_baixa_clientes[0] && lkpProjeto.custentity_rsc_d_receb_clientes[0] && lkpProjeto.custentity_rsc_c_receb_clientes[0]) {
                                        arrayLancamentos.push({
                                            acao: 'create',
                                            transacao: transacao,   
                                            memo: 'Securitização: Projeto '+lkpProjeto.companyname,
                                            subsidiary: novoRegistro.getValue('subsidiary'),
                                            custbody_rsc_projeto_obra_gasto_compra: nomeProjeto.value,
                                            custbody_ref_parcela: novoRegistro.id,
                                            custbody_lrc_fatura_principal: sqlResults[0].custbody_lrc_fatura_principal,
                                            // custbody_lrc_fatura_principal: loadReg.getValue('custbody_lrc_fatura_principal'),
                                            custbody_rsc_empproj_securitizado: true,
                                            line: [{
                                                account: bsc_cnab_conta_bancaria[0].getValue('custrecord_rsc_cnab_ba_accounting_ls'),
                                                debit: novoRegistro.getValue('total'),
                                                memo: 'Securitização: Projeto '+lkpProjeto.companyname,
                                                entity: '',
                                                location: '',
                                                custcol_rsc_devido_subsidiary: lkpProjeto.subsidiary[0].value
                                                
                                            },{
                                                account: lkpProjeto.custentity_rsc_c_baixa_clientes[0].value,
                                                credit: novoRegistro.getValue('total'),
                                                memo: 'Securitização: Projeto '+lkpProjeto.companyname,
                                                entity: '',
                                                location: '',
                                                custcol_rsc_devido_subsidiary: lkpProjeto.subsidiary[0].value
                                            },{
                                                account: lkpProjeto.custentity_rsc_d_receb_clientes[0].value,
                                                debit: novoRegistro.getValue('total'),
                                                memo: 'Securitização: Projeto '+lkpProjeto.companyname,
                                                entity: '',
                                                location: '',
                                                custcol_rsc_devido_subsidiary: lkpProjeto.subsidiary[0].value
                                            },{
                                                account: lkpProjeto.custentity_rsc_c_receb_clientes[0].value,
                                                credit: novoRegistro.getValue('total'),
                                                memo: 'Securitização: Projeto '+lkpProjeto.companyname,
                                                entity: '',
                                                location: '',
                                                custcol_rsc_devido_subsidiary: lkpProjeto.subsidiary[0].value
                                            }]               
                                        });
                                    }                                    
                                }                                
                            } else {
                                arrayLancamentos.push({
                                    // acao: tipo,
                                    acao: 'create',
                                    transacao: transacao,
                                    memo: '',
                                    subsidiary: novoRegistro.getValue('subsidiary'),
                                    custbody_ref_parcela: novoRegistro.id,
                                    custbody_lrc_fatura_principal: sqlResults[0].custbody_lrc_fatura_principal,
                                    // custbody_lrc_fatura_principal: loadReg.getValue('custbody_lrc_fatura_principal'),
                                    line: []               
                                });                              
                            }

                            var cm = {
                                amount: 0
                            }

                            // 2811020100 APROPRIAÇÃO RECEITA IMOBILIÁRIA FISCAL - MÊS
                            var conta_ApropriacaoReceitaImobiliariaFiscal = 0;
                            // conta_ApropriacaoReceitaImobiliariaFiscal = conta_ApropriacaoReceitaImobiliariaFiscal + total;
        
                            for (i=0; i<sqlResults.length; i++) {
                                var item = sqlResults[i].item;
                                var amount = Math.abs(sqlResults[i].foreignamount);
                                var itemAccount = search.lookupFields({type: 'serviceitem',
                                    id: item,
                                    columns: ['incomeaccount']
                                });
                                log.audit('itemAccount', itemAccount);
        
                                if (item == 28650) {
                                    conta_ApropriacaoReceitaImobiliariaFiscal = conta_ApropriacaoReceitaImobiliariaFiscal + amount;
                                    arrayLancamentos[0].line.push({
                                        account: parametroScript.getParameter('custscript_rsc_dbt_apropriacao_1'),
                                        debit: amount,
                                        memo: '',
                                        entity: sqlResults[0].entity,
                                        location: sqlResults[0].location,
                                        custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                        custcol_rsc_fieldcliente: nomeProjeto.value
                                        // entity: loadReg.getValue('entity'),
                                        // location: loadReg.getValue('location')
                                    });

                                    /** Contas de resultado 
                                     * 3111100100 – Receita Imobiliária Fiscal */
                                    arrayLancamentos[0].line.push({
                                        account: parametroScript.getParameter('custscript_rsc_cdt_receita_imob_fiscal_1'),
                                        credit: amount,
                                        memo: '',
                                        entity: sqlResults[0].entity,
                                        location: sqlResults[0].location,
                                        custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                        custcol_rsc_fieldcliente: nomeProjeto.value
                                        // entity: loadReg.getValue('entity'),
                                        // location: loadReg.getValue('location')
                                    });
                                }
        
                                if (item == 28651 || item == 28652 || item == 30694 || item == 30697 || item == 30698) {
                                    cm.amount = cm.amount + amount;
                                    conta_ApropriacaoReceitaImobiliariaFiscal += cm.amount;
        
                                    if (!cm.account && (item == 28651 || item == 28652 || item == 30697 || item == 30698)) {
                                        cm.account = parametroScript.getParameter('custscript_rsc_dbt_apropriacao_2');
                                    }
                                }
                            }
                            
                            if (cm.amount) {
                                arrayLancamentos[0].line.push({
                                    account: cm.account,
                                    debit: cm.amount,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });

                                arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_cdt_apropriacao_1'),
                                    credit: conta_ApropriacaoReceitaImobiliariaFiscal,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });

                                arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_cdt_apropriacao_1'),
                                    debit: conta_ApropriacaoReceitaImobiliariaFiscal,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });

                                /** Contas de resultado 
                                 * 3111100200 - Receita Imobiliária Fiscal – Var. Monetária */
                                arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_cdt_rec_imo_fis_var_mon_1'),
                                    credit: cm.amount,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });

                                /** Contas de neutralização 
                                 * 2811040100 - Neutralização Receita Fiscal
                                 * 3111190100 - Neutralização Receita Fiscal */
                                 arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_dbt_neutra_receita_fisc_1'),
                                    debit: conta_ApropriacaoReceitaImobiliariaFiscal,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });

                                arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_cdt_neutra_receita_fisc_1'),
                                    credit: conta_ApropriacaoReceitaImobiliariaFiscal,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });
                            } else {
                                arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_cdt_apropriacao_1'),
                                    credit: conta_ApropriacaoReceitaImobiliariaFiscal,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });

                                /** Contas de resultado 
                                 * 3111100100 – Receita Imobiliária Fiscal */
                                 arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_cdt_receita_imob_fiscal_1'),
                                    debit: conta_ApropriacaoReceitaImobiliariaFiscal,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });

                                /** Contas de neutralização 
                                 * 2811040100 - Neutralização Receita Fiscal
                                 * 3111190100 - Neutralização Receita Fiscal */
                                 arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_dbt_neutra_receita_fisc_1'),
                                    debit: conta_ApropriacaoReceitaImobiliariaFiscal,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });

                                arrayLancamentos[0].line.push({
                                    account: parametroScript.getParameter('custscript_rsc_cdt_neutra_receita_fisc_1'),
                                    credit: conta_ApropriacaoReceitaImobiliariaFiscal,
                                    memo: '',
                                    entity: sqlResults[0].entity,
                                    location: sqlResults[0].location,
                                    custcol_rsc_devido_subsidiary: sqlResults[0].subsidiary,
                                    custcol_rsc_fieldcliente: nomeProjeto.value
                                    // entity: loadReg.getValue('entity'),
                                    // location: loadReg.getValue('location')
                                });
                            }                         

                            // conta = search.lookupFields({type: 'serviceitem',
                            //     id: parametroScript.getParameter('custscript_rsc_cdt_pagamento_fatura_1'),
                            //     columns: ['incomeaccount']
                            // }).incomeaccount[0].value;
                        
                            // arrayLancamentos.push({
                            //     acao: tipo,
                            //     transacao: transacao,
                            //     memo: '',
                            //     subsidiary: novoRegistro.getValue('subsidiary'),
                            //     custbody_lrc_fatura_principal: loadReg.getValue('custbody_lrc_fatura_principal'),
                            //     custbody_ref_parcela: novoRegistro.id,
                            //     line: [{
                            //         account: parametroScript.getParameter('custscript_rsc_dbt_pagamento_fatura_1'),
                            //         debit: amount,
                            //         memo: '',
                            //         entity: novoRegistro.getValue('entity'),
                            //         location: novoRegistro.getValue('location')
                            //     },{
                            //         account: conta,
                            //         credit: amount,
                            //         memo: '',
                            //         entity: novoRegistro.getValue('entity'),
                            //         location: novoRegistro.getValue('location')
                            //     }]               
                            // }); 
                        }
                                             
                    // }
                // }

                if (arrayLancamentos.length > 0) {          
                    log.audit('arrayLancamentos', arrayLancamentos);
                    taskLancamentos(arrayLancamentos);
                }
            } 
        break;

        case 'job': 
            if (tipo == 'edit') {
                var securitizado = novoRegistro.getValue('custentity_rsc_securitizado');
                
                if (securitizado == true) {
                    bscTransacao = search.create({type: "journalentry",
                        filters: [
                            ["shipping","is","F"], "AND", 
                            ["taxline","is","F"], "AND", 
                            ["mainline","is","T"], "AND", 
                            ["type","anyof","Journal"], "AND", 
                            ["custbody_rsc_projeto_obra_gasto_compra","anyof",novoRegistro.id], "AND",
                            ["custbody_rsc_empproj_securitizado","is","T"]
                        ],
                        columns: [
                            "datecreated","internalid","custbody_ref_parcela","amount",
                            search.createColumn({name: "formulatext", formula: "{tranid}", label: "Fórmula (texto)"})
                        ]
                    }).run().getRange(0,1000);
                    log.audit(transacao, {bscTransacao: bscTransacao});

                    if (bscTransacao.length == 0) {
                        bscTransacao = search.create({type: "invoice",
                            filters: [
                                ["shipping","is","F"], "AND", 
                                ["taxline","is","F"], "AND", 
                                ["mainline","is","T"], "AND", 
                                ["type","anyof","CustInvc"], "AND",
                                ["custbody_rsc_projeto_obra_gasto_compra","anyof",novoRegistro.id]
                            ],
                            columns: [
                                "internalid","entity","location","tranid","trandate","total"
                            ]
                        }).run().getRange(0,1000);
                        log.audit(transacao, {bscTransacao: bscTransacao});

                        if (bscTransacao.length > 0) {
                            for (i=0; i<bscTransacao.length; i++) {
                                arrayLancamentos.push({
                                    acao: 'create',
                                    transacao: transacao,
                                    memo: 'Securitização: Projeto '+novoRegistro.getValue('companyname'),
                                    subsidiary: novoRegistro.getValue('subsidiary'),
                                    custbody_rsc_projeto_obra_gasto_compra: novoRegistro.id,
                                    custbody_ref_parcela: bscTransacao[i].id,
                                    custbody_rsc_empproj_securitizado: true,
                                    line: [{
                                        account: novoRegistro.getValue('custentity_rsc_d_const_div_gar_op'),
                                        debit: bscTransacao[i].getValue('total'),
                                        memo: 'Securitização: Projeto '+novoRegistro.getValue('companyname'),
                                        entity: bscTransacao[i].getValue('entity'),
                                        location: bscTransacao[i].getValue('location')
                                    },{
                                        account: novoRegistro.getValue('custentity_rsc_c_const_div_gar_op'),
                                        credit: bscTransacao[i].getValue('total'),
                                        memo: 'Securitização: Projeto '+novoRegistro.getValue('companyname'),
                                        entity: bscTransacao[i].getValue('entity'),
                                        location: bscTransacao[i].getValue('location')
                                    }]               
                                });
                            }
                        }

                        if (arrayLancamentos.length > 0) {
                            scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 1534,                            
                                params: {
                                    custscript_rsc_journal_entries: arrayLancamentos
                                }
                            });

                            scriptTaskId = scriptTask.submit();
                            log.audit('task', {scriptTaskId: scriptTaskId, scriptTask: scriptTask});
                        } 
                    }

                    
                }
            }
        break;

        case 'deposit':
            if (tipo == 'create') {
                var nomeProjeto = {
                    text: novoRegistro.getText('custbody_rsc_projeto_obra_gasto_compra'),
                    value: novoRegistro.getValue('custbody_rsc_projeto_obra_gasto_compra')
                }
                log.audit('nomeProjeto', nomeProjeto);

                var lkpProjeto = search.lookupFields({type: 'job',
                    id: nomeProjeto.value,
                    columns: ['companyname','custentity_rsc_securitizado','custentity_rsc_c_liberacao_recursos','custentity_rsc_d_liberacao_recursos']
                });
                log.audit('lkpProjeto', lkpProjeto);

                if (lkpProjeto.custentity_rsc_securitizado[0]) {
                    arrayLancamentos.push({
                        acao: tipo,
                        transacao: transacao,   
                        memo: 'Securitização: Projeto '+lkpProjeto.companyname,
                        subsidiary: novoRegistro.getValue('subsidiary'),
                        custbody_rsc_projeto_obra_gasto_compra: nomeProjeto.value,
                        custbody_ref_parcela: novoRegistro.id,
                        custbody_lrc_fatura_principal: novoRegistro.id,
                        line: [{
                            account: lkpProjeto.custentity_rsc_d_liberacao_recursos[0].value,
                            debit: novoRegistro.getValue('total'),
                            memo: 'Securitização: Projeto '+lkpProjeto.companyname,
                            entity: '',
                            location: ''
                        },{
                            account: lkpProjeto.custentity_rsc_c_liberacao_recursos[0].value,
                            credit: novoRegistro.getValue('total'),
                            memo: 'Securitização: Projeto '+lkpProjeto.companyname,
                            entity: '',
                            location: ''
                        }]               
                    });
                    log.audit('arrayLancamentos', arrayLancamentos);

                    if (arrayLancamentos.length > 0) {
                        scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 1534,                            
                            params: {
                                custscript_rsc_journal_entries: arrayLancamentos
                            }
                        });

                        scriptTaskId = scriptTask.submit();
                        log.audit('task', {scriptTaskId: scriptTaskId, scriptTask: scriptTask});
                    } 
                }
            }
        break;
    } 
}

return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
}
});
