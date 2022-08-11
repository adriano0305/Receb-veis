/**
 * Custom Gl Lines Plug-in.
 *
 * @author Volnei Ferreira
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {  
  var transactionType = transactionRecord.getRecordType()
  nlapiLogExecution('AUDIT', 'customizeGlImpact', JSON.stringify({transactionType: transactionType, standardLines: standardLines, customLines: customLines}));

  if (transactionType === 'invoice') {
    var transacaoWF = transactionRecord.getFieldValue('custbody_rsc_tipo_transacao_workflow');
    nlapiLogExecution('AUDIT', 'transacaoWF', transacaoWF);
    var statusContrato = transactionRecord.getFieldValue('custbody_rsc_status_contrato');
    nlapiLogExecution('AUDIT', 'statusContrato', statusContrato);
    var approvalstatus = transactionRecord.getFieldValue('approvalstatus');

    /** Tipo de Transação Workflow: PV - Prospota ou PV - Contrato; 
     * Status do Contrato: Proposta ou Contrato */ 
    if ((transacaoWF == 22 || transacaoWF == 24 || transacaoWF == 25 || transacaoWF == 102 || statusContrato == 1 || statusContrato == 2) && approvalstatus == 2) { 
      _applyInvoiceCustomImpact(transactionRecord, standardLines, customLines);
    }
  } else if (transactionType === 'creditmemo') {
    _applyCreditMemoCustomImpact(transactionRecord, standardLines, customLines)
  } else if (transactionType === 'customerpayment') {
    if (!transactionRecord.id) {
      nlapiLogExecution('AUDIT', 'Pagamento sendo criado...', JSON.stringify({customLines: customLines, standardLines: standardLines, transactionRecord: transactionRecord}));
      nlapiLogExecution('AUDIT', 'getLineItemCount', transactionRecord.getLineItemCount('apply'));
    } else {
      nlapiLogExecution('AUDIT', 'Pagamento sendo editado...', JSON.stringify({customLines: customLines, standardLines: standardLines, transactionRecord: transactionRecord}));
      nlapiLogExecution('AUDIT', 'getLineItemCount', transactionRecord.getLineItemCount('apply'));
    }   
    
    for (i=0; i<transactionRecord.getLineItemCount('apply'); i++) {
      nlapiLogExecution('AUDIT', 'i', i);
      var objResult1 = {
        apply: transactionRecord.getLineItemValue('apply', 'apply', i),
        internalid: transactionRecord.getLineItemValue('apply', 'internalid', i),
        trantype: transactionRecord.getLineItemValue('apply', 'trantype', i)
      }
      nlapiLogExecution('AUDIT', 'objResult1', JSON.stringify(objResult1));

      if (objResult1.apply == 'T') {
        nlapiLogExecution('AUDIT', 'objResult1', JSON.stringify(objResult1));

        var invoiceRecord = nlapiLoadRecord('invoice', objResult1.internalid, null, null);
        var source = invoiceRecord.getFieldValue('source');       

        if (source == 'CSV') {
          nlapiLogExecution('AUDIT', 'source', source);
          _applyPaymentCustomImpact(transactionRecord, standardLines, customLines)
        } else {
          var invoiceSearch = nlapiSearchRecord("invoice",null,
            [
              ["mainline","is","T"], "AND", 
              ["type","anyof","CustInvc"], "AND", 
              ["internalid","anyof",objResult1.internalid]
            ], 
            [
              new nlobjSearchColumn("datecreated").setSort(true), 
              new nlobjSearchColumn("tranid"), 
              new nlobjSearchColumn("source"), 
              new nlobjSearchColumn("context","systemNotes",null)
            ]
          );
          nlapiLogExecution('AUDIT', 'invoiceSearch', JSON.stringify(invoiceSearch));

          for (var i=0; invoiceSearch != null && i<invoiceSearch.length; i++) {  
            var objResult2 = {
              context: invoiceSearch[i].getValue('context', 'systemNotes'),
              source: invoiceSearch[i].getValue('source')
            };
    
            if ((objResult2.context === "CSV" && objResult2.source === "CSV")) {
              nlapiLogExecution('AUDIT', 'objResult2', JSON.stringify(objResult2));
              _applyPaymentCustomImpact(transactionRecord, standardLines, customLines)
            }
    
            break;
          }  
        }           
      }
    }
    
    // _applyPaymentCustomImpact(transactionRecord, standardLines, customLines)
  }
}

/**
 * Standard lines record constant.
 *
 * @type {object}
 */
var standardLinesRecordConst = {
  TYPE: 'customrecord_rsc_invoice_standard_lines',
  INVOICE_FIELD: 'custrecord_rsc_isl_invoice',
  STANDARD_LINES_FIELD: 'custrecord_rsc_isl_standard_lines'
}

