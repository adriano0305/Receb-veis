/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
*/

const dados = {
    memo: {
        fornecedores: 'Segregação de Fornecedores',
        curtoPrazo: 'Segregação de Curto Prazo',
        longoPrazo: 'Segregação de Longo Prazo'
    },
    contas: {
        fornecedores: 28406,
        curtoPrazo: 28416,
        longoPrazo: 28877
    },
    opcoes: {
        enableSourcing: true,
        ignoreMandatoryFields: true
    }
}

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
            options: dados.opcoes
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
    // log.audit('map', context);

    var jsonLancamentos = JSON.parse(context.value);
    log.audit('jsonLancamentos', jsonLancamentos);

    try {       
        var lancamento = record.create({type: 'journalentry', isDynamic: true});

        lancamento.setValue('trandate', formatData(jsonLancamentos.dataSegregacao.text))
        .setValue('custbody_gaf_vendor', jsonLancamentos.vendor)
        .setValue('subsidiary', jsonLancamentos.subsidiary)
        .setValue('custbodysegregacao_curt_long', jsonLancamentos.checkbox)
        .setValue('custbody_ref_parcela_2',jsonLancamentos.idFatura)
        .setValue('memo', dados.memo.fornecedores);
        
        // if (jsonLancamentos.tipoSegreg == "Curto Prazo") {
        //     lancamento.setValue('memo', dados.memo.curtoPrazo)
        //     .selectNewLine('line')
        //     .setCurrentSublistValue('line', 'debit', jsonLancamentos.valor)
        //     .setCurrentSublistValue('line', 'memo', dados.memo.curtoPrazo)
        //     .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
        //     .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
        //     .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente', jsonLancamentos.nomeProjeto)
        //     .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
        //     .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
        //     .setCurrentSublistValue('line', "account", dados.contas.curtoPrazo) // FORNECEDORES - SEGREGAÇÃO CP
        //     .commitLine('line');
        // } else {
        //     lancamento.setValue('memo', dados.memo.longoPrazo)
        //     .selectNewLine('line')
        //     .setCurrentSublistValue('line', 'debit', jsonLancamentos.valor)
        //     .setCurrentSublistValue('line', 'memo', dados.memo.longoPrazo)
        //     .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
        //     .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
        //     .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente', jsonLancamentos.nomeProjeto)
        //     .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
        //     .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
        //     .setCurrentSublistValue('line', "account", dados.contas.longoPrazo) // FORNECEDORES - SEGREGAÇÃO LP
        //     .commitLine('line');
        // }

        lancamento.selectNewLine('line', 0)
        .setCurrentSublistValue('line', 'debit', jsonLancamentos.valor)
        .setCurrentSublistValue('line', 'memo', dados.memo.curtoPrazo)
        .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
        .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
        .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente', jsonLancamentos.nomeProjeto)
        .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
        .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
        .setCurrentSublistValue('line', "account", dados.contas.curtoPrazo) // FORNECEDORES - SEGREGAÇÃO CP
        .commitLine('line');

        lancamento.selectNewLine('line', 1)
        .setCurrentSublistValue('line', 'credit', jsonLancamentos.valor)
        .setCurrentSublistValue('line', 'memo', dados.memo.longoPrazo)
        .setCurrentSublistValue('line', 'department', jsonLancamentos.departamento)
        .setCurrentSublistValue('line', 'class', jsonLancamentos.etapaProjeto)
        .setCurrentSublistValue('line', 'custcol_rsc_fieldcliente',jsonLancamentos.nomeProjeto)
        .setCurrentSublistValue('line', 'entity', jsonLancamentos.vendor)
        .setCurrentSublistValue('line', 'location', jsonLancamentos.location)
        .setCurrentSublistValue('line', 'account', dados.contas.longoPrazo) // FORNECEDORES - SEGREGAÇÃO LP
        .commitLine('line');

        var idLancamento = lancamento.save(dados.opcoes);
        log.audit('idLancamento', idLancamento);

        jsonLancamentos.idLancamento = idLancamento;

        atualizaTransacao(jsonLancamentos);    
    } catch(e) {
        log.error('Erro idFatura', {idFatura: jsonLancamentos[i].idFatura, msg: e});
        jsonLancamentos.msg = e;
        atualizaTransacao(jsonLancamentos);
    }
}

function getInputData(context) {
    log.audit('getInputData', context);

    const scriptAtual = runtime.getCurrentScript();

    const parametro = JSON.parse(scriptAtual.getParameter({name: 'custscript_rsc_json_lancamentos_segreg'}));
    // log.audit('parametro', parametro);

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