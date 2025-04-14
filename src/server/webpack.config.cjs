const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const readline = require('readline');

module.exports = {
  entry: {
    start: path.join(__dirname, 'start.ts'),
    main: {
      dependOn: 'start',
      import: './index.ts'
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true, // cleans output dir before each build
  },
  module: {
    rules: [
      {
        test: /\.(vert|frag|glsl)$/,
        type: 'asset/source',
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'index.html'),
      filename: 'index.html',
    }),
    new webpack.ProgressPlugin({
        percentBy: 'modules',
        handler(percentage, message) {
          const percent = Math.floor(percentage * 100);
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(`\x1b[36m Build Progress: ${percent}%\x1b[0m`);
          if (percent == 100) {
            console.log('\x1b[32m', '[Build Complete]', '\x1b[0m');
          }
        }
      })  
  ],
};