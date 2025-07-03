/* eslint-disable import/no-commonjs */
const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const common = require('./common.config.js');
const path = require('path');

const config = {
    mode: 'development',
    externals: [nodeExternals({})],
    // Добавляем кэширование
    cache: {
        type: 'filesystem',
        cacheDirectory: path.resolve(__dirname, '../../.webpack-cache'),
    },
    // Оптимизируем сборку
    optimization: {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
    },
    // Упрощаем source maps для скорости
    devtool: 'eval-cheap-module-source-map'
};

module.exports = merge.smart(common, config);
