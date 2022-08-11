/**
 *@NApiVersion 2.x
*@NScriptType ClientScript
*@Author Rafael Oliveira
*/
define(['N/search', 'N/ui/dialog'], function(search, dialog) {
function saveRecord(ctx) {
    var page = ctx.currentRecord;
    var pageType = ctx.currentRecord.type;
    var pageId = page.id;
    
    if (pageType == 'itemreceipt') {
        var fornecedor = page.getValue('entity')
        var notaFiscal = page.getValue('custbody_enl_fiscaldocnumber')

        var bscRI = search.create({type: "itemreceipt",
            filters: [
                ["mainline","is","T"], "AND", 
                ["type","anyof","ItemRcpt"], "AND", 
                ["vendor.internalid","anyof",fornecedor], "AND", 
                ["custbody_enl_fiscaldocnumber","is",notaFiscal]
            ],
            columns: [
                search.createColumn({name: "datecreated", sort: search.Sort.DESC, label: "Data de criação"}),
                "tranid"
            ]
        }).run().getRange(0,1);
        log.audit('bscRI', bscRI);

        if (bscRI.length > 0 && !pageId) {
            dialog.alert({
                title: 'NOTA FISCAL já está em uso!',
                message: 'A NOTA FISCAL: ' + '"' + notaFiscal + '"' + ' já está cadastrada nesse fornecedor! <br> Por favor, utilize uma NOTA FISCAL diferente!'
            });
            return false
        }
    }

    if (pageType == 'vendorbill') {
        var fornecedor = page.getValue('entity')
        var n_referencia = page.getValue('tranid')

        if (!n_referencia) {
            return alert("Você precisa preencher o campo Nº DE REFERÊNCIA")
        }

        var bscFF = search.create({type: "vendorbill",
            filters: [
               ["cogs","is","F"], "AND", 
               ["shipping","is","F"], "AND", 
               ["taxline","is","F"], "AND", 
               ["mainline","is","T"], "AND", 
               ["type","anyof","VendBill"], "AND", 
               ["vendor.internalid","anyof",fornecedor], "AND", 
               ["formulatext: {tranid}","is",n_referencia]
            ],
            columns: [
               search.createColumn({name: "datecreated", sort: search.Sort.DESC, label: "Data de criação"}),
               search.createColumn({name: "formulatext", formula: "{tranid}", label: "Fórmula (texto)"})
            ]
        }).run().getRange(0,1);
        log.audit('bscFF', bscFF);

        if (bscFF.length > 0 && !pageId) {
            dialog.alert({
                title: 'O Nº DE REFERÊNCIA já possui uma fatura vinculada!',
                message: 'Nº DE REFERÊNCIA: '+ bscFF[0].getValue({name: "formulatext", formula: "{tranid}"}) + '<br> <br> Por favor, utilize um Nº DE REFERÊNCIA diferente!'
            });
            return false
        }
    }
    
    return true
}


return {
    saveRecord: saveRecord
}
});
