var path = require('path');
var UnminifiedWebpackPlugin = require('unminified-webpack-plugin');
var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: [
    path.resolve(__dirname, 'src')
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'shapeit.min.js',
    library: '',
    libraryTarget: 'commonjs2'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        loader: [
          'babel-loader',
          'eslint-loader'
        ]
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
      minimize: true,
      sourceMap: true
    }),
    new UnminifiedWebpackPlugin()
  ],
  externals: [nodeExternals()]
};
