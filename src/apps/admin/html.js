const ASSET_HOST = process.env.ASSET_HOST || '';
const isProd = process.env.NODE_ENV === 'production';

export default function () {
    return `
    <!doctype html>
    <html lang='ru'>
        <head>
            <meta charset="utf-8">
            <meta http-equiv='x-ua-compatible' content='ie=edge'>
            <meta name='viewport' content='width=device-width, initial-scale=1'>
            <title>Админ панель</title>
            ${isProd ? `<link rel='stylesheet' type='text/css' href='${ASSET_HOST}/public/admin.chunk.css'>` : ''}
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500">
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
            <link rel='shortcut icon' href='/client/images/favicon.png' type='image/png'>
        </head>
        <body>
            <div id='app'></div>
            <script src='${ASSET_HOST}/public/vendors-admin.chunk.js' defer='defer'></script>
            <script src='${ASSET_HOST}/public/admin.chunk.js' defer='defer'></script>
        </body>
    </html>`;
}
