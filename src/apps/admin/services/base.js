import pathOr from '@tinkoff/utils/object/pathOr';

export default function base (request) {
    return new Promise((resolve, reject) => {
        request
            .end((err, res) => {
                if (err) {
                    console.log(err);
                    const errorBody = pathOr(['response', 'body'], {}, err);
                    return reject(errorBody);
                }

                resolve(res.body || res.text);
            });
    });
}