/**
 * Apply invoice custom impact.
 *
 * @param transactionRecord
 * @param standardLines
 * @param customLines
 * @private
 */
// function _applyInvoiceCustomImpact(transactionRecord, standardLines, customLines) {
//   var isInstallmentInvoice = !!transactionRecord.getFieldValue('custbody_lrc_fatura_principal')

//   if (!isInstallmentInvoice) return

//   var standardLinesList = []
//   var standardCreditLine = standardLines.getLine(1)
//   var sourceInvoiceAmount = parseFloat(standardCreditLine.getCreditAmount())

//   standardLinesList.push({
//     accountId: standardCreditLine.getAccountId(),
//     creditAmount: sourceInvoiceAmount,
//     departmentId: standardCreditLine.getDepartmentId(),
//     classId: standardCreditLine.getClassId(),
//     locationId: standardCreditLine.getLocationId(),
//     memo: standardCreditLine.getMemo()
//   })

//   var standardDebitLine = standardLines.getLine(0)

//   standardLinesList.push({
//     accountId: standardDebitLine.getAccountId(),
//     debitAmount: sourceInvoiceAmount,
//     departmentId: standardDebitLine.getDepartmentId(),
//     classId: standardDebitLine.getClassId(),
//     locationId: standardDebitLine.getLocationId(),
//     memo: standardDebitLine.getMemo()
//   })

//   if (standardLinesList.length) {
//     standardLinesList.forEach(function (standardLine) {
//       var debitAmount = standardLine.debitAmount
//       var creditAmount = standardLine.creditAmount
      
//       if (!(debitAmount > 0 || creditAmount > 0)) return
      
//       var newLine = customLines.addNewLine()

//       newLine.setAccountId(standardLine.accountId)
//       newLine.setDepartmentId(standardLine.departmentId)
//       newLine.setClassId(standardLine.classId)
//       newLine.setLocationId(standardLine.locationId)
//       newLine.setMemo(standardLine.memo)

//       if (debitAmount) {
//         newLine.setCreditAmount(debitAmount)
//       } else {
//         newLine.setDebitAmount(creditAmount)
//       }
//     })

//     var invoiceId = transactionRecord.getId()

//     if (!invoiceId) return

//     var standardLinesRecords = _getStandardLinesByInvoice(invoiceId)

//     if (standardLinesRecords.length) {
//       nlapiSubmitField(
//         standardLinesRecordConst.TYPE,
//         standardLinesRecords[0].getId(),
//         standardLinesRecordConst.STANDARD_LINES_FIELD,
//         JSON.stringify(standardLinesList)
//       )
//     } else {
//       var standardLinesRecord = nlapiCreateRecord(standardLinesRecordConst.TYPE)
//       standardLinesRecord.setFieldValue(standardLinesRecordConst.INVOICE_FIELD, invoiceId)
//       standardLinesRecord.setFieldValue(standardLinesRecordConst.STANDARD_LINES_FIELD, JSON.stringify(standardLinesList))
//       nlapiSubmitRecord(standardLinesRecord)
//     }
//   }
// }

