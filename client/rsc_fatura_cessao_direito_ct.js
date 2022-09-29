/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
const custPage = 'custpage_rsc_';

define(['./rsc_transferencia_contrato.js', 'N/currentRecord', 'N/https', 'N/record', 'N/search', 'N/ui/dialog', 'N/url', 'N/runtime'], (contractTransfer, currentRecord, https, record, search, dialog, url, runtime) => {
const subsidiarias = (idNC, idSub) => {
    const loadReg = record.load({type: 'customer', id: idNC});

    var submachines = [];

    for (i=0; i<loadReg.getLineCount('submachine'); i++) {
        submachines.push(loadReg.getSublistValue('submachine', 'subsidiary', i));
    }
    console.log('submachines', submachines);

    var status = false;

    for (m=0; m<submachines.length; m++) {
        if (submachines[m] == idSub) {
            console.log('Igual', {idSub: idSub, 'submachine[i]': submachines[m]});
            status = true;
        }
    }

    return status;
}

const subsidiariaGafisaSa = (idNC) => {
    const loadReg = record.load({type: 'customer', id: idNC});

    var submachines = [];

    for (i=0; i<loadReg.getLineCount('submachine'); i++) {
        submachines.push(loadReg.getSublistValue('submachine', 'subsidiary', i));
    }
    console.log('submachines', submachines);

    var status = false;
    let idSubsiariaSA = 0
    if (runtime.envType == 'PRODUCTION'){
        var searchSub = search.create({
            type: 'subsidiary', 
            filters:[
                ['legalname', 'IS', 'GAFISA S.A.']
            ]
        }).run().getRange({
            start: 0,
            end:1
        })
        idSubsiariaSA = searchSub[0].id
    }else{
        var searchSub = search.create({
            type: 'subsidiary',
            filters:[
                ['legalname', 'IS', 'GAFISA S.A.']
            ]
        }).run().getRange({
            start: 0,
            end:1
        })
        idSubsiariaSA = searchSub[0].id
    }

    for (m=0; m<submachines.length; m++) {
        if (submachines[m] == idSubsiariaSA) {
            console.log('Igual', {idSubsiariaSA: idSubsiariaSA, 'submachine[i]': submachines[m]});
            status = true;
        }
    }

    return status;
}

const percentualParticipacao = (idContrato, idCliente) => {
    const bscProponentes = search.create({type: "customrecord_rsc_finan_client_contrato",
        filters: [
            ["custrecord_rsc_fat_contrato","anyof",idContrato], "AND", 
            ["custrecord_rsc_clientes_contratos","anyof",idCliente]
        ],
        columns: [
            "id","custrecord_rsc_clientes_contratos","custrecord_rsc_pct_part","custrecord_rsc_fat_contrato"
        ]
    }).run().getRange(0,1);

    return bscProponentes.length > 0 ? bscProponentes[0].getValue('custrecord_rsc_pct_part') : 0;
}

const contratoFI = (fi) => {
    const bscFI = search.lookupFields({type: 'invoice',
        id: fi.id,
        columns: [fi.campo]
    });

    if (fi.campo == 'tranid') {
        return bscFI[fi.campo];
    }

    return bscFI[fi.campo].length > 0 ? bscFI[fi.campo][0].text : '';
}

const cliente = (id, doc) => {
    const lookupCliente = search.lookupFields({type: 'customer',
        id: id,
        columns: ['custentity_enl_cnpjcpf','custentity_lrc_rg']
    });

    return doc == 'cpf' ? lookupCliente.custentity_enl_cnpjcpf : lookupCliente.custentity_lrc_rg;
}

const pageInit = (context) => {
    const registroAtual = context.currentRecord;

    const novoCliente = registroAtual.getValue(custPage+'novo_cliente');

    const proponentes = custPage+'sublista_lista_proponentes';

    const novosProponentes = custPage+'sublista_lista_novos_props';

    var arrayProponentes = {
        proponentes: [],
        novosProponentes: []
    }
    
    for (i=0; i<registroAtual.getLineCount(proponentes); i++) {
        arrayProponentes.proponentes.push({
            proponente: registroAtual.getSublistText(proponentes, custPage+'prop', i),
            percParticipacao: registroAtual.getSublistValue(proponentes, custPage+'perc_participacao_prop', i),
            principal: registroAtual.getSublistValue(proponentes, custPage+'prop_principal', i)
        });
    }

    registroAtual.setValue({
        fieldId: custPage+'json_proponentes',
        value: JSON.stringify(arrayProponentes)
    });
}

const saveRecord = (context) => {
    const registroAtual = context.currentRecord;

    const novoCliente = registroAtual.getValue(custPage+'novo_cliente');

    const loadContrato = record.load({type: 'salesorder', id: registroAtual.getValue(custPage+'contrato')});

    const subsidiaria = {
        value: loadContrato.getValue('subsidiary'),
        text: loadContrato.getText('subsidiary')
    }

    if (subsidiarias(novoCliente, subsidiaria.value) == false) {
        dialog.alert({
            title: 'Aviso!',
            message: 'Subsidiária '+subsidiaria.text+' não vinculada ao novo cliente.'
        });

        return false;
    }

    if(subsidiariaGafisaSa(novoCliente) == false){
        dialog.alert({
            title: 'Aviso!',
            message: 'Vincule o novo usuário na subsidiaria GAFISA S/A'
        });

        return false;
    }

    const novosProponentes = custPage+'sublista_lista_novos_props';

    var total_perc_part = 0;
    var total_prop_princ = 0;
    
    if (novoCliente) {
        for (i=0; i<registroAtual.getLineCount(novosProponentes); i++) {
            var percParticipacao = registroAtual.getSublistValue(novosProponentes, custPage+'perc_participacao_novo_prop',  i);
            var principal = registroAtual.getSublistValue(novosProponentes, custPage+'novo_prop_principal', i);

            if (principal == true) {
                total_prop_princ += 1;
            }

            total_perc_part += percParticipacao;
        }

        if (total_perc_part !== 100) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Percentual de participação deve ser igual a 100%.'
            });

            return false;
        }

        if (total_prop_princ > 1) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Somente um proponente deve ser o principal.'
            });

            return false;
        }

        if (total_prop_princ == 0) {
            dialog.alert({
                title: 'Aviso!',
                message: 'Selecione o proponente principal.'
            });

            return false;
        }
    
        if (confirm('Confirma a alteração?')) {
            return true;
        } else {
            return false;
        }
    } else {    
        dialog.alert({
            title: 'Aviso!',
            message: 'Selecione o Novo Cliente.'
        });
        
        return false;
    }
}

