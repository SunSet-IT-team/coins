const ASSET_HOST = process.env.ASSET_HOST || '';
const isProd = process.env.NODE_ENV === 'production';

export default function (html, helmet, preloadedState = {}) {
    return `
    <!doctype html>
    <html lang='ru'>
        <head>
            <meta charset="utf-8">
            <meta http-equiv='x-ua-compatible' content='ie=edge'>
            <meta name='viewport' content='width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1'>
            ${helmet.title.toString()}
            ${helmet.meta.toString()}
            ${isProd ? `<link rel='stylesheet' type='text/css' href='${ASSET_HOST}/public/client.chunk.css'>` : ''}
            <link rel='shortcut icon' href='/client/images/favicon.png' type='image/png'>
        </head>
        <body>
            <div id='app'>${html}</div>
            <script>
                // WARNING: See the following for security issues around embedding JSON in HTML:
                // http://redux.js.org/recipes/ServerRendering.html#security-considerations
                window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(
                    /</g,
                    '\\\\\\\\\u003c'
                )}
            </script>
            <!-- <script src="//www.instagram.com/embed.js" defer='defer'></script> -->
            <script src='${ASSET_HOST}/public/vendors-client.chunk.js' defer='defer'></script>
            <script src='${ASSET_HOST}/public/client.chunk.js' defer='defer'></script>
        </body>
    </html>`;
}
