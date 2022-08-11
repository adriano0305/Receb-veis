/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

const opcoes = {
    enablesourcing: true,
    ignoreMandatoryFields: true
}

define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
const dadosEmpreendimento = (empreendimento) => {
    if (empreendimento.value) {
        var bscJob = search.create({type: "job",
            filters: [
               ["internalid","anyof",empreendimento.value]
            ],
            columns: [
                "datecreated","altname","calculatedenddate","custentity_rsc_matric_arq"
            ]
        }).run().getRange(0,1);
        // log.audit('bscJob', bscJob);

        if (bscJob.length > 0)
        return {
            calculatedenddate: bscJob[0].getText('calculatedenddate'),
            custentity_rsc_matric_arq: bscJob[0].getValue('custentity_rsc_matric_arq')
        }
    } else {
        return {
            calculatedenddate: '',
            custentity_rsc_matric_arq: ''
        }
    }
}

const atualizarDados = (tipo, id, campos) => {
    // log.audit('atualizarDados', {tipo: tipo, id: id, campos: campos});

    record.submitFields({type: tipo,
        id: id,
        values: campos,
        options: opcoes            
    });

    log.audit('atualizarDados', {status: 'Sucesso', tipo: tipo, id: id, campos: campos});
}

const dadosEscrituracao = (idPedido, empreendimento) => {
    var bscParcelasAlienacao = search.create({type: "invoice",
        filters: [
           ["mainline","is","T"], "AND", 
           ["type","anyof","CustInvc"], "AND", 
           ["custbody_lrc_fatura_principal","anyof",idPedido]
        ],
        columns: [
            "datecreated","tranid","custbody_lrc_parcela_alienacao"
        ]
    }).run().getRange(0,1000);
    // log.audit('bscParcelasAlienacao', bscParcelasAlienacao);

    if (bscParcelasAlienacao.length > 0) {        
        for (i=0; i<bscParcelasAlienacao.length; i++) {
            if (bscParcelasAlienacao[i].getValue('custbody_lrc_parcela_alienacao') == true) 
            return {
                custrecord_lrc_tipo_escrituracao: 2, // 2 - Escritura de Alienação
                custrecord_lrc_status_escrituracao: 14, // 2.01 - Iniciar Outorga
                custrecord_lrc_data_escrituracao: new Date(),
                custrecord_lrc_data_entrega_construcao: '',
                custrecord_lrc_matricula: ''
            }
        }
    }

    return {
        custrecord_lrc_tipo_escrituracao: 1, // 1 - Escritura Definitiva
        custrecord_lrc_status_escrituracao: dadosEmpreendimento(empreendimento).custentity_rsc_matric_arq ? 2 : 1,
        custrecord_lrc_data_escrituracao: '',
        custrecord_lrc_data_entrega_construcao: dadosEmpreendimento(empreendimento).calculatedenddate,
        custrecord_lrc_matricula: dadosEmpreendimento(empreendimento).custentity_rsc_matric_arq
    }
}

const gerarEscritura = (idPedido) => {
    // log.audit('gerarEscritura', idPedido);

    var lkpSO = search.lookupFields({type: 'salesorder',
        id: idPedido,
        columns: ['entity','custbody_rsc_projeto_obra_gasto_compra','custbody_rsc_tran_unidade','custbody_lrc_fat_controle_escrituracao']
    });

    if (!!lkpSO.custbody_lrc_fat_controle_escrituracao) {
        var escrituracao = record.create({type: 'customrecord_lrc_controle_escrituracao'});

        var de = dadosEscrituracao(idPedido, lkpSO.custbody_rsc_projeto_obra_gasto_compra[0]);
        // log.audit('de', de);

        var campos = {
            custrecord_lrc_fatura_de_venda: idPedido,
            custrecord_lrc_cliente_ce: lkpSO.entity[0].value,
            custrecord_lrc_empreendimento_fatura: lkpSO.custbody_rsc_projeto_obra_gasto_compra[0] ? lkpSO.custbody_rsc_projeto_obra_gasto_compra[0].value : '',
            custrecord_lrc_tipo_escrituracao: de.custrecord_lrc_tipo_escrituracao,
            custrecord_lrc_status_escrituracao: de.custrecord_lrc_status_escrituracao,
            custrecord_lrc_matricula: de.custrecord_lrc_matricula,
            custrecord_lrc_data_escrituracao: de.custrecord_lrc_data_escrituracao,
            custrecord_lrc_data_entrega_construcao: de.custrecord_lrc_data_entrega_construcao,
            custrecord_lrc_data_procurador: ''
        }

        Object.keys(campos).forEach(function(bodyField) {
            escrituracao.setValue(bodyField, campos[bodyField]);
        });

        var idEscrituracao = escrituracao.save();
        log.audit('gerarEscritura', {idEscrituracao: idEscrituracao, idPedido: idPedido, tranid: lkpSO.tranid});

        if (idEscrituracao) {
            var campos = {
                custbody_lrc_fat_controle_escrituracao: idEscrituracao
            } 

            atualizarDados('salesorder', idPedido, campos);
        }
    }
}

const approvalStatus = (idContrato) => {
    // log.audit('approvasStatus', idContrato);

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
    // log.audit('bscTransacao', bscTransacao);

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
        // gerarEscritura(parametros.id);
    }
}

return {
    onRequest: onRequest
}
});
