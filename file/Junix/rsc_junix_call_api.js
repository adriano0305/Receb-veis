/**
 * @NApiVersion 2.1
 */
endpoint = 'https://api-gafisa-qa.imobflow.com.br/api/';

username = 'netsuite';
password = 'ld2lFDQ9XfozKFPxfO2F';

/* Integração OIC */
// endpointOIC = 'https://gafisa-oic-test-grkcv6l86jjv-gr.integration.ocp.oraclecloud.com:443/ic/api/integration/v1/flows/rest/';
endpointOIC = 'https://gafisa-oic-test-grkcv6l86jjv-gr.integration.ocp.oraclecloud.com:443/ic/api/integration/v1/flows/rest/SPE_JUNIX/1.0/';
token = 'TlNfSU5URUdSQVRJT046R0BmaXNhMjAyMmNsb3Vk'
// token ='uS-VC-Qssrtl3hqvVdCxCOIaRQBKZ3oot8UmFz2k7eioz0I8BDAx4lHcoBugAR8mlSjFXB-Z3In_4QvDjLhYRja8uJSXKmFQtWrQhQ_18IVxjCrfiRrZPOPac3C2uH1YpGqEPpJH-kPAkfXIj7YxzBwOXLNeD3I9dkQ5mAwdMykiD96FLIDk-unSM7hYwKKTsKvwQ_CKqV7D9UjapdwJj49ZjomshnQRdDKeUsWzP-k5QHj_n6tQzmldK1VqGFxUEXGv0iIYFDn8sNyKznNdwXVBEO6KDkgxsdJaW0bEvb58gYA_Bxf1FOyvYpxe7VJzIwjJe1aBtEpieIJt96_07f_C4JIQssjyjvTyBPL9lKN5WgScytPkWeFkD2G28DXg'

define(['N/http', 'N/https'],
    /**
 * @param{http} http
 * @param{https} https
 */
    (http, https) => {

        const getToken = () => {
            /* Get Record Type */
            url = endpoint + 'token';
            var content_type = 'application/x-www.form-urlenconded';
            var data = {
                username: username,
                password: password,
                grant_type: 'password'
            };

            var response = https.post({
                url: url,
                body: data,
                headers: {
                    'Content-Type': content_type
                }});

            log.audit({title: 'Return', details: response.body});
            return response.body;
        }

        const sendRequest = (data, api) => {
            log.audit('sendRequest', data);

            content_type = 'application/json; charset=UTF-8';
            /* Get Record Type */
            // url = endpointOIC + api;
            try {
                url = endpointOIC;
                log.audit({title: 'URL', details: url});
                //log.audit({title: 'Authorization', details: 'Bearer ' + token.access_token})
                var response = https.post({
                    url: url,
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': content_type,
                        'Authorization': 'Basic ' + token,
                        'Accept': '*/*'
                    }
                });
                log.audit({title: 'Return', details: response});
                // return response.body;
                return response;
            } catch (e) {
                log.error('Erro sendRequest', e);
            }            
        }

        const sendResult = (data, api) => {
            content_type = 'application/json; charset=UTF-8';
            /* Get Record Type */
            url = endpointOIC + api;
            log.audit({title: 'URL', details: url});    
            //log.audit({title: 'Authorization', details: 'Bearer ' + token.access_token})
            var response = https.put({
                url: url,
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': content_type,
                    'Authorization': 'Basic ' + token,
                    'Accept': '*/*'
                }});

            log.audit({title: 'Return', details: response});
            return response.body;
        }

        const getBoleto = (api) => {
            url = endpointOIC + api;
            log.audit({title: 'URL', details: url});
            //log.audit({title: 'Authorization', details: 'Bearer ' + token.access_token})
            var response = https.get({
                url: url,
                headers: {
                    'Content-Type': "",
                    'Authorization': 'Basic ' + token,
                    'Accept': '*/*',
                }});

            log.audit({title: 'Return', details: response});
            return response.body;
        }
        
        const getRequest = (api) => {
            content_type = 'application/json; charset=UTF-8';
            /* Get Record Type */
            url = endpointOIC + api;
            log.audit({title: 'URL', details: url});
            //log.audit({title: 'Authorization', details: 'Bearer ' + token.access_token})
            var response = https.get({
                url: url,
                headers: {
                    // 'Content-Type': null,
                    'Authorization': 'Basic ' + token,
                    'Accept': '*/*',
                }});

            log.audit({title: 'Return', details: response});
            return response.body;
        }

        return {getToken, sendRequest, getRequest, sendResult, getBoleto}

    });
