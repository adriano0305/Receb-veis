/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
 define(['N/search', 'N/runtime', 'N/record', './rsc_junix_call_api.js'],
    
 (search, runtime, record, api) => {

     /**
      * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
      * @param {Object} inputContext
      * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
      *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
      * @param {Object} inputContext.ObjectRef - Object that references the input data
      * @typedef {Object} ObjectRef
      * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
      * @property {string} ObjectRef.type - Type of the record instance that contains the input data
      * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
      * @since 2015.2
      */
     const getInputData = (inputContext) => {
             log.debug({title:'getInputData', details: 'done'});
             return search.create({   
                     type: "customrecord_rsc_unidades_empreendimento",
                      filters:
                          [
                                 ["custrecord_rsc_atualizado_und_junix","is","F"]/*,
                            	"AND",
                            	["internalid", "IS", 22500]*/
                          ],
                     columns:
                         [
                             search.createColumn({
                                     name: "name",
                                     sort: search.Sort.ASC,
                                     label: "Name"
                             }),
                             search.createColumn({name: "scriptid", label: "Script ID"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_projeto", label: "Projeto"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_bloco", label: "Bloco"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_metragem", label: "Metragem"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_status", label: "Status"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_nr_contrato", label: "Contrato"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_vl_estoque", label: "Valor Estoque"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_unidade", label: "Unidade"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_andar", label: "Id Junix"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_vagas", label: "Id Junix"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_a_privativa", label: "Id Junix"}),
                             search.createColumn({name: "custrecord_rsc_id_unidade_junix", label: "Id Unidade"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_metragem", label: "Metragem"}),
                             search.createColumn({name: "custrecord_rsc_un_emp_acessao", label: "Acessao"}),
                             search.createColumn({name: "custrecord_rsc_un_pne", label: "PNE"}),
                             search.createColumn({name: "custrecord_rsc_un_matricula", label: "Matricula"}),
                             search.createColumn({name: "custrecord_rsc_un_registromemorial", label: "Registro Memorial"}),
                             search.createColumn({name: "custrecord_rsc_un_modalidade", label: "Modalidade"}),
                             search.createColumn({name: "custrecord_rsc_un_qtddormitorios", label: "Quantidade dormitórios"}),
                             search.createColumn({name: "custrecord_rsc_un_vagasmoto", label: "Vagas Moto"}),
                             search.createColumn({name: "custrecord_rsc_un_areagaragem", label: "Área Garagem"}),
                             search.createColumn({name: "custrecord_rsc_un_areaterraco", label: "Área Terraço"}),
                             search.createColumn({name: "custrecord_rsc_un_areaoutros", label: "Área Outros"}),
                             search.createColumn({name: "custrecord_rsc_un_codunidade", label: "Código Unidade"}),
                             search.createColumn({name: "custrecord_rsc_un_tipounidade", label: "Tipo Unidade"}),
                         ]

             });
     }

     /**
      * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
      * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
      * context.
      * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
      *     is provided automatically based on the results of the getInputData stage.
      * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
      *     function on the current key-value pair
      * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
      *     pair
      * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
      *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
      * @param {string} mapContext.key - Key to be processed during the map stage
      * @param {string} mapContext.value - Value to be processed during the map stage
      * @since 2015.2
      */
     const map = (mapContext) => {
         try {
             log.debug({title:'Map', details: mapContext});
             var searchResult = JSON.parse(mapContext.value);
			 var unitRecord = record.load({
               type:'customrecord_rsc_unidades_empreendimento',
               id: searchResult.id
             })
             internalid = searchResult.id;

             log.debug({title: 'Job', details:searchResult.values['custrecord_rsc_un_emp_projeto'] })
             /* recuperar os dados */
             var projeto = record.load({
                 type: record.Type.JOB,
                 id: searchResult.values['custrecord_rsc_un_emp_projeto'].value,
                 isDynamic: false,
             });

             var subsidiary = record.load({
                 type: record.Type.SUBSIDIARY,
                 id: projeto.getValue('subsidiary'),
                 isDynamic: false});

             // var codProject = subsidiary.getValue('name').substr(0,4)
             var entityid = String(projeto.getValue('entityid')).split(" ");
             var codProject = entityid[0];
             log.debug({title: 'entityid[0]', details: entityid[0]});

             // log.denug('Status', searchResult.values['custrecord_rsc_un_emp_status'].text);

             /* montar o body do request */
             var body = {
                 codigoEmpreendimento: projeto.getValue('custentity_rsc_id_empreendimento_junix') || "",
                 codigoBloco: unitRecord.getValue('custrecord_rsc_un_emp_bloco') || "",
                 numeroUnidade: unitRecord.getValue('custrecord_rsc_un_emp_unidade') || "",
                 status: unitRecord.getText('custrecord_rsc_un_emp_status')|| "",
                 andar: unitRecord.getValue('custrecord_rsc_un_emp_andar') || "",
                 vagas: unitRecord.getValue('custrecord_rsc_un_emp_vagas') || "",
                 areaPrivativa: unitRecord.getValue('custrecord_rsc_un_emp_a_privativa') || "",
                 pne: unitRecord.getValue('custrecord_rsc_un_pne') || "",
                 valorAvaliacao: unitRecord.getValue('custrecord_rsc_un_emp_vl_estoque') || "",
                 metragem: unitRecord.getValue('custrecord_rsc_un_emp_metragem') || "",
                 matricula: unitRecord.getValue('custrecord_rsc_un_matricula') || "",
                 fracaoIdeal: unitRecord.getValue('custrecord_rsc_un_emp_fracao') || "",
                 areaComum: unitRecord.getValue('custrecord_rsc_un_emp_a_contrucao') || "",
                 registroMemorial: unitRecord.getValue('custrecord_rsc_un_registromemorial') || "",
                 modalidade: unitRecord.getValue('custrecord_rsc_un_modalidade') || "",
                 qtdDormitorio: unitRecord.getValue('custrecord_rsc_un_qtddormitorios') || "",
                 vagasMoto: unitRecord.getValue('custrecord_rsc_un_vagasmoto') || "",
                 areaGaragem: unitRecord.getValue('custrecord_rsc_un_areagaragem') || "",
                 areaTerraco: unitRecord.getValue('custrecord_rsc_un_areaterraco') || "",
                 areaOutros: unitRecord.getValue('custrecord_rsc_un_areaoutros') || "",
                 acessao: unitRecord.getValue('custrecord_rsc_un_emp_acessao') || "",
                 codigoExterno: unitRecord.getValue('custrecord_rsc_id_unidade_junix') || "",
                 codUnidade: unitRecord.getValue('custrecord_rsc_un_codunidade') || "",
                 tipoUnidade: unitRecord.getValue('custrecord_rsc_un_tipounidade') || "",
                 nomeEmpreendimento: unitRecord.getText('custrecord_rsc_un_emp_projeto') || "",
                 nomeBloco: unitRecord.getText('custrecord_rsc_un_emp_bloco') || "",
                 metragem: unitRecord.getValue('custrecord_rsc_un_emp_metragem') || ""
             }
             log.debug({title: 'body', details: body})
             /* Atualizar como processsado*/
             /*var load_sub =  record.load({
                 type: record.Type.SUBSIDIARY,
                 id: rec_id,
                 isDynamic: false,
             });

             load_sub.setValue('custrecord_rsc_atualizado_junix', false);
             load_sub.save(); */

             var retorno = JSON.parse(api.sendRequest(body, 'UNIDADE_JUNIX/1.0/'));
             log.debug({title: "retorno", details: retorno});
             var job_update = record.load({
                 type: 'customrecord_rsc_unidades_empreendimento',
                 id: internalid,
                 isDynamic: false,
             });
             if (retorno.OK){
                 
                 log.debug({title: "Retornou Ok.", details: "Retornou o ID " + retorno.Dados});
                 job_update.setValue('custrecord_rsc_atualizado_und_junix', true);
                 job_update.setValue('custrecord_rsc_junix_unidade_id', retorno.Dados.Id);
                 job_update.setValue('custrecord_rsc_status_unid_junix', '');
                 
                 
             } else {
                 job_update.setValue('custrecord_rsc_status_unid_junix', 'Preencha o campo ' + retorno.CampoErros[0].Campo);
                 log.debug({title: "Retornou Erro .", details: "Mensagem Erro " + retorno.CampoErros[0].Campo});
             }

             job_update.save();
             var scriptObj = runtime.getCurrentScript();
             log.debug({
                 title: "Remaining usage units: ",
                 details: scriptObj.getRemainingUsage()
             });
         } catch (e){
             log.error({title: 'Erro', details: e.message})
         }
     }

     return {getInputData, map}

 });
