/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *
 * SuiteLet_sendEmail.ts
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "N/log", "N/email", "N/render", "N/file"], function (require, exports, log_1, email_1, render_1, file_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sendEmail = exports.onRequest = void 0;
    log_1 = __importDefault(log_1);
    email_1 = __importDefault(email_1);
    render_1 = __importDefault(render_1);
    file_1 = __importDefault(file_1);
    var onRequest = function (ctx) {
        if (ctx.request.method == 'POST') {
            var dadosEmail = JSON.parse(ctx.request.body);
            // Caso seja passado o ID de baixa de alienação
            if (dadosEmail.hasOwnProperty('baixaAlienacaoId')) {
                // Busca o arquivo correspondente
                var fileObj = file_1.default.load({
                    id: dadosEmail.baixaAlienacaoId
                });
                dadosEmail['attachments'] = [fileObj];
            }
            exports.sendEmail(dadosEmail);
        }
    };
    exports.onRequest = onRequest;
    var sendEmail = function (dadosEmail) {
        try {
            var mergeResult = render_1.default.mergeEmail({
                templateId: dadosEmail.modeloId,
                transactionId: dadosEmail.faturaId
            });
            var emailSubject = mergeResult.subject;
            var emailBody = mergeResult.body;
            var enviarEmail = email_1.default.send({
                author: dadosEmail.author,
                recipients: [dadosEmail.recipient],
                subject: emailSubject,
                body: emailBody,
                relatedRecords: {
                    transactionId: dadosEmail.faturaId
                },
                attachments: dadosEmail.hasOwnProperty('attachments') ? dadosEmail.attachments : ''
            });
            log_1.default.debug('recebedor', dadosEmail.recipient);
            log_1.default.debug('subject email', emailSubject);
            log_1.default.debug('email body', emailBody);
            log_1.default.debug('autor', dadosEmail.author);
            log_1.default.debug('faturaID', dadosEmail.faturaId);
            log_1.default.debug('attachments', dadosEmail.hasOwnProperty('attachments') ? dadosEmail.attachments : '');
        }
        catch (error) {
            log_1.default.error('sendEmail error', error);
        }
    };
    exports.sendEmail = sendEmail;
});