const validateField = (context) => {}

const fieldChanged = (context) => {    
    const registroAtual = context.currentRecord;

    const clienteAtual = registroAtual.getValue(custPage+'cliente_atual');

    const novosProponentes = custPage+'sublista_lista_novos_props';

    var campo = context.fieldId;

    if (campo == custPage+'custrecord_rsc_status_cessao') {
        var statusCessao = registroAtual.getValue(campo);
        console.log('statusCessao', statusCessao);

        if (statusCessao == 1) {
            registroAtual.setValue(campo, 4);

            var taxaCD = {
                value: registroAtual.getValue('custrecord_rsc_taxa_cd'),
                text: registroAtual.getText('custrecord_rsc_taxa_cd')
            };

            if (taxaCD.value) {
                dialog.alert({
                    title: 'Aviso!',
                    message: 'Já existe taxa para esta cessão: '+taxaCD.text
                });

                return false;
            }
        }
    }

    if (campo == custPage+'novo_cliente') {
        var novoCliente = registroAtual.getValue(campo);

        // if (novoCliente == clienteAtual) {
        //     registroAtual.setValue(campo, '');

        //     dialog.alert({
        //         title: 'Aviso!',
        //         message: 'Novo Cliente deve ser diferente do cliente atual.'
        //     });

        //     return false;
        // }

        registroAtual.selectLine({
            sublistId: novosProponentes,
            line: 0
        });

        registroAtual.setCurrentSublistValue({
            sublistId: novosProponentes,
            fieldId: custPage+'novo_prop',
            value: novoCliente
        });
        
        registroAtual.setCurrentSublistValue({
            sublistId: novosProponentes,
            fieldId: custPage+'novo_prop_principal',
            value: true
        });        
    }

    if (campo == custPage+'perc_cessao_direito') {
        var perc_cessao_direito = registroAtual.getValue(campo);

        var totalParcelas = registroAtual.getValue(custPage+'total_parcelas');

        var calculo = ((totalParcelas * perc_cessao_direito) / 100).toFixed(2);

        registroAtual.setValue(custPage+'calculo', calculo);
    }
}

const postSourcing = (context) => {}

const lineInit = (context) => {}

const validateDelete = (context) => {}

const validateInsert = (context) => {}

