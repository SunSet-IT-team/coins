const WebpackNotifierPlugin = require('webpack-notifier');
const path = require('path');
const webpack = require('webpack');
const ExtractCssPlugin = require('extract-css-chunks-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const merge = require('webpack-merge');
const common = require('./common.config.js');
const buildPath = path.resolve(__dirname, '..', 'public');
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 4000;
const babelConfig = require('./babel.config');

const babelLoaderConfig = babelConfig('development', process.env.ES || 'dev');

common.client.entry.client = [
    'webpack-hot-middleware/client?path=http://localhost:4000/__webpack_hmr_client&reload=true',
    './src/apps/client/index.js',
];

common.admin.entry.admin = [
    'webpack-hot-middleware/client?path=http://localhost:4000/__webpack_hmr_admin&reload=true',
    './src/apps/admin/index.js',
];

const config = {
    mode: 'development',
    devtool: 'source-map',
    cache: true,
    output: {
        path: buildPath,
        publicPath: `http://localhost:4000/public/`,
        filename: '[name].chunk.js',
        chunkFilename: '[name].chunk.js',
    },
    module: {
        rules: [
            {
                test: /\.js[x]?$/,
                exclude: [/node_modules/],
                use: [
                    'thread-loader',
                    {
                        loader: 'cache-loader',
                        options: {
                            cacheDirectory: path.resolve('.tmp/cache-loader'),
                        },
                    },
                    {
                        loader: 'babel-loader',
                        options: babelLoaderConfig,
                    },
                ],
            },
        ],
    },
    resolve: {
        unsafeCache: true,
    },
    plugins: [
        new WebpackNotifierPlugin({
            excludeWarnings: true, // убрать, была проблема с варнингом ajv
        }),
        new webpack.PrefetchPlugin('react'),
        new ExtractCssPlugin({
            filename: '[name].chunk.css',
            ignoreOrder: true,
        }),
        new ProgressBarPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
    ],
};

const admin = merge.smart(common.admin, {
    name: 'admin',
    ...config,
});

const client = merge.smart(common.client, {
    name: 'client',
    ...config,
});

module.exports = [admin, client];
