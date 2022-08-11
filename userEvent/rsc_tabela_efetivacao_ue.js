/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
const custPage = 'custpage_rsc_';

define(['N/log', 'N/runtime'], (log, runtime) => {
const beforeLoad = (context) => {
    log.audit('beforeLoad', context);

    const registroAtual = context.newRecord;

    var ambiente = runtime.envType;

    const statusAprovacao = registroAtual.getValue('custrecord_rsc_status_aprovacao');

    const tipoRenegociacao = registroAtual.getValue('custrecord_rsc_tipo_renegociacao');
    
    const reparcelamento2 = registroAtual.getValue('custrecord_rsc_reparcelamento_2');

    const form = context.form;

    form.clientScriptFileId = 9959; // RSC Tabela Efetivacão CT

    switch (statusAprovacao) {
        case '1':
            form.addButton({
                id: custPage+'aprovar',
                label: 'Aprovar',
                functionName: 'aprovar'
            });
    
            form.addButton({
                id: custPage+'rejeitar',
                label: 'Rejeitar',
                functionName: 'rejeitar'
            });
        break;

        case '2':   
            if (tipoRenegociacao == '1' || tipoRenegociacao == '2' || tipoRenegociacao == '3') {
                form.addButton({
                    id: custPage+'implantacao',
                    label: 'Implantação',
                    functionName: 'implantacao'
                });

                // form.addButton({
                //     id: custPage+'enviar_minuta_boleto',
                //     label: 'Enviar Minuta/Boleto',
                //     functionName: 'enviarMinutaBoleto'
                // });
            
                form.addButton({
                    id: custPage+'enviar_minuta_boleto',
                    label: 'Imprimir Minuta/Boleto',
                    functionName: 'imprimirMinutaBoleto'
                });                
            } else {
                form.addButton({
                    id: custPage+'baixa_manual',
                    label: 'Baixa Manual',
                    functionName: 'baixaManual'
                });
            }         

            form.addButton({
                id: custPage+'rejeitar',
                label: 'Rejeitar',
                functionName: 'rejeitar'
            });
        break;

        case '3':
            form.addButton({
                id: custPage+'aprovar',
                label: 'Aprovar',
                functionName: 'aprovar'
            });
        break;

        case '4':
            if (tipoRenegociacao == '1' || tipoRenegociacao == '2' || tipoRenegociacao == '3') {
                // form.addButton({
                //     id: custPage+'enviar_minuta_boleto',
                //     label: 'Enviar Minuta/Boleto',
                //     functionName: 'enviarMinutaBoleto'
                // });
            
                form.addButton({
                    id: custPage+'enviar_minuta_boleto',
                    label: 'Imprimir Minuta/Boleto',
                    functionName: 'imprimirMinutaBoleto'
                });
            }
        break;
    }   
}

return {
    beforeLoad: beforeLoad
};

});