function _applyInvoiceCustomImpact(transactionRecord, standardLines, customLines) {
  nlapiLogExecution('AUDIT', '_applyInvoiceCustomImpact', JSON.stringify({
    customLines: customLines,
    standardLines: standardLines, 
    transactionRecord: transactionRecord
  }));

  var contrato = !!transactionRecord.getFieldValue('custbody_lrc_fatura_principal')
  nlapiLogExecution('AUDIT', 'contrato', contrato);

  if (!contrato) return

  var standardLinesList = [];

  for (i=0; i<standardLines.getCount(); i++) {
    var sl = standardLines.getLine(i);
    var amount = parseFloat(sl.getCreditAmount());
    if (sl.accountId != 109) {
      if (amount > 0) {
        standardLinesList.push({
          accountId: sl.getAccountId(),
          debitAmount: sl.getCreditAmount(),
          // entityId: sl.getEntityId(),
          departmentId: sl.getDepartmentId(),
          classId: sl.getClassId(),
          locationId: sl.getLocationId(),
          memo: sl.getMemo()
        });
      } else {
        standardLinesList.push({
          accountId: sl.getAccountId(),
          creditAmount: sl.getDebitAmount(),
          // entityId: sl.getEntityId(),
          departmentId: sl.getDepartmentId(),
          classId: sl.getClassId(),
          locationId: sl.getLocationId(),
          memo: sl.getMemo()
        });
      }
    }
  }
  
  if (standardLinesList.length) {
    standardLinesList.forEach(function (standardLine) {
      nlapiLogExecution('AUDIT', 'standardLine', JSON.stringify(standardLine));

      if (standardLine.debitAmount > 0 || standardLine.creditAmount > 0) {      
        var newLine = customLines.addNewLine();
  
        newLine.setAccountId(standardLine.accountId);
        // newLine.setEntityId(standardLine.entityId);
        newLine.setDepartmentId(standardLine.departmentId);
        newLine.setClassId(standardLine.classId);
        newLine.setLocationId(standardLine.locationId);
        newLine.setMemo(standardLine.memo);
  
        if (standardLine.debitAmount) {
          newLine.setDebitAmount(standardLine.debitAmount);
        } else {
          newLine.setCreditAmount(standardLine.creditAmount);
        }
      }
    });

    var invoiceId = transactionRecord.getId()

    if (!invoiceId) return

    var standardLinesRecords = _getStandardLinesByInvoice(invoiceId)

    if (standardLinesRecords.length) {
      nlapiSubmitField(
        standardLinesRecordConst.TYPE,
        standardLinesRecords[0].getId(),
        standardLinesRecordConst.STANDARD_LINES_FIELD,
        JSON.stringify(standardLinesList)
      )
    } else {
      var standardLinesRecord = nlapiCreateRecord(standardLinesRecordConst.TYPE)
      standardLinesRecord.setFieldValue(standardLinesRecordConst.INVOICE_FIELD, invoiceId)
      standardLinesRecord.setFieldValue(standardLinesRecordConst.STANDARD_LINES_FIELD, JSON.stringify(standardLinesList))
      nlapiSubmitRecord(standardLinesRecord)
    }
  }  
}

/**
 * Apply credit memo custom impact.
 *
 * @param transactionRecord
 * @param standardLines
 * @param customLines
 * @private
 */
 function _applyCreditMemoCustomImpact(transactionRecord, standardLines, customLines) {   
  var standardLinesList = []
  for (i=0; i<standardLines.getCount(); i++) {
    var sl = standardLines.getLine(i);
    var amount = parseFloat(sl.getCreditAmount());

    if (sl.accountId != 109) {
      if (amount > 0) {
        standardLinesList.push({
          accountId: sl.getAccountId(),
          creditAmount: sl.getCreditAmount(),
          // entityId: sl.getEntityId(),
          departmentId: sl.getDepartmentId(),
          classId: sl.getClassId(),
          locationId: sl.getLocationId(),
          memo: sl.getMemo()
        });
      } else {
        standardLinesList.push({
          accountId: sl.getAccountId(),
          debitAmount: sl.getDebitAmount(),
          // entityId: sl.getEntityId(),
          departmentId: sl.getDepartmentId(),
          classId: sl.getClassId(),
          locationId: sl.getLocationId(),
          memo: sl.getMemo()
        });        
      }
    }
  }  

  if (standardLinesList.length) {
    standardLinesList.forEach(function (standardLine) {
      var newLine = customLines.addNewLine();

      newLine.setAccountId(standardLine.accountId);
      // newLine.setEntityId(standardLine.entityId);
      newLine.setDepartmentId(standardLine.departmentId);
      newLine.setClassId(standardLine.classId);
      newLine.setLocationId(standardLine.locationId);
      newLine.setMemo(standardLine.memo);

      if (standardLine.debitAmount) {
        newLine.setCreditAmount(standardLine.debitAmount);
      } else {
        newLine.setDebitAmount(standardLine.creditAmount);
      }
    });

    var memoID = transactionRecord.getId()

    if (!memoID) return

    var standardLinesRecords = _getStandardLinesByInvoice(memoID)

    if (standardLinesRecords.length) {
      nlapiSubmitField(
        standardLinesRecordConst.TYPE,
        standardLinesRecords[0].getId(),
        standardLinesRecordConst.STANDARD_LINES_FIELD,
        JSON.stringify(standardLinesList)
      )
    } else {
      var standardLinesRecord = nlapiCreateRecord(standardLinesRecordConst.TYPE)
      standardLinesRecord.setFieldValue(standardLinesRecordConst.INVOICE_FIELD, memoID)
      standardLinesRecord.setFieldValue(standardLinesRecordConst.STANDARD_LINES_FIELD, JSON.stringify(standardLinesList))
      nlapiSubmitRecord(standardLinesRecord)
    }
  }
}

