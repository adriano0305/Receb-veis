 /**
  * @NApiVersion 2.1
  * @NScriptType UserEventScript
  * @NModuleScope Public
  */
  define(['N/search', 'N/record', 'N/query'],
  /**
   * @param{serverWidget} serverWidget
   * @param{message} message
   * @param{redirect} redirect
   * @param{runtime} runtime
   * @param{translation} translation
   * @param{record} record
   * @param{search} search
   */
  function (search, record, query) {

      /**
       * Function definition to be triggered before record is loaded.
       *
       * @param {Object} scriptContext
       * @param {Record} scriptContext.newRecord - New record
       * @param {string} scriptContext.type - Trigger type
       * @param {Form} scriptContext.form - Current form
       * @Since 2015.2
       */
      function beforeLoad(scriptContext) {

      }

      /**
       * Function definition to be triggered before record is loaded.
       *
       * @param {Object} scriptContext
       * @param {Record} scriptContext.newRecord - New record
       * @param {Record} scriptContext.oldRecord - Old record
       * @param {string} scriptContext.type - Trigger type
       * @Since 2015.2
       */
      function beforeSubmit(scriptContext) {

      }

      /**
       * Function definition to be triggered before record is loaded.
       *
       * @param {Object} scriptContext
       * @param {Record} scriptContext.newRecord - New record
       * @param {Record} scriptContext.oldRecord - Old record
       * @param {string} scriptContext.type - Trigger type
       * @Since 2015.2
       */
      function afterSubmit(scriptContext) {

        var newRec = scriptContext.newRecord
        var context = scriptContext.type

     

       
        log.debug({
            title: "newRec",
            details: newRec.id
        })
        log.debug({
            title: "context",
            details: context
        })

        if(context == "edit"){

            var checkbox = newRec.getValue({
                fieldId: "custentity_rsc_auto_conta_criada"
            })

            var rsc_cnab_conta_bancaria = RSC_CCB(newRec);
            log.audit('rsc_cnab_conta_bancaria', rsc_cnab_conta_bancaria);   

          if((checkbox == false || checkbox == "false") || (checkbox == true && rsc_cnab_conta_bancaria == false)){

            var isInactive = newRec.getValue({
                fieldId: "isinactive"
            })
            
            if(isInactive == false || isInactive == "false"){
                var banco = newRec.getValue({
                    fieldId: "custentity_rsc_auto_banco"
                })
                var companyname = newRec.getValue({
                    fieldId: "companyname"
                })            
                var conta = newRec.getValue({
                    fieldId: "custentity_rsc_auto_numero_conta"
                })
                var numBanco = newRec.getValue({
                    fieldId: "custentity_rsc_auto_num_banco"
                })
                
                var contaDv = newRec.getValue({
                    fieldId: "custentity_rsc_auto_dv_conta"
                })
                // var contaDv = newRec.getValue({
                //     fieldId: "custentity_rsc_auto_dv_conta"
                // })
                var agencia = newRec.getValue({
                    fieldId: "custentity_rsc_auto_agencia"
                })
                var agenciaDv = newRec.getValue({
                    fieldId: "custentity_rsc_auto_dv_ag"
                })
    
                var nameStr = companyname
                nameStr += "_"
                nameStr += numBanco
                nameStr += "_"
                nameStr += agencia
                nameStr += "_"
                nameStr += conta
                nameStr += "_"
                nameStr += contaDv
    
                log.debug({
                    title: "nameStr",
                    details: nameStr
                })

                var checarCampos = checkFields({
                    banco: banco, 
                    conta: conta, 
                    numBanco: numBanco, 
                    contaDv: contaDv, 
                    agencia: agencia
                });
                log.audit('checarCampos', checarCampos);

                if (checarCampos.status == 'OK') {
                    var recConta = record.create({type: 'customrecord_rsc_cnab_bankaccount'});

                    recConta.setValue('custrecord_rsc_cnab_ba_entity_ls', newRec.id)
                    .setValue('name', nameStr)
                    .setValue('custrecord_rsc_cnab_ba_bank_ls', banco)
                    .setValue('custrecord_rsc_cnab_ba_number_ds', conta)
                    .setValue('custrecord_rsc_cnab_ba_dvnumber_ds', contaDv)
                    .setValue('custrecord_rsc_cnab_ba_agencynumber_ls', agencia)
                    .setValue('custrecord_rsc_cnab_ba_dvagencynumber_ds', agenciaDv);

                    var contaSalva = recConta.save({enableSourcing: true, ignoreMandatoryFields: true});
                    log.debug('contaSalva', contaSalva);

                    record.submitFields({type: 'vendor',
                        id: newRec.id,
                        values: {
                            custentity_rsc_auto_conta_criada: true
                        }                                

                    });

                    record.submitFields({type: 'customrecord_rsc_cnab_bankaccount',
                        id: contaSalva,
                        values: {
                            custrecord_rsc_cnab_ba_entity_ls: newRec.id
                        }   
                    });
                }
    
                // var recConta = record.create({
                //     type: "customrecord_rsc_cnab_bankaccount"
                // })
                // recConta.setValue({
                //     fieldId: "	custrecord_rsc_cnab_ba_entity_ls",
                //     value:newRec.id
                // }).setValue({
                //     fieldId: "name",
                //     value: nameStr
                // }).setValue({
                //     fieldId: "custrecord_rsc_cnab_ba_bank_ls",
                //     value:banco
                // }).setValue({
                //     fieldId: "custrecord_rsc_cnab_ba_number_ds",
                //     value:conta
                // }).setValue({
                //     fieldId: "custrecord_rsc_cnab_ba_dvnumber_ds",
                //     value:contaDv
                // }).setValue({
                //     fieldId: "custrecord_rsc_cnab_ba_agencynumber_ls",
                //     value:agencia
                // }).setValue({
                //     fieldId: "custrecord_rsc_cnab_ba_dvagencynumber_ds",
                //     value:agenciaDv
                // })
    
                // var contaSalva = recConta.save()
    
                // record.submitFields({
                //     type: "vendor",
                //     id: newRec.id,
                //     values: {
                //         custentity_rsc_auto_conta_criada:true
                //     }                                
                
                // })
                // record.submitFields({
                //     type: "customrecord_rsc_cnab_bankaccount",
                //     id: contaSalva,
                //     values: {
                //         custrecord_rsc_cnab_ba_entity_ls:newRec.id
                //     }                                
                
                // })
            }

            
           

          }

        }

      }

      const RSC_CCB = (nr) => {
        var bscRCCB = search.create({type: "customrecord_rsc_cnab_bankaccount",
            filters: [
               ["custrecord_rsc_cnab_ba_entity_ls","anyof",nr.id], "AND", 
               ["custrecord_rsc_cnab_ba_bank_ls","anyof",nr.getValue('custentity_rsc_auto_banco')], "AND", 
               ["custrecord_rsc_cnab_ba_number_ds","is",nr.getValue('custentity_rsc_auto_numero_conta')], "AND", 
               ["custrecord_rsc_cnab_ba_dvnumber_ds","is",nr.getValue('custentity_rsc_auto_dv_conta')], "AND", 
               ["custrecord_rsc_cnab_ba_agencynumber_ls","is",nr.getValue('custentity_rsc_auto_agencia')]
            ],
            columns: [
                "created","name","custrecord_rsc_cnab_ba_bank_ls","custrecord_rsc_cnab_ba_number_ds","custrecord_rsc_cnab_ba_dvnumber_ds","custrecord_rsc_cnab_ba_agencynumber_ls",
                "custrecord_rsc_cnab_ba_dvagencynumber_ds"
            ]
        });

        var resultados = bscRCCB.runPaged().count;
        log.audit('RSC_CCB', resultados);

        return resultados == 0 ? false : true;
      }

      const checkFields = (fields) => {
        // log.audit('checkFields', fields);

        for (var prop in fields) {
            if (fields.hasOwnProperty(prop)) {
                if (fields[prop] == "" || fields[prop] == null || fields[prop] == undefined) {
                    // log.audit('Empty', {fields: prop, value: fields[prop]});
                    return { 
                        status: 'Empty', 
                        data: {
                            fields: prop, 
                            value: fields[prop]
                        } 
                    } 
                }
            }
        }

        // log.audit('OK', fields);        
        return { 
            status: 'OK',
            data: fields
        } 
      }

      return {
          //  beforeLoad: beforeLoad,
          // beforeSubmit: beforeSubmit,
          afterSubmit: afterSubmit
      };

  }); //