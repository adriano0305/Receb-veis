/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/log', 'N/record'], (log, record) => {
const baixaManual = (newRecord) => {
    var listaStatus = [];
    
    var lines = newRecord.getLineCount({sublistId: 'apply'});

    for (var i = 0; i<lines; i++) {
        var apply = newRecord.getSublistValue({sublistId: 'apply', fieldId: 'apply', line: i});
        var internalid = newRecord.getSublistValue({sublistId: 'apply', fieldId: 'internalid', line: i});
        var nInstallment = newRecord.getSublistValue({sublistId: 'apply', fieldId: 'installmentnumber', line: i});
        var trantype =  newRecord.getSublistValue({sublistId: 'apply', fieldId: 'trantype', line: i});
        log.debug({line: i}, {apply: apply, internalid: internalid});

        if (trantype == 'VendBill') {
            if (apply) {
                var dataPago = newRecord.getValue('trandate');

                var fatura = record.load({type: 'vendorbill', id: internalid});

                var linhasFatura = fatura.getLineCount({sublistId:'installment'});
                log.debug({apply: apply}, {dataPago: dataPago, linhasFatura: linhasFatura});

                for (var j = 0; j < linhasFatura;j++) {
                    var seqNum = fatura.getSublistValue({sublistId: 'installment', fieldId: 'seqnum', line: j});
                    var statusCnab = fatura.getSublistValue({sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_status_ls', line: j});
                    var statusInstallment = fatura.getSublistValue({sublistId: 'installment', fieldId: 'status', line: j});
                    log.debug(j, {seqNum: seqNum, nInstallment: nInstallment, statusCnab: statusCnab});

                    if (seqNum == nInstallment) {
                        if (statusCnab == 1) {
                            fatura.setSublistValue({sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_status_ls', line: j, value: 6});
                            fatura.setSublistValue({sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_paymentdate_dt', line: j, value: dataPago});
                            statusCnab = 6;
                        } else {
                            fatura.setSublistValue({sublistId: 'installment', fieldId: 'custrecord_rsc_cnab_inst_paymentdate_dt', line: j, value: dataPago});
                        }
                    }

                    listaStatus.push(statusInstallment);
                }

                if (listaStatus.every((currentValue) => currentValue == 'Pago')) {
                    fatura.setValue('custbody_rsc_etapa_requisicao', 112);
                } else {
                    fatura.setValue('custbody_rsc_etapa_requisicao', 113);
                }

                fatura.save({ignoreMandatoryFields: true});
            }
        } else if (trantype == 'ExpRept') {
            if (apply) {
                var fatura = record.load({type: 'expensereport', id: internalid});
                var status = fatura.getValue('custbody_rsc_cnab_inst_status_ls');

                if (status == 1) {
                    fatura.setValue({fieldId: 'custbody_rsc_cnab_inst_status_ls', value: 6});
                }

                fatura.save({ignoreMandatoryFields: true});
            }
        }
    }
}

const beforeLoad = (scriptContext) => {}

const beforeSubmit = (scriptContext) => {}

const afterSubmit = (scriptContext) => {
    var newRecord = scriptContext.newRecord;
    var recordType = newRecord.type;

    if (recordType == 'vendorpayment' || 'vendorcredit') {
        baixaManual(newRecord);
    }
}

return {
    beforeLoad, 
    beforeSubmit, 
    afterSubmit
}

});
