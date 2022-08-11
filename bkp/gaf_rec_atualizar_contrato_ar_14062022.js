/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
const atualizarDados = (tipo, id, campos) => {
    log.audit('atualizarDados', {tipo: tipo, id: id, campos: campos});

    record.submitFields({type: tipo,
        id: id,
        values: campos,
        options: opcoes            
    });

    log.audit('atualizarDados', {status: 'Sucesso', tipo: tipo, id: id, campos: campos});
}

const gerarEscritura = (idPedido) => {
    log.audit('gerarEscritura', idPedido);

    var lkpSO = search.lookupFields({type: 'salesorder',
        id: idPedido,
        columns: ['entity','custbody_rsc_projeto_obra_gasto_compra','custbody_rsc_tran_unidade','custbody_lrc_fat_controle_escrituracao']
    });

    if (!!lkpSO.custbody_lrc_fat_controle_escrituracao) {
        var escrituracao = record.create({type: 'customrecord_lrc_controle_escrituracao'});

        var hoje = new Date();
        var umAno = new Date();
        umAno.setDate(umAno.getDate()+365)
        var umAnoE1Dia = new Date();
        umAnoE1Dia.setDate(umAnoE1Dia.getDate()+366)

        escrituracao.setValue('custrecord_lrc_fatura_de_venda', idPedido)
        .setValue('custrecord_lrc_cliente_ce', lkpSO.entity[0].value)
        .setValue('custrecord_lrc_empreendimento_fatura', lkpSO.custbody_rsc_projeto_obra_gasto_compra[0] ? lkpSO.custbody_rsc_projeto_obra_gasto_compra[0].value : '')
        .setValue('custrecord_lrc_unidade_vendida', lkpSO.custbody_rsc_tran_unidade[0] ? lkpSO.custbody_rsc_tran_unidade[0].value : '')
        .setValue('custrecord_lrc_tipo_escrituracao', 1)    
        .setValue('custrecord_lrc_status_escrituracao', 1)
        .setValue('custrecord_lrc_data_escrituracao', hoje)
        .setValue('custrecord_lrc_data_entrega_construcao', umAno)
        .setValue('custrecord_lrc_data_procurador', umAnoE1Dia);

        var idEscrituracao = escrituracao.save();
        log.audit('Contrato', {idEscrituracao: idEscrituracao, idPedido: idPedido, tranid: lkpSO.tranid});

        if (idEscrituracao) {
            var campos = {
                custbody_lrc_fat_controle_escrituracao: idEscrituracao
            } 

            atualizarDados('salesorder', idPedido, campos);
        }
    }
}
const approvalStatus = (idContrato) => {
    log.audit('approvasStatus', idContrato);

    var bscTransacao = search.create({type: "invoice",
        filters: [
            ["shipping","is","F"], "AND", 
            ["taxline","is","F"], "AND", 
            ["mainline","is","T"], "AND", 
            ["type","anyof","CustInvc"], "AND", 
            ["custbody_lrc_fatura_principal","anyof",idContrato]
        ],
        columns: [
            "internalid","tranid","trandate","total"
        ]
    }).run().getRange(0,1000);
    log.audit('bscTransacao', bscTransacao);

    if (bscTransacao.length > 0) {
        var campos = {
            approvalstatus: 2, // Aprovado
            custbody_rsc_tipo_transacao_workflow: 102 // PV - Contrato
        }

        for (i=0; i<bscTransacao.length; i++) {      
            atualizarDados('invoice', bscTransacao[i].id, campos);
        }
    }
}

const onRequest = (context) => {
    log.audit('onRequest', context);
    
    const metodo = context.request.method;

    const parametros = context.request.parameters;

    const response = context.response;
    
    log.audit(metodo, parametros);

    if (metodo == 'POST') {
        approvalStatus(parametros.id);
        gerarEscritura(parametros.id);
    }
}

return {
    onRequest: onRequest
}
});
