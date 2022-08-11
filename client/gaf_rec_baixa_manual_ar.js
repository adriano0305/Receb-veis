/**
*@NApiVersion 2.x
*@NScriptType ClientScript
*/

// var popup = 'height=' + 400 + ' , width=' + 700;
var popup = 'height=' + 400 + ' , width=' + 300;
popup += ' , left=' + 300 + ", top=" + 250;
popup += ', status=no'; 
popup += ' ,toolbar=no';
popup += ' ,menubar=no';
popup += ', resizable=yes'; 
popup += ' ,scrollbars=no';
popup += ' ,location=no';
popup += ' ,directories=no';

define(['N/currentRecord', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/url'], function(currentRecord, log, record, runtime, search, dialog, url) {
function pageInit(context) {
    const registroAtual = context.currentRecord;
}

function saveRecord(context) {}

function validateField(context) {}

function fieldChanged(context) {
    const registroAtual = context.currentRecord;
    
    var campo = context.fieldId;

    var linha = context.line;

    var sublista = context.sublistId;
    log.audit('fieldChanged', {sublista: sublista, linha: linha, campo: campo});

    var usuarioAtual = runtime.getCurrentUser();
    
    // if (usuarioAtual.id == 3588) {
        if (sublista == 'apply') {
            switch(campo) {
                case 'apply':
                    var aplicar = registroAtual.getSublistValue(sublista, campo, linha);

                    if (aplicar == true) {                        
                        var dados = {
                            parcela: {
                                internalid: registroAtual.getSublistValue(sublista, 'internalid', linha),
                                refnum: registroAtual.getSublistValue(sublista, 'refnum', linha),     
                                duedate: {
                                    text: registroAtual.getSublistText(sublista, 'duedate', linha),
                                    value: registroAtual.getSublistValue(sublista, 'duedate', linha)
                                },   
                                total: registroAtual.getSublistValue(sublista, 'total', linha),
                                novo_fluxo_pagamentos: novo_fluxo_pagamentos
                            }                            
                        }                                 
    
                        var url_atualizar_parcela = url.resolveScript({
                            scriptId: 'customscript_gaf_atualizar_parcela_ar',
                            deploymentId: 'customdeploy_gaf_atualizar_parcela_ar',
                            params: {    
                                dados: JSON.stringify(dados)
                            }
                        }); 
                        log.audit('url_atualizar_parcela', url_atualizar_parcela);
    
                        window.open(url_atualizar_parcela, "Atualizar Parcela", popup);
                    }                    
                break;
            }
        }
    // } 
}

function postSourcing(context) {}

function lineInit(context) {}

function validateDelete(context) {}

function validateInsert(context) {}

function validateLine(context) {}

function sublistChanged(context) {}

function baixaManual() {
    const registroAtual = currentRecord.get();

    var lookupInvoice = search.lookupFields({type: 'invoice',
        id: registroAtual.id,
        columns: ['tranid','total']
    });
    
    var dados = {
        id: registroAtual.id,
        tranid: lookupInvoice.tranid,
        total: lookupInvoice.total                
    }

    var url_atualizar_parcela = url.resolveScript({
        scriptId: 'customscript_gaf_atualizar_parcela_ar',
        deploymentId: 'customdeploy_gaf_atualizar_parcela_ar',
        params: {    
            dados: JSON.stringify(dados)
        }
    }); 
    console.log('url_atualizar_parcela', JSON.stringify(url_atualizar_parcela));

    window.open(url_atualizar_parcela, "Atualizar Parcela", popup);

}

return {
    baixaManual: baixaManual,
    pageInit: pageInit,
    // saveRecord: saveRecord,
    // validateField: validateField,
    // fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // sublistChanged: sublistChanged
}
});
