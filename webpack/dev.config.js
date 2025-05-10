/* eslint-disable import/no-commonjs */
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

const toArray = (v) => (!v ? [] : Array.isArray(v) ? v : [v]);

common.client.entry.client = [
    'webpack-hot-middleware/client?path=http://localhost:4000/__webpack_hmr&reload=true&timeout=1000',
    './src/apps/client/index.js',
];

common.admin.entry.main = [
    'webpack-hot-middleware/client?reload=true&timeout=1000',
    ...toArray(common.admin.entry.main),
];

const config = {
    mode: 'development',
    devtool: 'source-map',
    cache: true,
    output: {
        path: buildPath,
        publicPath: `/public/`,
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

const admin = merge.smart(common.admin, config);
const client = merge.smart(common.client, config);

module.exports = [admin, client];
