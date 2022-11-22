/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
 define(['N/search', 'N/runtime', 'N/record', './rsc_junix_call_api.js', './rsc_finan_createproposta.js'],
    
 (search, runtime, record, api, propostaFunction) => {
    var getInputData = function () {
        return search.create({
            type: 'creditmemo',
            filters: [
                ['custbody_rsc_pago', 'IS', '1'],
                'AND',
                ['custbody_lrc_enviado_para_junix', 'IS', 'F'],
                'AND',
                ['mainline', 'IS', 'T']            
            ],
        });
    };
    var map = function (ctx) {
        var req = JSON.parse(ctx.value);
        log.debug('req',req);
        var lookupMemCred = search.lookupFields({
            type:'creditmemo',
            id:req.id,
            columns:['custbody_rsc_nrdocboleto', 'trandate', 'total']
        })
        var nBoleto = lookupMemCred.custbody_rsc_nrdocboleto;
        var date = lookupMemCred.trandate;
        var total = lookupMemCred.total;
        var obj = {
            "numeroDocumento": nBoleto,
            "dataPagamento": date,
            "dataBaixa": date,
            "valor": (total * -1),
            "nossoNumero": ""
        }
        var body = {
            "dados": obj,
            "ok": true,
            "mensagem": "Baixa Realizada"
        }
        log.debug({title: 'BODY', details: body});
        var retorno = JSON.parse(api.sendRequest(body, 'BOLETO_BAIXAINCLU_JUNIX/1.0/'));
        log.debug({title: 'Resultado', details: retorno});
        if(retorno.OK){
            var creditMemoRecord = record.load({
                type:'creditmemo',
                id: req.id
            })
            creditMemoRecord.setValue({
                fieldId:'custbody_lrc_enviado_para_junix',
                value: true
            })
            creditMemoRecord.save({
                ignoreMandatoryFields: true
            })
        }
    };
    const summarize = (summaryContext) => {

    }
    return {getInputData, map, summarize}
});
