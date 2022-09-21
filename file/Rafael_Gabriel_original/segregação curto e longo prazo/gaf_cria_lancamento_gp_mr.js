/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
*/
define(['N/search', 'N/log', 'N/record', 'N/runtime'], function(search, log, record, runtime) {
function atualizaTransacao(json) {
    log.audit('atualizaTransacao', json);

    var objLancamento = {};

    if (json.idLancamento) { 
        objLancamento.custbody_rsc_lancamento_segreg_forn = json.idLancamento;
    } 

    if (json.msg) {
        objLancamento.custbody_rsc_erro_segrega_fornecedor = json.msg;
    }
    log.audit('objLancamento', objLancamento);

    try {
        record.submitFields({type: 'vendorbill',
            id: json.idFatura,
            values: objLancamento,
            options: {
                enableSourcing: true,
                ignoreMandatoryFields: true
            }        
        });
        log.audit('Sucesso', json.idFatura);
    } catch(e) {
        log.error('Erro', {idFatura: json.idFatura, msg: e});
    }
}

function formatData(data) {
    var partesData = data.split("/");
    var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);
    return novaData;
}

function summarize(summary) {
    var type = summary.toString();
    log.audit(type, 
        '"Uso Consumido:" '+summary.usage+
        ', "Número de Filas:" '+summary.concurrency+
        ', "Quantidade de Saídas:" '+summary.yields
    );
    var contents = '';
    summary.output.iterator().each(function (key, value) {
        contents += (key + ' ' + value + '\n');
        return true;
    });
}

function reduce(context) {
    log.audit('reduce', context);

    var jsonLancamentos = JSON.parse(context.values);
    log.audit('jsonLancamentos', jsonLancamentos);

    var objLancamento = {};

    if (jsonLancamentos.idLancamento) { 
        objLancamento.custbody_rsc_lancamento_segreg_forn = jsonLancamentos.idLancamento;
    } 

    if (jsonLancamentos.msg) {
        objLancamento.custbody_rsc_erro_segrega_fornecedor = jsonLancamentos.msg;
    }
    //log.audit('objLancamento', objLancamento);

    // try {
        record.submitFields({type: 'vendorbill',
            id: jsonLancamentos.idFatura,
            values: objLancamento,
            options: {
                enableSourcing: true,
                ignoreMandatoryFields: true
            }        
        });
        log.audit('Sucesso', jsonLancamentos.idFatura);
    // } catch(e) {
    //     log.error('Erro', {idFatura: jsonLancamentos.idFatura, msg: e});
    // }
}

function map(context) {
    log.audit('map', context);

    var jsonLancamentos = JSON.parse(context.value);
    //log.audit('jsonLancamentos', jsonLancamentos);

    try {       
        var lancamento = record.create({type: 'journalentry', isDynamic: true});

        lancamento.setValue('trandate', formatData(jsonLancamentos.dataSegregacao.text))
        .setValue('custbody_gaf_vendor', jsonLancamentos.vendor)
        .setValue('subsidiary', jsonLancamentos.subsidiary)
        .setValue('custbodysegregacao_curt_long', jsonLancamentos.checkbox)
        .setValue('custbody_ref_parcela_2',jsonLancamentos.idFatura);
        
        // if (jsonLancamentos.curtoPrazo > 0 && jsonLancamentos.longoPrazo > 0) {
        //     log.audit('Aqui 1', jsonLancamentos);
        //     lancamento.setValue('memo', 'Segregação de Curto Prazo')
        //     .selectNewLine('line')
        //     .setCurrentSublistValue('line', 'debit', jsonLancamentos.curtoPrazo)
        //     .setCurrentSublistValue('line', 'memo', "Segregação de Curto Prazo")
        //     .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
        //     .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
        //     .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente', jsonLancamentos.nomeProjeto)
        //     .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
        //     .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
        //     .setCurrentSublistValue('line', "account", 924) // (DÉBITO) Curto Prazo
        //     .commitLine('line');

        //     lancamento.setValue('memo', 'Segregação de Longo Prazo')
        //     .selectNewLine('line')
        //     .setCurrentSublistValue('line', 'debit', jsonLancamentos.longoPrazo)
        //     .setCurrentSublistValue('line', 'memo', "Segregação de Longo Prazo")
        //     .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
        //     .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
        //     .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente', jsonLancamentos.nomeProjeto)
        //     .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
        //     .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
        //     .setCurrentSublistValue('line', "account", 1331) // (DÉBITO) Longo Prazo
        //     .commitLine('line');
        // } else 
        if (jsonLancamentos.tipoSegreg == "Curto Prazo") {
            lancamento.setValue('memo', 'Segregação de Curto Prazo')
            .selectNewLine('line')
            .setCurrentSublistValue('line', 'debit', jsonLancamentos.valor)
            .setCurrentSublistValue('line', 'memo', "Segregação de Curto Prazo")
            .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
            .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
            .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente', jsonLancamentos.nomeProjeto)
            .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
            .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
            .setCurrentSublistValue('line', "account", 924) // (DÉBITO) Curto Prazo 
            .commitLine('line');
        } else {
            lancamento.setValue('memo', 'Segregação de Longo Prazo')
            .selectNewLine('line')
            .setCurrentSublistValue('line', 'debit', jsonLancamentos.valor)
            .setCurrentSublistValue('line', 'memo', "Segregação de Longo Prazo")
            .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
            .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
            .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente', jsonLancamentos.nomeProjeto)
            .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
            .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
            .setCurrentSublistValue('line', "account", 1331) // (DÉBITO) Longo Prazo
            .commitLine('line');
        }

        lancamento.selectNewLine('line')
        .setCurrentSublistValue('line', 'credit', jsonLancamentos.valor)
        .setCurrentSublistValue('line', 'memo', "Segregação de Fornecedores")
        .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
        .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
        .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente',jsonLancamentos.nomeProjeto)
        .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
        .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
        .setCurrentSublistValue('line', 'account', 914) // (CRÉDITO) Segregação de Fornecedores
        .commitLine('line');

        var idLancamento = lancamento.save( {enableSourcing: true, ignoreMandatoryFields: true});
        log.audit('idLancamento', idLancamento);

        jsonLancamentos.idLancamento = idLancamento;

        atualizaTransacao(jsonLancamentos);    
    } catch(e) {
        log.error('Erro idFatura', {idFatura: jsonLancamentos[i].idFatura, msg: e});
        jsonLancamentos.msg = e;
        // context.write(context.key, jsonLancamentos);
        atualizaTransacao(jsonLancamentos);
    }
}

function getInputData(context) {
    log.audit('getInputData', context);

    const scriptAtual = runtime.getCurrentScript();

    const parametro = JSON.parse(scriptAtual.getParameter({name: 'custscript_rsc_json_lancamentos_segreg'}));
    //log.audit('parametro', parametro);

    // [{
    //     "data": "2022-03-29T03:00:00.000Z",
    //     "subsidiary": "302",
    //     "vendor": "3564",
    //     "numeroParcelas": "",
    //     "status": "Não pago",
    //     "valor": 2.7,
    //     "fatura": "",
    //     "checkbox": true,
    //     "idFatura": "225125",
    //     "curtoPrazo": 2.7,
    //     "longoPrazo": 0
    // }]

    return parametro;
}

return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
}
});