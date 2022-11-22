/**
 *@NApiVersion 2.1
*@NScriptType ClientScript
*/

define(['N/currentRecord', 'N/runtime', 'N/search', 'N/ui/dialog'], function(currentRecord, runtime, search, dialog) {
function pageInit(ctx) {
    const page = ctx.currentRecord
    var searchOfsearch = search.create({type: "savedsearch",
        filters: [
            ["id","is","customsearch_gaf_src_curto_long"]
        ],
        columns: [
            "internalid"
        ]
    }).run().getRange(0,1);
    console.log('pageInit', JSON.stringify({searchOfsearch: searchOfsearch}));
    page.setValue("custpage_id_busca", searchOfsearch[0].id);

    // var processado = page.getValue("custpage_process")
    // var processadoParc = page.getValue("custpage_processa_parc")
    // var naoProcessado = page.getValue("custpage_nao_process")

    // if(processado){
    //     var process = message.create({
    //         title: 'Sucesso',
    //         message: 'Lançamentos Contábeis Criados com Sucesso',
    //         type: message.Type.CONFIRMATION
    //     });
    //     process.show({
    //         duration: 10000 
    //     });
    //     var link = "https://5843489-sb1.app.netsuite.com/app/accounting/transactions/transactionlist.nl?Transaction_TYPE=Journal"
    //     window.location.replace(link)
    // }else if(processadoParc){
    //     let almostProcess = message.create({
    //         title: 'Processados Parcialmente',
    //         message: 'Alguns lançamentos não foram processados, favor verificar na lista de Lançamentos Contábeis',
    //         type: message.Type.INFORMATION
    //     });
    //     almostProcess.show({
    //         duration: 10000
    //     });
    //     var link = "https://5843489-sb1.app.netsuite.com/app/accounting/transactions/transactionlist.nl?Transaction_TYPE=Journal"
    //     window.location.replace(link)
    // }else if(naoProcessado){
    //     let noProcessed = message.create({
    //         title: 'Falha ao processar',
    //         message: 'Nenhum dos lançamentos foram processados tente novamente',
    //         type: message.Type.WARNING,
    //         duration: 20000
    //     });
    //     noProcessed.show({
    //         duration: 10000
    //     });
    //     var link = "https://5843489-sb1.app.netsuite.com/app/accounting/transactions/transactionlist.nl?Transaction_TYPE=Journal"
    //     window.location.replace(link)
    // }else{
    //     console.log('não encontrei nada')
    // }
}

function selecionar() {
    const page = currentRecord.get();
    var count = page.getLineCount({sublistId: 'custpage_sublist'});
    for (i=0; i<count; i++) {
        page.selectLine({sublistId: "custpage_sublist", line: i});
        page.setCurrentSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_pegar_parcela', value: true, ignoreFieldChange: true});
        page.commitLine({sublistId: 'custpage_sublist'});
    }
}

function desmarcar() {
    const page = currentRecord.get();
    var count = page.getLineCount({sublistId: 'custpage_sublist'});
    for (i=0; i<count; i++) {
        page.selectLine({sublistId: "custpage_sublist", line: i});
        page.setCurrentSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_pegar_parcela', value: false, ignoreFieldChange: true});
        page.commitLine({sublistId: 'custpage_sublist'});
    }
}

function saveRecord(ctx) {
    const page = ctx.currentRecord;
    const usuarioAtual = runtime.getCurrentUser();
    const mensagem = 'Ao final do processo será enviado e-mail para: ' + usuarioAtual.email + '. \n Confirma?';

    var jsonAtualizado = [];
    var count = page.getLineCount({sublistId: 'custpage_sublist'});
    
    for (i=0; i<count; i++) {
        var check = page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_pegar_parcela', line: i});
        if (check ==  true) {
            jsonAtualizado.push({
                "data": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_data', line: i}),
                "dataVenci": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_data_venci', line: i}),
                "subsidiary": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_subsidiary', line: i}),
                "vendor": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_fornecedor', line: i}),
                "numeroParcelas": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_prestacoes', line: i}),
                "status": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_status', line: i}),
                "valor": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_valor', line: i}),
                "fatura": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_num_fatura', line: i}),
                "checkbox": check,
                "idFatura": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_id_fatura', line: i}),
                "tipoSegreg": page.getSublistValue({sublistId: 'custpage_sublist', fieldId: 'custpage_tipo', line: i}),
                "dataSegregacao": {
                    text: page.getText({fieldId: 'custpage_data_segregacao'}),
                    value: page.getValue({fieldId: 'custpage_data_segregacao'})
                },
                "usuarioAtual": usuarioAtual
            });
        }        
    }

    console.log(jsonAtualizado);

    if (jsonAtualizado.length == 0) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Selecione ao menos uma fatura de fornecedor.'
        });
        return false;
    }

    page.setValue('custpage_json_holder', JSON.stringify(jsonAtualizado));

    return confirm(mensagem) ? true : false;
}


return {
    pageInit: pageInit,
    selecionar: selecionar,
    desmarcar: desmarcar,
    saveRecord: saveRecord
}
});
