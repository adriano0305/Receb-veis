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
            try {
                var fornecedor = page.getValue('entity')
                var notaFiscal = page.getValue('custbody_enl_fiscaldocnumber')
                log.debug('ctx', ctx)
                log.debug('pageType', pageType)
                log.debug('pageId', pageId)
                log.debug('fornecedor', fornecedor)
                log.debug('notaFiscal', notaFiscal)

                var busca = search.create({
                    type: 'itemreceipt',
                    filters: [
                        ['entity', 'IS', fornecedor],
                        'AND',
                        ['internalid', 'NONEOF', pageId],
                        'AND',
                        ['custbody_enl_fiscaldocnumber', 'IS', notaFiscal]
                    ],
                    columns: ['internalId'],
                }).run().getRange({
                    start: 0,
                    end: 1
                })
                log.debug('busca', busca)
                log.debug('busca.length', busca.length)

                if (busca.length != 0) {
                    dialog.alert({
                        title: 'NOTA FISCAL já está em uso!',
                        message: 'A NOTA FISCAL: ' + '"' + notaFiscal + '"' + ' já está cadastrada nesse fornecedor! <br> Por favor, utilize uma NOTA FISCAL diferente!'
                    });
                    return false
                }
            } catch (error) {
                log.error('erro', error)
            }
            
            }

        if (pageType == 'vendorbill') {
            try {
                var fornecedor = page.getValue('entity')
                var n_referencia = page.getValue('tranid')
                if (!n_referencia) {
                    return alert("Você precisa preencher o campo Nº DE REFERÊNCIA")
                }
                var lista = []
                var busca = search.create({
                    type: 'vendorbill',
                    filters: [
                        ['entity', 'IS', fornecedor],
                        'AND',
                        ['tranid', 'IS', n_referencia],
                        'AND',
                        ['internalid', 'NONEOF', pageId]
                    ],
                    columns: ['internalId', 'tranid'],
                }).run().each(function(result){
                    lista.push({
                        internalId: result.getValue('internalId'),
                        tranId: result.getValue('tranid')
                    })
                    return true
                })

                log.debug('lista', lista[0])
                log.debug('lista.length', lista.length)
                
                var tranId = lista[0].tranId
                var tranId = lista[0].tranId
                
                log.debug('tranId', tranId)

                if (lista.length != 0) {
                    dialog.alert({
                        title: 'O Nº DE REFERÊNCIA já possui uma fatura vinculada!',
                        message: 'Nº DE REFERÊNCIA: '+ tranId + '<br> <br> Por favor, utilize um Nº DE REFERÊNCIA diferente!'
                    });
                    return false
                }

            } catch (error) {
                log.error('erro', error)
            }  
        }
        return true
    }


    return {
        saveRecord: saveRecord
    }
});
