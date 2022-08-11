/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Vitor Santos 
 */
define(["N/record", "N/search", "N/ui/serverWidget", "N/task", 'N/config', 'N/runtime', 'N/file' ], 
function (record, search, serverWidget, task, config, runtime, file) {

    function onRequest(context) {
        
        try {
            if (context.request.method === 'GET') {              

                const form = serverWidget.createForm({
                    title: 'Geração DIMOB'
                })

                const report_selection = form.addField({
                    id: 'custpage_report_selection',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Seleção do Relatório',
                })               
                report_selection.addSelectOption({value : 'R01', text : 'R01', isSelected: true});    
                
                
                
                
                const subsidiary = form.addField({
                    id: 'custpage_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiária',
                    source: 'subsidiary'
                })
                // subsidiary.addSelectOption({value : '', text : '', isSelected: true});  
                
                
                const rectifying_statement = form.addField({
                    id: 'custpage_rectifying_statement',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Declaração Retificadora',
                    source: 'customlist_rsc_dimob_sim_nao'
                })
                // rectifying_statement.addSelectOption({value : '', text : '', isSelected: true}); 
                // rectifying_statement.addSelectOption({value : '0', text : 'Não'}); 
                // rectifying_statement.addSelectOption({value : '1', text : 'Sim'});
                
                
                const special_situation_code = form.addField({
                    id: 'custpage_special_situation_code',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Código da situação especial',
                    source: 'customlist_rsc_codigos'
                })
                // special_situation_code.addSelectOption({value : '', text : '', isSelected: true}); 
                // special_situation_code.addSelectOption({value : '00', text : '00 - Normal'}); 
                // special_situation_code.addSelectOption({value : '01', text : '01 - Extinção'}); 
                // special_situation_code.addSelectOption({value : '02', text : '02 - Fusão'}); 
                // special_situation_code.addSelectOption({value : '03', text : '03 - Incorporação/Incorporada'}); 
                // special_situation_code.addSelectOption({value : '04', text : '04 - Cisão Total'});                 
                
                
                const date_event = form.addField({
                    id: 'custpage_date_event',
                    type: serverWidget.FieldType.DATE,
                    label: 'Data evento situação especial',
                })                
                
                const responsible_cnpj = form.addField({
                    id: 'custpage_responsible_cnpj',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Responvel pelo CNPJ',
                })
                
                
                const receipt_number = form.addField({
                    id: 'custpage_receipt_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Número do recibo',
                })
                
            
                const file_address = form.addField({
                    id: 'custpage_file_address',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Endereço de arquivo',
                })
                
                
                const button = form.addSubmitButton({label: 'Gerar DIMOB',})  
                context.response.writePage(form);
                

                
                
            } else {    
                
                var request = context.request
                var parameters = request.parameters
                log.audit('parameters', parameters);

                const form = serverWidget.createForm({
                    title: 'Geração DIMOB'
                })

                const report_selection = form.addField({
                    id: 'custpage_report_selection',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Seleção do Relatório',
                })             
                report_selection.addSelectOption({value : 'R01', text : 'R01', isSelected: true});              
                var reportSelection = parameters.custpage_report_selection               
                
                
                const subsidiary = form.addField({
                    id: 'custpage_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiária',
                })
                // subsidiary.addSelectOption({value : '', text : '', isSelected: true});  

                subsidiary.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                subsidiary.defaultValue = parameters.custpage_subsidiary

                
                const rectifying_statement = form.addField({
                    id: 'custpage_rectifying_statement',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Declaração Retificadora',
                })
                rectifying_statement.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                // rectifying_statement.addSelectOption({value : '', text : '', isSelected: true}); 
                // rectifying_statement.addSelectOption({value : '0', text : 'Não'}); 
                // rectifying_statement.addSelectOption({value : '1', text : 'Sim'});
                rectifying_statement.defaultValue = parameters.custpage_rectifying_statement

                
                const special_situation_code = form.addField({
                    id: 'custpage_special_situation_code',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Código da situação especial',
                })
                // special_situation_code.addSelectOption({value : '', text : '', isSelected: true}); 
                // special_situation_code.addSelectOption({value : '00', text : '00 - Normal'}); 
                // special_situation_code.addSelectOption({value : '01', text : '01 - Extinção'}); 
                // special_situation_code.addSelectOption({value : '02', text : '02 - Fusão'}); 
                // special_situation_code.addSelectOption({value : '03', text : '03 - Incorporação/Incorporada'}); 
                // special_situation_code.addSelectOption({value : '04', text : '04 - Cisão Total'});      
                special_situation_code.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });           
                special_situation_code.defaultValue = parameters.custpage_special_situation_code
                
                
                const date_event = form.addField({
                    id: 'custpage_date_event',
                    type: serverWidget.FieldType.DATE,
                    label: 'Data evento situação especial',
                }) 
                date_event.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });               
                date_event.defaultValue = parameters.custpage_date_event

                const responsible_cnpj = form.addField({
                    id: 'custpage_responsible_cnpj',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Responvel pelo CNPJ',
                })
                responsible_cnpj.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                responsible_cnpj.defaultValue = parameters.custpage_responsible_cnpj
                
                
                const receipt_number = form.addField({
                    id: 'custpage_receipt_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Número do recibo',
                })
                receipt_number.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                receipt_number.defaultValue = parameters.custpage_receipt_number

            
                const file_address = form.addField({
                    id: 'custpage_file_address',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Endereço de arquivo',
                })
                file_address.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                file_address.defaultValue = parameters.custpage_file_address

                
                const button = form.addSubmitButton({label: 'Gerar DIMOB',})  
                
                context.response.writePage(form);
                
               
                task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_rsc_dimob_mr',
                    deploymentId: 'customdeploy_rsc_dimob_mr',
                    params: {
                        custscript_rsc_report_selection: parameters.custpage_report_selection,
                        custscript_rsc_subsidiary_dimob: parameters.custpage_subsidiary,
                        custscript_rsc_rectifying_statement: parameters.custpage_rectifying_statement,
                        custscript_rsc_special_situation_code: parameters.custpage_special_situation_code,
                        custscript_rsc_date_event: parameters.custpage_date_event,
                        custscript_rsc_responsible_cnpj: parameters.custpage_responsible_cnpj,
                        custscript_rsc_receipt_number: parameters.custpage_receipt_number,
                        custscript_rsc_file_address: parameters.custpage_file_address,
                    }                    
                }).submit()
                
            }
        }
        
    catch (e) {
        log.error('ERRO', e)

    }
}
   
    return {
        onRequest: onRequest
    }
});