/**
 * Apply payment custom impact.
 *
 * @param transactionRecord
 * @param standardLines
 * @param customLines
 * @private
 */
 function _applyPaymentCustomImpact(transactionRecord, standardLines, customLines) {
  var standardLinesList = []
  for (i=0; i<standardLines.getCount(); i++) {
    var sl = standardLines.getLine(i);
    var amount = parseFloat(sl.getCreditAmount());

    if (sl.accountId != 109) {
      if (amount > 0) {
        standardLinesList.push({
          accountId: sl.getAccountId(),
          creditAmount: sl.getCreditAmount(),
          // entityId: sl.getEntityId(),
          departmentId: sl.getDepartmentId(),
          classId: sl.getClassId(),
          locationId: sl.getLocationId(),
          memo: sl.getMemo()
        });
      } else {
        standardLinesList.push({
          accountId: sl.getAccountId(),
          debitAmount: sl.getDebitAmount(),
          // entityId: sl.getEntityId(),
          departmentId: sl.getDepartmentId(),
          classId: sl.getClassId(),
          locationId: sl.getLocationId(),
          memo: sl.getMemo()
        });        
      }
    }
  }  

  if (standardLinesList.length) {
    standardLinesList.forEach(function (standardLine) {
      var newLine = customLines.addNewLine();

      newLine.setAccountId(standardLine.accountId);
      // newLine.setEntityId(standardLine.entityId);
      newLine.setDepartmentId(standardLine.departmentId);
      newLine.setClassId(standardLine.classId);
      newLine.setLocationId(standardLine.locationId);
      newLine.setMemo(standardLine.memo);

      if (standardLine.debitAmount) {
        newLine.setCreditAmount(standardLine.debitAmount);
      } else {
        newLine.setDebitAmount(standardLine.creditAmount);
      }
    });

    var memoID = transactionRecord.getId()

    if (!memoID) return

    var standardLinesRecords = _getStandardLinesByInvoice(memoID)

    if (standardLinesRecords.length) {
      nlapiSubmitField(
        standardLinesRecordConst.TYPE,
        standardLinesRecords[0].getId(),
        standardLinesRecordConst.STANDARD_LINES_FIELD,
        JSON.stringify(standardLinesList)
      )
    } else {
      var standardLinesRecord = nlapiCreateRecord(standardLinesRecordConst.TYPE)
      standardLinesRecord.setFieldValue(standardLinesRecordConst.INVOICE_FIELD, memoID)
      standardLinesRecord.setFieldValue(standardLinesRecordConst.STANDARD_LINES_FIELD, JSON.stringify(standardLinesList))
      nlapiSubmitRecord(standardLinesRecord)
    }
  }
}
// function _applyPaymentCustomImpact(transactionRecord, standardLines, customLines) {
//   var appliedTransactions = []
//   var applyCount = transactionRecord.getLineItemCount('apply')

//   for (var line = 1; line <= applyCount; line++) {
//     var apply = transactionRecord.getLineItemValue('apply', 'apply', line)
//     if (apply !== 'T') continue
//     appliedTransactions.push(transactionRecord.getLineItemValue('apply', 'internalid', line))
//   }

//   if (!appliedTransactions.length) return

//   var standardLinesRecords = _getStandardLinesByInvoice(appliedTransactions)

//   if (!standardLinesRecords.length) return

//   standardLinesRecords.forEach(function (result) {
//     var standardLinesList = JSON.parse(result.getValue(standardLinesRecordConst.STANDARD_LINES_FIELD))
//     var debitAccountId

//     standardLinesList.forEach(function (standardLineValues, standardLineValuesIndex) {
//       var newLine = customLines.addNewLine()
//       var debitAmount = standardLineValues.debitAmount

//       if (debitAmount) {
//         newLine.setDebitAmount(debitAmount)
//         newLine.setAccountId(standardLineValues.accountId)
//         debitAccountId = standardLineValues.accountId
//       } else {
//         newLine.setCreditAmount(standardLineValues.creditAmount)
//         if (standardLineValuesIndex === 1) {
//           newLine.setAccountId(debitAccountId)
//         } else {
//           newLine.setAccountId(standardLineValues.accountId)
//         }
//       }

//       newLine.setDepartmentId(standardLineValues.departmentId)
//       newLine.setClassId(standardLineValues.classId)
//       newLine.setLocationId(standardLineValues.locationId)
//       newLine.setMemo(standardLineValues.memo)
//     })
//   })
// }

/**
 * Get standard lines by invoice.
 *
 * @param invoiceIds
 * @returns {nlobjSearchResult[]|*[]}
 * @private
 */
function _getStandardLinesByInvoice (invoiceIds) {
  return nlapiSearchRecord(
    standardLinesRecordConst.TYPE,
    null,
    new nlobjSearchFilter(standardLinesRecordConst.INVOICE_FIELD, null, 'anyof', invoiceIds),
    new nlobjSearchColumn(standardLinesRecordConst.STANDARD_LINES_FIELD)
  ) || []
}
