/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
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

function execute(context) {
    log.audit('execute', context);

    var bsc_pedidos_csv = search.create({type: "purchaseorder",
        filters: [
           ["mainline","is","T"], "AND", 
           ["type","anyof","PurchOrd"], "AND", 
           ["source","anyof","CSV"], "AND", 
           ["custbody_rsc_tipo_transacao_workflow","anyof","15","21"], "AND", // DP - Despesas ou DP - Recursos Humanos
           ["custbody_rsc_tratativas_csv","isempty",""]
        ],
        columns: [
            search.createColumn({name: "datecreated", sort: search.Sort.DESC, label: "Data de criação"}),
            "tranid","source","custbody_rsc_tipo_transacao_workflow","custbody_rsc_tratativas_csv"
        ]
    }).run().getRange(0,1000);
    log.audit('bsc_pedidos_csv', bsc_pedidos_csv);

    if (bsc_pedidos_csv.length > 0) {
        for (var prop in bsc_pedidos_csv) {
            if (bsc_pedidos_csv.hasOwnProperty(prop)) {
                atualizar_linhas_pedido(bsc_pedidos_csv[prop].recordType, bsc_pedidos_csv[prop].id);
            }
        }
    }
}

return {
    execute: execute
}
});
