 /**
  * @NApiVersion 2.1
  * @NScriptType UserEventScript
  * @NModuleScope Public
  */
  define(['N/record', 'N/query'],
  /**
   * @param{serverWidget} serverWidget
   * @param{message} message
   * @param{redirect} redirect
   * @param{runtime} runtime
   * @param{translation} translation
   * @param{record} record
   * @param{search} search
   */
  function (record, query) {

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
    

          if(checkbox == false || checkbox == "false"){

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
                var contaDv = newRec.getValue({
                    fieldId: "custentity_rsc_auto_dv_conta"
                })
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
    
                var recConta = record.create({
                    type: "customrecord_rsc_cnab_bankaccount"
                })
                recConta.setValue({
                    fieldId: "	custrecord_rsc_cnab_ba_entity_ls",
                    value:newRec.id
                }).setValue({
                    fieldId: "name",
                    value: nameStr
                }).setValue({
                    fieldId: "custrecord_rsc_cnab_ba_bank_ls",
                    value:banco
                }).setValue({
                    fieldId: "custrecord_rsc_cnab_ba_number_ds",
                    value:conta
                }).setValue({
                    fieldId: "custrecord_rsc_cnab_ba_dvnumber_ds",
                    value:contaDv
                }).setValue({
                    fieldId: "custrecord_rsc_cnab_ba_agencynumber_ls",
                    value:agencia
                }).setValue({
                    fieldId: "custrecord_rsc_cnab_ba_dvagencynumber_ds",
                    value:agenciaDv
                })
    
                var contaSalva = recConta.save()
    
                record.submitFields({
                    type: "vendor",
                    id: newRec.id,
                    values: {
                        custentity_rsc_auto_conta_criada:true
                    }                                
                
                })
                record.submitFields({
                    type: "customrecord_rsc_cnab_bankaccount",
                    id: contaSalva,
                    values: {
                        custrecord_rsc_cnab_ba_entity_ls:newRec.id
                    }                                
                
                })
            }

            
           

          }

        }

      }
      return {
          //  beforeLoad: beforeLoad,
          // beforeSubmit: beforeSubmit,
          afterSubmit: afterSubmit
      };

  }); //