const validateLine = (context) => {}

const sublistChanged = (context) => {
    console.log('sublistChanged', JSON.stringify(context));
    const registroAtual = context.currentRecord;
    console.log('registroAtual', JSON.stringify(registroAtual));

    const proponentes = custPage+'sublista_lista_proponentes';

    const sublista = context.sublistId;

    var arrayProponentes = {
        proponentes: [],
        novosProponentes: []
    }

    if (sublista == custPage+'sublista_lista_novos_props') {
        for (i=0; i<registroAtual.getLineCount(proponentes); i++) {
            arrayProponentes.proponentes.push({
                proponente: registroAtual.getSublistText(proponentes, custPage+'prop', i),
                percParticipacao: registroAtual.getSublistValue(proponentes, custPage+'perc_participacao_prop', i),
                principal: registroAtual.getSublistValue(proponentes, custPage+'prop_principal', i)
            });
        }

        for (i=0; i<registroAtual.getLineCount(sublista); i++) {
            arrayProponentes.novosProponentes.push({
                proponente: registroAtual.getSublistText(sublista, custPage+'novo_prop', i),
                percParticipacao: registroAtual.getSublistValue(sublista, custPage+'perc_participacao_novo_prop', i),
                principal: registroAtual.getSublistValue(sublista, custPage+'novo_prop_principal', i)
            });
        }

        registroAtual.setValue({
            fieldId: custPage+'json_proponentes',
            value: ''
        });

        registroAtual.setValue({
            fieldId: custPage+'json_proponentes',
            value: JSON.stringify(arrayProponentes)
        });
    }
}

const retornarContrato = () => {
    const registroAtual = currentRecord.get();

    const contrato = registroAtual.getValue(custPage+'contrato');

    const urlContrato = url.resolveRecord({
        recordType: 'invoice',
        recordId: contrato,
        isEditMode: false
    });

    document.location = urlContrato;
}

