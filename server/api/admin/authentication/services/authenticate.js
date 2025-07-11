import jsonwebtoken from 'jsonwebtoken';
import md5 from 'md5';
import fs from 'fs';
import path from 'path';

import {
    OKEY_STATUS_CODE,
    FORBIDDEN_STATUS_CODE,
    SERVER_ERROR_STATUS_CODE,
} from '../../../../constants/constants';
import getAdminByLogin from '../queries/getAdminByLogin';

const privateKey = fs.readFileSync(
    path.resolve('./server/privateKeys/adminPrivateKey.ppk'),
    'utf8'
);

export default function authenticate(req, res) {
    try {
        const {login, password} = req.body;

        getAdminByLogin(login)
            .then((admin) => {
                if (!admin) {
                    return res.status(FORBIDDEN_STATUS_CODE).end();
                }

                if (admin.password !== md5(password)) {
                    return res.status(FORBIDDEN_STATUS_CODE).end();
                }

                jsonwebtoken.sign(
                    admin.toJSON(),
                    privateKey,
                    {
                        algorithm: 'RS256',
                        expiresIn: '24h',
                    },
                    (err, token) => {
                        if (err || !token) {
                            return res.status(SERVER_ERROR_STATUS_CODE).end();
                        }

                        res.status(OKEY_STATUS_CODE).json({
                            token: token,
                            user: {
                                id: admin.id,
                                login: admin.login,
                                email: admin.email,
                                name: admin.name,
                                surname: admin.surname,
                            },
                        });
                    }
                );
            })
            .catch(() => {
                res.status(FORBIDDEN_STATUS_CODE).end();
            });
    } catch (e) {
        res.status(SERVER_ERROR_STATUS_CODE).end();
    }
}
