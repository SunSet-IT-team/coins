import { OKEY_STATUS_CODE, SERVER_ERROR_STATUS_CODE, BAD_REQUEST_STATUS_CODE, QR_PAYMENTS } from '../../../../constants/constants';

import includes from '@tinkoff/utils/array/includes';
import fs from 'fs';
import multipart from '../../../../helpers/multipart';
import updatePayments from '../../../../../src/apps/admin/services/updatePayment';

const uploader = multipart();

export default function uploadFilesQr (req, res) {
    try {
        uploader(req, res, (err) => {
            if (err || !req.files[0]) {
                return res.status(SERVER_ERROR_STATUS_CODE).end();
            }

            const file = req.files[0];
            const filePath = `/${file.path.replace(/\\/g, '/')}`;
            const { docName } = req.body;

            if (!includes(docName, QR_PAYMENTS)) {
                fs.unlinkSync(filePath);
                return res.status(BAD_REQUEST_STATUS_CODE).end();
            }

            updatePayments({
                qr: {
                    [docName]: { path: filePath, name: file.originalname }
                }
            })
                .then(() => {
                    console.log(OKEY_STATUS_CODE);
                })
                .catch(() => {
                    res.status(SERVER_ERROR_STATUS_CODE).end();
                });
        });
    } catch (e) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}