const implantacao = () => {
    const registroAtual = currentRecord.get();
    console.log(JSON.stringify(registroAtual));
    
    var arrayParcelas = [];

    if (registroAtual.id && registroAtual.isNew == false) {
        const bscCD = search.create({type: "customrecord_rsc_perc_cessao_direito",
            filters: [
               ["internalid","anyof",registroAtual.id]
            ],
            columns: [
                "created","custrecord_rsc_status_cessao","custrecord_rsc_contrato","custrecord_rsc_empreendimento","custrecord_rsc_cliente_atual","custrecord_rsc_novo_cliente","custrecord_rsc_total_parcelas",
                "custrecord_rsc_perc_cessao_direito","custrecord_rsc_calculo","custrecord_rsc_novo_valor_cd","custrecord_rsc_perc_juros","custrecord_rsc_perc_multa","custrecord_rsc_taxa_cd"
            ]
        }).run().getRange(0,1);
        console.log('bscCD', JSON.stringify(bscCD));

        const statusCessao = bscCD[0].getValue('custrecord_rsc_status_cessao');
        console.log('statusCessao: '+statusCessao);

        if (bscCD[0].getValue('custrecord_rsc_status_cessao') == 1) {
            if (bscCD[0].getValue('custrecord_rsc_taxa_cd')) {
                dialog.alert({
                    title: 'Aviso!',
                    message: 'Já existe taxa para esta cessão: '+bscCD[0].getText('custrecord_rsc_taxa_cd')
                });
        
                return false;
            } else {
                dialog.alert({
                    title: 'Aviso!',
                    message: '% Cessão Direito deve estar aprovada!'
                });
        
                return false;
            }            
        }

        const bsc_sublista_CD = search.create({type: "customrecord_rsc_sublista_cessao_direito",
            filters: [
               ["custrecord_rsc_transferencia_posse","anyof",registroAtual.id]
            ],
            columns: [
                "created","custrecord_rsc_parcela_cessao","custrecord_rsc_vencimento_cessao","custrecord_rsc_cliente_atual_cessao","custrecord_rsc_novo_cliente_cessao","custrecord_rsc_valor_cessao",
                "custrecord_rsc_atualizado"
            ]
        }).run().getRange(0,1000);
        console.log('bsc_sublista_CD', JSON.stringify(bsc_sublista_CD));

        for (i=0; i<bsc_sublista_CD.length; i++) {
            arrayParcelas.push({
                custrecord_rsc_parcela_cessao: bsc_sublista_CD[i].getValue('custrecord_rsc_parcela_cessao'),
                custrecord_rsc_valor_cessao: bsc_sublista_CD[i].getValue('custrecord_rsc_valor_cessao')
            });
        }

        const bsc_cessao_novos_proponentes = search.create({type: "customrecord_rsc_cd_novos_proponentes",
            filters: [
               ["custrecord_rsc_novos_proponentes","anyof",registroAtual.id]
            ],
            columns: [
                "id","custrecord_rsc_novo_proponente","custrecord_perc_part_proponente","custrecord_rsc_principal_proponente"
            ]
        }).run().getRange(0,1000);
        // console.log('bsc_cessao_novos_proponentes', JSON.stringify(bsc_cessao_novos_proponentes));

        var arrayProponentes = [];

        for (i=0; i<bsc_cessao_novos_proponentes.length; i++) {
            arrayProponentes.push({
                custrecord_rsc_novo_proponente: bsc_cessao_novos_proponentes[i].getValue('custrecord_rsc_novo_proponente'),
                custrecord_perc_part_proponente: bsc_cessao_novos_proponentes[i].getValue('custrecord_perc_part_proponente').replace('%', ''),
                custrecord_rsc_principal_proponente: bsc_cessao_novos_proponentes[i].getValue('custrecord_rsc_principal_proponente')
            });
        }
        
        var json = {
            cessaoDireito: registroAtual.id,
            custrecord_rsc_contrato: bscCD[0].getValue('custrecord_rsc_contrato'),
            custrecord_rsc_empreendimento: bscCD[0].getValue('custrecord_rsc_empreendimento'),
            custrecord_rsc_cliente_atual: {
                value: bscCD[0].getValue('custrecord_rsc_cliente_atual'),
                text: bscCD[0].getText('custrecord_rsc_cliente_atual')
            },
            custrecord_rsc_total_parcelas: bscCD[0].getValue('custrecord_rsc_total_parcelas'),
            custrecord_rsc_novo_cliente: {
                value: bscCD[0].getValue('custrecord_rsc_novo_cliente'),
                text: bscCD[0].getText('custrecord_rsc_novo_cliente')
            },
            custrecord_rsc_calculo: bscCD[0].getValue('custrecord_rsc_calculo'),
            custrecord_rsc_novo_valor_cd: bscCD[0].getValue('custrecord_rsc_novo_valor_cd'),
            custrecord_rsc_perc_cessao_direito: bscCD[0].getValue('custrecord_rsc_perc_cessao_direito').replace('%', ''),
            custrecord_rsc_perc_juros: bscCD[0].getValue('custrecord_rsc_perc_juros').replace('%', ''),
            custrecord_rsc_perc_multa: bscCD[0].getValue('custrecord_rsc_perc_multa').replace('%', ''),
            recmachcustrecord_rsc_transferencia_posse: arrayParcelas,
            customrecord_rsc_cd_novos_proponentes: arrayProponentes,
            // custbody_rsc_status_contrato: 4 // Transferido
        }
        console.log('json', JSON.stringify(json));

        var perc_cessao_direito = bscCD[0].getValue('custrecord_rsc_perc_cessao_direito').replace('%', '');
        console.log('perc_cessao_direito:' +perc_cessao_direito);

        if (perc_cessao_direito > 0) {
            var mensagem = 'Taxa Cessão Direito: '+
            (bscCD[0].getValue('custrecord_rsc_novo_valor_cd') > 0 ? bscCD[0].getValue('custrecord_rsc_novo_valor_cd') : bscCD[0].getValue('custrecord_rsc_calculo'))+
            '\n Confirma?';

            if (confirm(mensagem)) {                      
                var cessaoDireito = contractTransfer.transferirContrato(json);  
        
                if (cessaoDireito.status == 'Sucesso') {                    
                    var taxaCessao = contractTransfer.parcelaUnica(json);

                    if (taxaCessao.status == 'Sucesso') {
                        var atualizaProponentes = contractTransfer.atualizarProponentes(json); 

                        if (atualizaProponentes.status == 'Sucesso') {
                            document.location.reload(true);
                        } else {
                            dialog.alert({
                                title: 'Aviso!',
                                message: atualizaProponentes
                            });
    
                            return false;
                        }                        
                    } else {
                        dialog.alert({
                            title: 'Aviso!',
                            message: taxaCessao
                        });

                        return false;
                    }
                } else {
                    dialog.alert({
                        title: 'Aviso!',
                        message: cessaoDireito
                    });

                    return false;
                }
            } else {
                return false;
            }
        } else {
            dialog.alert({
                title: 'Aviso!',
                message: 'Campo "% CESSÃO DE DIREITO" não preenchido. \n Verifique o % no cadastro do empreendimento.'
            });

            return false;
        }
    }
}

