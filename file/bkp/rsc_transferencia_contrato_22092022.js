/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Adriano Barbosa
 * @since 2021.11
 */
define(['N/format', 'N/log', 'N/query', 'N/record', 'N/search'], (format, log, query, record, search) => {
const atualizarProponentes = (dados) => {
    try {
        var bscProponentes = search.create({type: "customrecord_rsc_finan_client_contrato",
            filters: [
                ["custrecord_rsc_fat_contrato","anyof",dados.custrecord_rsc_contrato]
            ],
            columns: [
                "id","custrecord_rsc_clientes_contratos","custrecord_rsc_pct_part","custrecord_rsc_fat_contrato"
            ]
        }).run().getRange(0,1000);
        // console.log('bscProponentes', JSON.stringify(bscProponentes));

        if (bscProponentes.length > 0) {
            for (i=0; i<bscProponentes.length; i++) {
                console.log('Inativando dados do proponente: '+JSON.stringify(bscProponentes));
                record.load({type: 'customrecord_rsc_finan_client_contrato', id: bscProponentes[i].id, isDynamic: true})
                .setValue('isinactive', true)
                .save();
            }
        }

        dados.customrecord_rsc_cd_novos_proponentes.forEach(function(nb) {
            // console.log('nb', nb);
            var newBidder = record.create({type: 'customrecord_rsc_finan_client_contrato', isDynamic: true});

            newBidder.setValue('custrecord_rsc_clientes_contratos', nb.custrecord_rsc_novo_proponente)
            .setValue('custrecord_rsc_pct_part', nb.custrecord_perc_part_proponente)
            .setValue('custrecord_rsc_principal', nb.custrecord_rsc_principal_proponente)
            .setValue('custrecord_rsc_fat_contrato', dados.custrecord_rsc_contrato);

            const idNewBidder = newBidder.save();
            console.log('idNewBidder', idNewBidder);
        });

        return {
            status: 'Sucesso'
        }
    } catch(e) {
        console.log('Erro atualizarProponentes', JSON.stringify(e));
        
        atualizaCessaoDireito({
            id: dados.cessaoDireito, 
            custrecord_rsc_erro_perc_cessao_direito: JSON.stringify(e)
        });

        return 'Houve um erro no processamento da solicitação. \n Verifique o campo "Erro % Cessão Direito."';
    }        
}

const atualizaCessaoDireito = (dados) => {
    console.log('atualizaCessaoDireito', JSON.stringify(dados));
    
    const loadReg = record.load({type: 'customrecord_rsc_perc_cessao_direito', id: dados.id});

    if (dados.custrecord_rsc_taxa_cd) {
        loadReg.setValue('custrecord_rsc_status_cessao', 4) // Implantado
        .setValue('custrecord_rsc_taxa_cd', dados.custrecord_rsc_taxa_cd)
        .setValue('custrecord_rsc_erro_perc_cessao_direito', '');
    } 
    
    if (dados.custrecord_rsc_erro_perc_cessao_direito) {
        loadReg.setValue(
            'custrecord_rsc_erro_perc_cessao_direito', 
            dados.custrecord_rsc_erro_perc_cessao_direito != null ? dados.custrecord_rsc_erro_perc_cessao_direito : ''
        );
    } 

    loadReg.save();
}

const transferirContrato = (dados) => {
    console.log('transferirContrato', JSON.stringify(dados));
    
    try {     
        var bsc_parcelas_pagas = search.create({type: "invoice",
            filters: [
                ["mainline","is","T"], "AND", 
                ["type","anyof","CustInvc"], "AND", 
                ["custbody_lrc_fatura_principal","anyof",dados.custrecord_rsc_contrato], "AND", 
                ["status","anyof","CustInvc:B"]
            ],
            columns: [
                "internalid","entity","tranid","statusref","custbody_rsc_cessao_direito"
            ]
        }).run().getRange(0,1000);
        console.log('bsc_parcelas_pagas', JSON.stringify(bsc_parcelas_pagas));
       
        // Preenche a cessão de direitos nas parcelas pagas.
        if (bsc_parcelas_pagas.length > 0) {
            console.log('Aqui 1');
            for (i=0; i<bsc_parcelas_pagas.length; i++) { 
                console.log(i, JSON.stringify(bsc_parcelas_pagas[i]));  
                var loadFatura = record.load({type: 'invoice', id: bsc_parcelas_pagas[i].id});                
                loadFatura.setValue('custbody_rsc_cessao_direito', dados.cessaoDireito)
                .save({enableSourcing: true, ignoreMandatoryFields: true});  
                console.log('Parcela atualizada', bsc_parcelas_pagas[i].getValue('tranid'));             
            }            
        } 

        const loadContrato = record.load({type: 'salesorder', id: dados.custrecord_rsc_contrato, isDynamic: true});

        const totalContrato = loadContrato.getValue('total');

        const escrituracao = loadContrato.getValue('custbody_lrc_fat_controle_escrituracao');
        console.log('escrituracao', escrituracao);

        loadContrato.setValue('entity', dados.custrecord_rsc_novo_cliente.value);
        loadContrato.setValue('custbody_rsc_status_contrato', dados.custbody_rsc_status_contrato);

        for (i=0; i<loadContrato.getLineCount('item'); i++) {
            loadContrato.selectLine('item', i);

            var item = loadContrato.getCurrentSublistValue('item', 'item');

            if (item == 28633) { // Serviço para Venda
                loadContrato.setCurrentSublistValue('item', 'amount', totalContrato)
                .commitLine('item');
            }
        }

        loadContrato.save({ignoreMandatoryFields: true});

        // load no registro controle de escrituração para setar o valor do cliente.
        if (escrituracao) {
            const loadescrituracao = record.load({type: 'customrecord_lrc_controle_escrituracao', id: escrituracao, isDynamic: true});

            loadescrituracao.setValue('custrecord_lrc_cliente_ce', dados.custrecord_rsc_novo_cliente.value)
    
            loadescrituracao.save({ignoreMandatoryFields: true});
        }       

        dados.recmachcustrecord_rsc_transferencia_posse.forEach(function (fi) {            
            const loadFI = record.load({type: 'invoice', id: fi.custrecord_rsc_parcela_cessao, isDynamic: true});

            const totalFI = loadFI.getValue('total');

            loadFI.setValue('entity', dados.custrecord_rsc_novo_cliente.value)
            .setValue('custbody_lrc_fatura_principal', dados.custrecord_rsc_contrato)
            .setValue('custbody_rsc_cessao_direito', dados.cessaoDireito);

            for (i=0; i<loadFI.getLineCount('item'); i++) {
                loadFI.selectLine('item', i);

                var item = loadFI.getCurrentSublistValue('item', 'item');

                if (item == 28650) { // Fração Principal
                    loadFI.setCurrentSublistValue('item', 'rate', totalFI)
                    .setCurrentSublistValue('item', 'amount', totalFI)
                    .commitLine('item');
                }
            }

            loadFI.save({ignoreMandatoryFields: true});
            console.log('Sucesso', fi.custrecord_rsc_parcela_cessao);            
        });

        atualizaCessaoDireito({
            id: dados.cessaoDireito, 
            custrecord_rsc_erro_perc_cessao_direito: null
        });
        
        return {
            status: 'Sucesso'
        }
    } catch(e) {
        console.log('Erro transferirContrato', JSON.stringify(e));
        
        atualizaCessaoDireito({
            id: dados.cessaoDireito, 
            custrecord_rsc_erro_perc_cessao_direito: JSON.stringify(e)
        });

        return 'Houve um erro no processamento da solicitação. \n Verifique o campo "Erro % Cessão Direito."';
    }
}

const parcelaUnica = (dados) => {
    console.log('parcelaUnica', JSON.stringify(dados));

    try {
        const formatData = (data) => {
            var partesData = data.split("/");
        
            var novaData = new Date(partesData[2], partesData[1] - 1, partesData[0]);
        
            return novaData;
        }

        const fi = record.create({type: 'invoice', isDynamic: true});

        const lookupContrato = search.lookupFields({type: 'salesorder',
            id: dados.custrecord_rsc_contrato,
            columns: [
                'subsidiary','location','class','department','custbody_rsc_natureza','custbody_rsc_indice','custbody_rsc_nrdocboleto','custbodyrsc_tpparc','custbody_rsc_nr_proposta',
                'custbody_rsc_data_venda','custbody_rsc_vlr_venda','custbody_rsc_ativo','custbody_rsc_tipo_op','custbody_rsc_mod_financ','custbody_rsc_sist_amort','custbody_rsc_tran_unidade',
                'custbody_lrc_fat_controle_escrituracao'
            ]
        });
        console.log('lookupContrato', JSON.stringify(lookupContrato));

        var camposFI = {
            // Informações Principais
            entity: dados.custrecord_rsc_novo_cliente.value, 
            duedate: new Date(),
            memo: 'Taxa Cessão Direito',
            approvalstatus: 2, // Aprovado
            custbody_rsc_cessao_direito: dados.cessaoDireito,
            // Contrato        
            // custbody_rsc_projeto_obra_gasto_compra: dados.custrecord_rsc_empreendimento,
            custbody_lrc_fatura_principal: dados.custrecord_rsc_contrato,
            custbody_rsc_tipo_transacao_workflow: 102,
            subsidiary: lookupContrato.subsidiary.length > 0 ? lookupContrato.subsidiary[0].value : '',
            location: lookupContrato.location.length > 0 ? lookupContrato.location[0].value : '',
            class: lookupContrato.class.length > 0 ? lookupContrato.class[0].value : '',
            department: lookupContrato.department.length > 0 ? lookupContrato.department[0].value : '',
            custbody_rsc_natureza: 25, // Cessão de Direitos
            custbody_rsc_indice: lookupContrato.custbody_rsc_indice.length > 0 ? lookupContrato.custbody_rsc_indice[0].value : '', // FRAÇÃO PRINCIPAL
            custbody_rsc_data_juros: '',
            // Dados dos Contratos
            custbody_rsc_nrdocboleto: lookupContrato.custbody_rsc_nrdocboleto,
            custbodyrsc_tpparc: 21, // Transferência
            custbody_rsc_nr_proposta: lookupContrato.custbody_rsc_nr_proposta,
            custbody_rsc_ebu: '',
            // custbody_rsc_data_venda: lookupContrato.custbody_rsc_data_venda,
            custbody_rsc_vlr_venda: lookupContrato.custbody_rsc_vlr_venda,
            custbody_rsc_ativo: lookupContrato.custbody_rsc_ativo,
            custbody_rsc_tipo_op: lookupContrato.custbody_rsc_tipo_op,
            custbody_rsc_mod_financ: lookupContrato.custbody_rsc_mod_financ,
            custbody_rsc_sist_amort: lookupContrato.custbody_rsc_sist_amort,
            custbody_rsc_tran_unidade: lookupContrato.department.length > 0 ? lookupContrato.custbody_rsc_tran_unidade[0].value : '',
            // custbody_rsc_finan_dateativacontrato: formatData(lookupContrato.custbody_rsc_finan_dateativacontrato),
            // custbody_rsc_finan_indice_base_cont: lookupContrato.custbody_rsc_finan_indice_base_cont,
            custbody_lrc_fat_controle_escrituracao: lookupContrato.custbody_lrc_fat_controle_escrituracao.length > 0 ? lookupContrato.custbody_lrc_fat_controle_escrituracao[0].value : ''
        }
        console.log('camposFI', camposFI);

        const somenteNumero = (valor) => {
            return valor.replace(/[^\d]+/g,'');
        }
    
        const taxaCessao = (function() { var valor = null;
            var bsc_item_servico = search.create({type: "item", 
                filters: [
                    ["name","is","6000017"]
                ],
                columns: [
                    "created","internalid","itemid","displayname"
                ]
            }).run().getRange(0,1);
            console.log('bsc_item_servico', JSON.stringify(bsc_item_servico));
    
            if (bsc_item_servico.length > 0) {
                valor = bsc_item_servico[0].id;
            }

            return valor;
        })();     

        var item = {
            // item: 19420,
            item: taxaCessao,
            quantity: 1,
            // rate: somenteNumero(dados.custrecord_rsc_novo_valor_cd),
            // amount: somenteNumero(dados.custrecord_rsc_novo_valor_cd)
            rate: dados.custrecord_rsc_calculo,
            amount: dados.custrecord_rsc_calculo
        }       
        console.log('item', JSON.stringify(item)); 
   
        Object.keys(camposFI).forEach(function(bodyField) {
            fi.setValue(bodyField, camposFI[bodyField]);          
        });

        fi.selectLine('item', 0)

        .setCurrentSublistValue('item', 'item', item.item)
        .setCurrentSublistValue('item', 'quantity', item.quantity)
        .setCurrentSublistValue('item', 'rate', item.rate)
        .setCurrentSublistValue('item', 'amount', item.amount)

        .commitLine('item');
    
        const idFI = fi.save({ignoreMandatoryFields: true});
        console.log('idFI', idFI);

        if (idFI) {
            atualizaCessaoDireito({id: dados.cessaoDireito, custrecord_rsc_taxa_cd: idFI});

            return {
                status: 'Sucesso', 
                idFI: idFI
            }
        }        
    } catch (e) {
        console.log('Erro parcelaUnica', JSON.stringify(e));
        
        atualizaCessaoDireito({
            id: dados.cessaoDireito, 
            custrecord_rsc_erro_perc_cessao_direito: JSON.stringify(e)
        });

        return 'Houve um erro no processamento da solicitação. \n Verifique o campo "Erro % Cessão Direito."';
    }
}

const parcelasVencidas = (dados) => {
    console.log('parcelasVencidas', JSON.stringify(dados));

    const validarVencimento = (duedate) => {
        console.log('validarVencimento', duedate);

        const hoje = new Date();
    
        var diaHoje = hoje.getDate();
        var mesHoje = hoje.getMonth()+1;
        var anoHoje = hoje.getFullYear();
    
        var partesData = duedate.split("/");
    
        var vencimento = new Date(partesData[2], partesData[1] - 1, partesData[0]);
    
        var diaVencimento = vencimento.getDate();
        var mesVencimento = vencimento.getMonth()+1;
        var anoVencimento = vencimento.getFullYear();
    
        if (hoje > vencimento) {
            var tempo = Math.abs(hoje.getTime() - vencimento.getTime());
    
            var diasMora = Math.ceil(tempo / (1000 * 3600 * 24));
            // log.audit('status: true', {tempo: tempo, diasMora: diasMora});
    
            if ((diasMora-1) > 1) {
                return {
                    status: true, 
                    diasMora: diasMora-1
                }
            }   
            
            return {
                status: false
            }
        } else {
            return {
                status: false
            }
        }
    }

    const validarVencimento2 = (shipdate, duedate) => {
        console.log('validarVencimento2', {shipdate: shipdate, duedate: duedate});

        const partesShipdate = shipdate.split("/");

        var vencimentoShipdate = new Date(partesShipdate[2], partesShipdate[1] - 1, partesShipdate[0]);

        var diaShipdate = vencimentoShipdate.getDate();
        var mesShipdate = vencimentoShipdate.getMonth()+1;
        var anoShipdate = vencimentoShipdate.getFullYear();

        const partesDuedate = duedate.split("/");

        var vencimentoDuedate = new Date(partesDuedate[2], partesDuedate[1] - 1, partesDuedate[0]);

        var diaDuedate = vencimentoDuedate.getDate();
        var mesDuedate = vencimentoDuedate.getMonth()+1;
        var anoDuedate = vencimentoDuedate.getFullYear();

        if (vencimentoShipdate > vencimentoDuedate) {
            var tempo = Math.abs(vencimentoShipdate.getTime() - vencimentoDuedate.getTime());

            var diasMora = Math.ceil(tempo / (1000 * 3600 * 24));
            // log.audit('status: true', {vencimentoShipdate: vencimentoShipdate, vencimentoDuedate: vencimentoDuedate, tempo: tempo, diasMora: diasMora});

            if ((diasMora-1) > 1) {
                return {
                    status: true, 
                    diasMora: diasMora-1
                }
            }   
            
            return {
                status: false
            }
        } else {
            return {
                status: false
            }
        }
    }

    const juros = dados.juros / 100;
    const multa = dados.multa / 100;

    var arrayParcelas = []; 

    const sql = "SELECT transaction.id, transaction.tranid, transaction.status, transaction.duedate, transaction.entity, transaction.foreigntotal, transaction.foreignamountpaid, transaction.shipdate "+
    "FROM transaction "+
    "WHERE transaction.custbody_lrc_fatura_principal = ? "+
    "AND transaction.recordtype = 'invoice' "+
    "AND transaction.duedate < SYSDATE";

    var consulta = query.runSuiteQL({
        query: sql,
        params: [dados.idContrato]
    });

    var sqlResults = consulta.asMappedResults();
    
    for (var key in sqlResults) {
        var status = sqlResults[key].status;

        if (status === 'A' || status === 'B') {
            log.audit('Parcela: '+sqlResults[key].tranid, 'status: '+status);
        } else {
            sqlResults.splice(key, 1);
        }
    }
    console.log('sqlResults', sqlResults);

    if (sqlResults.length > 0) {
        for (var prop in sqlResults) {
            var parcelaVencida = !sqlResults[prop].shipdate ? validarVencimento(sqlResults[prop].duedate) : validarVencimento2(sqlResults[prop].shipdate, sqlResults[prop].duedate);
            console.log('parcelaVencida', parcelaVencida);

            var calcJuros = parcelaVencida.status == true ? sqlResults[prop].foreigntotal * (juros / mes) * parcelaVencida.diasMora : 0;
            var calcMulta = sqlResults[prop].foreignamountpaid > 0 ? 0 : (parcelaVencida.status == true ? sqlResults[prop].foreigntotal * multa : 0);
            console.log('juros: '+juros, 'multa: '+multa);

            arrayParcelas.push({
                id: sqlResults[prop].id,
                tranid: sqlResults[prop].tranid,
                status: sqlResults[prop].status,
                duedate: sqlResults[prop].duedate,
                entity: sqlResults[prop].entity,
                foreigntotal: sqlResults[prop].foreigntotal,
                foreignamountpaid: sqlResults[prop].foreignamountpaid,
                shipdate: sqlResults[prop].shipdate,
                totalUpdated: sqlResults[prop].foreigntotal + calcJuros + calcMulta
            });
            console.log('prop: '+prop, 'arrayParcelas: '+JSON.stringify(arrayParcelas));
        }
    }

    arrayParcelas = arrayParcelas.filter(function (dados) {
        return !this[JSON.stringify(dados)] && (this[JSON.stringify(dados)] = true);
    }, Object.create(null));
    console.log('arrayParcelas (filter)', arrayParcelas);

    arrayParcelas = [...new Set(arrayParcelas)];
    console.log('arrayParcelas (new Set)', arrayParcelas);

    var total_parcela_unica = 0;

    arrayParcelas.forEach(function (dados) {
        total_parcela_unica += Number(dados.totalUpdated);
    });
    console.log('total_parcela_unica', total_parcela_unica);

    // var fileObj = file.create({
    //     name: 'parcelasVencidas.txt',
    //     fileType: file.Type.PLAINTEXT,
    //     folder: 704,    // SuiteScripts > teste > Arquivos
    //     contents: JSON.stringify(arrayParcelas)
    //     // contents: JSON.stringify(sqlResults)
    // });
    // console.log('fileObj', fileObj);

    // var fileObjId = fileObj.save();
    // console.log('fileObjId', fileObjId);
    
    return {arrayParcelas: arrayParcelas, total_parcela_unica: total_parcela_unica};
}

return {
    atualizarProponentes: atualizarProponentes,
    parcelasVencidas: parcelasVencidas,
    parcelaUnica: parcelaUnica,
    transferirContrato: transferirContrato
}
});
