/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@Author Rafael Oliveira
 */
define(['N/record', 'N/search'], function(record, search) {

    function beforeLoad(ctx) {
        
    }

    function beforeSubmit(ctx) {
        
    }

    function afterSubmit(ctx) {
        try {
            var mode = ctx.type
            var page = ctx.newRecord;
            var pageId = page.id
            var registerType = page.type
            log.debug('mode', mode)
            log.debug('page', page)
            log.debug('pageId', pageId)
            log.debug('registerType', registerType)
            
            faturaInRecebimento(pageId, registerType)
            if(ctx.type == ctx.UserEventType.CREATE) {
            }
        } catch (e) {
            log.error('Erro Catch', e)
        }
        

        function faturaInRecebimento (faturaId, registerType) {
            if(registerType == 'vendorbill') {
                var busca = search.lookupFields({
                    type: registerType,
                    id: faturaId,
                    columns: 'custbody_rsc_recebimento_fisico'
                })
                if(busca) {
                    var resultadoBusca = busca.custbody_rsc_recebimento_fisico[0].value
                    log.audit('Busca: ', busca)
                    log.audit('resultadoBusca: ', resultadoBusca)
                    var recebimentoItem = record.load({
                        type: 'itemreceipt',
                        id: resultadoBusca,
                        isDynamic: true
                    })
                    recebimentoItem.setValue('custbody_rsc_link_fatura_fornecedor', faturaId)
                    recebimentoItem.save()
                }
            }
        }

    }

    return {
        // beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