const enviarCessao = (ordem) => {
    const registroAtual = currentRecord.get();

    var ambiente = runtime.envType;

    const loadReg = record.load({type: 'customrecord_rsc_perc_cessao_direito', id: registroAtual.id});

    const recordId = loadReg.getValue('recordid');

    const statusCessao = loadReg.getValue('custrecord_rsc_status_cessao');
    const dataCD = loadReg.getValue('custrecord_rsc_data_criacao_cd');
    
    const criadorCD = {
        value: loadReg.getValue('custrecord_rsc_criador_cd'),
        text: loadReg.getText('custrecord_rsc_criador_cd')
    };

    const contrato = {
        text: loadReg.getText('custrecord_rsc_contrato'),
        value: loadReg.getValue('custrecord_rsc_contrato')
    }

    const empreendimento = loadReg.getValue('custrecord_rsc_empreendimento');

    const clienteAtual = {
        value: loadReg.getValue('custrecord_rsc_cliente_atual'),
        text: loadReg.getText('custrecord_rsc_cliente_atual'),
        cpf: cliente(loadReg.getValue('custrecord_rsc_cliente_atual'), 'cpf'),
        rg: cliente(loadReg.getValue('custrecord_rsc_cliente_atual'), 'rg'),
        participacao: percentualParticipacao(contrato.value, loadReg.getValue('custrecord_rsc_cliente_atual'))
    }
    
    const totalParcelas = Number(loadReg.getValue('custrecord_rsc_total_parcelas')).toFixed(2);

    const observacao = loadReg.getValue('custrecord_rsc_observacao_memo_cessao');

    const novoCliente = {
        value: loadReg.getValue('custrecord_rsc_novo_cliente'),
        text: loadReg.getText('custrecord_rsc_novo_cliente'),
        cpf: cliente(loadReg.getValue('custrecord_rsc_novo_cliente'), 'cpf'),
        rg: cliente(loadReg.getValue('custrecord_rsc_novo_cliente'), 'rg'),
        participacao: percentualParticipacao(contrato.value, loadReg.getValue('custrecord_rsc_novo_cliente')) 
    }

    const percCD = loadReg.getValue('custrecord_rsc_perc_cessao_direito');
    const calculo = Number(loadReg.getValue('custrecord_rsc_calculo')).toFixed(2);
    const juros = loadReg.getValue('custrecord_rsc_perc_juros');
    const multa = loadReg.getValue('custrecord_rsc_perc_multa');

    // Parcelas
    var parcelas = [];

    for (i=0; i<loadReg.getLineCount('recmachcustrecord_rsc_transferencia_posse'); i++) {
        parcelas.push({
            'Nr. Parc.': contratoFI({id: loadReg.getSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_parcela_cessao', i), campo: 'tranid'}),
            'Nat': contratoFI({id: loadReg.getSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_parcela_cessao', i), campo: 'custbody_rsc_natureza'}),
            'Índice de Reajuste': contratoFI({id: loadReg.getSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_parcela_cessao', i), campo: 'custbody_rsc_indice'}),
            'Period. Venc.': contratoFI({id: loadReg.getSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_parcela_cessao', i), campo: 'custbodyrsc_tpparc'}),
            'Valor Parc. (R$)': Number(loadReg.getSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_valor_cessao', i)).toFixed(2),
            'Total Princ. (R$)': Number(loadReg.getSublistValue('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_valor_cessao', i)).toFixed(2),
            '1º Venc.': loadReg.getSublistText('recmachcustrecord_rsc_transferencia_posse', 'custrecord_rsc_vencimento_cessao', i),
            'Juros': 'Não'
        });
    } 

    var proponentes = [];

    for (i=0; i<loadReg.getLineCount('custpage_rsc_sublista_lista_proponentes'); i++) {
        var inativo = loadReg.getSublistValue('custpage_rsc_sublista_lista_proponentes', 'custpage_rsc_inativo', i);

        // if (inativo == 'Sim') {
            proponentes.push({
                nome: loadReg.getSublistValue('custpage_rsc_sublista_lista_proponentes', 'custpage_rsc_prop', i),
                participacao: loadReg.getSublistText('custpage_rsc_sublista_lista_proponentes', 'custpage_rsc_perc_participacao_prop', i)
            });
        // }
    }  

    var novosProponentes = [];

    for (i=0; i<loadReg.getLineCount('recmachcustrecord_rsc_novos_proponentes'); i++) {
        novosProponentes.push({
            cpf: cliente(loadReg.getSublistValue('recmachcustrecord_rsc_novos_proponentes', 'custrecord_rsc_novo_proponente', i), 'cpf'),
            nome: loadReg.getSublistText('recmachcustrecord_rsc_novos_proponentes', 'custrecord_rsc_novo_proponente', i),
            rg: cliente(loadReg.getSublistValue('recmachcustrecord_rsc_novos_proponentes', 'custrecord_rsc_novo_proponente', i), 'rg'),
            participacao: loadReg.getSublistText('recmachcustrecord_rsc_novos_proponentes', 'custrecord_perc_part_proponente', i)
        });
    }        

    var json = {
        ordem: ordem,
        recordId: recordId,
        statusCessao: (statusCessao == 2 || statusCessao == 4) ? 'Sim' : 'Não',
        dataCD: dataCD,
        criadorCD: criadorCD,
        contrato: contrato,
        empreendimento: empreendimento,
        clienteAtual: clienteAtual,
        totalParcelas: totalParcelas,
        observacao: observacao,
        novoCliente: novoCliente,
        percCD: percCD,
        calculo: calculo,
        juros: juros,
        multa: multa,
        parcelas: parcelas,
        proponentes: proponentes,
        novosProponentes: novosProponentes
    }
    console.log('json', JSON.stringify(json));
    
    try {
        var urlExterna = url.resolveScript({
            scriptId: 'customscript_rsc_template_cessao_direito',
            deploymentId: 'customdeploy_rsc_template_cessao_direito',
            returnExternalUrl: true
        });
        console.log(urlExterna, urlExterna);

        var response = https.post({ // RSC Template Cessão Direito ST
            url: urlExterna,
            body: JSON.stringify(json)
        });
        console.log('response', JSON.stringify(response));

        if (response.code == 200) {
            var body = JSON.parse(response.body);
            console.log('body', body);

            if (body.status == 'Sucesso') {
                if (!ordem) {
                    dialog.alert({
                        title: 'Aviso!',
                        message: 'Cessão enviada com sucesso!'
                    });
                } else {
                    return body.pdf;
                }
            }            
        } else {
            dialog.alert({
                title: 'Aviso!',
                message: 'Erro no processamento da solicitação. \n Atualize a tela e verifique o campo "ERRO % CESSÃO DIREITO".'
            }); 
        }
    } catch (e) {
        console.log('Erro ao enviar cessão: '+e);
        dialog.alert({
            title: 'Aviso!',
            message: 'Erro ao enviar cessão. \n Atualize a tela e verifique o campo "ERRO % CESSÃO DIREITO".'
        });
    }
}

const imprimirCessao = () => {
    const print = enviarCessao('Imprimir');
    window.open(print);
}

const rejeitar = () => {
    const registroAtual = currentRecord.get();

    try {
        record.load({type: 'customrecord_rsc_perc_cessao_direito', id: registroAtual.id})
        .setValue('custrecord_rsc_status_cessao', 3)
        .save();

        document.location.reload(true);        
    } catch(e) {
        console.log('Erro', e);
        dialog.alert({
            title: 'Aviso',
            message: 'Erro ao rejeitar cessão.'
        });

        return false;
    }
}

const aprovar = () => {
    const registroAtual = currentRecord.get();

    try {
        record.load({type: 'customrecord_rsc_perc_cessao_direito', id: registroAtual.id})
        .setValue('custrecord_rsc_status_cessao', 2)
        .save();

        // Após a aprovação já realiza a cessão de direitos.
        implantacao();

        document.location.reload(true);        
    } catch(e) {
        console.log('Erro', e);
        dialog.alert({
            title: 'Aviso',
            message: 'Erro ao aprovar cessão.'
        });

        return false;
    }
}

return {
    aprovar: aprovar,
    rejeitar: rejeitar,
    imprimirCessao: imprimirCessao,
    enviarCessao: enviarCessao,
    implantacao: implantacao,
    retornarContrato: retornarContrato,
    pageInit: pageInit,
    saveRecord: saveRecord,
    // validateField: validateField,
    fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    sublistChanged: sublistChanged
}
});

