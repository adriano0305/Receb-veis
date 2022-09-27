/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
const dados = {
    hoje: new Date(),
    opcoes: {
        enableSourcing: true,
        ignoreMandatoryFields: true
    }    
}

define(['N/log', 'N/record'], function(log, record) {
const atualizarTransacao = (tipo, idInterno, valores) => {
    record.submitFields({type: tipo,
        id: idInterno,
        values: valores,
        options: dados.opcoes        
    });
    log.audit('atualizarTransacao', {status: 'Sucesso', tipo: tipo, idInterno: idInterno, valores: valores});
} 

const formatData = (data) => {
    // var splitData = data.split('/');
    // var novaData = new Date(splitData[2], splitData[1] - 1, splitData[0]);
    // var dataD1 = novaData.setDate(novaData.getDate() + 1);
    // log.audit('formatData', {
    //     data: data,
    //     splitData: splitData,
    //     novaData: novaData,
    //     dataD1: dataD1
    // });
    // return novaData;

    var novaData = new Date(data);
    novaData.setDate(novaData.getDate() + 1);
    return novaData;
} 

function beforeLoad(context) {}

function beforeSubmit(context) {}

function afterSubmit(context) {
    log.audit('afterSubmit', context);

    const novoRegistro = context.newRecord;

    const tipo = context.type;

    if (novoRegistro.id && (tipo == 'create' || tipo == 'edit')) {
        var data = {
            // text: novoRegistro.getText('trandate'),
            value: novoRegistro.getValue('trandate')
        }
        
        var sclp = novoRegistro.getValue('custbodysegregacao_curt_long'); // Iniciais de "Segregação de Curto e Longo Prazo"
        var numeroEstorno = novoRegistro.getValue('reversalentry');
        var dataEstorno = novoRegistro.getValue('reversaldate');

        if (sclp && !dataEstorno) {
            var fd = formatData(data.value);

            var campos = {
                reversaldate: fd
            }

            atualizarTransacao('journalentry', novoRegistro.id, campos);
        }   
    }
}

return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
}
});
