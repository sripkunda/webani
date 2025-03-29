const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const args = process.argv.slice(2); // Skip the first two arguments (node and script path)

if (args.length === 0) {
    throw Error('Please specify a file for your animation scripts.');
} 

const filePath = args[0];

const config = {
    entry: {
        start: path.join(__dirname, 'start.ts'), 
        main: {
            dependOn: 'start',
            import: filePath
        }
    },
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    mode: "development",
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'index.html'),
            filename: 'index.html',
        }),
    ],
};

// Initialize express
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the "dist" directory
app.use(express.static(path.join(__dirname, 'dist')));

function build() { 
    webpack(config, (err, stats) => {
        if (err || stats.hasErrors()) {
            console.log("\x1b[31m", 'A webpack error occurred:', err, "\x1b[0m");
            return;
        }
        console.log("\x1b[32m", '[Log: Updated Animations]', "\x1b[0m");
    });
}

fs.watch(filePath, (eventType, filename) => {
    if (filename && eventType === 'change') {
        build();
    }
});

build();

app.listen(3000, () => {
    console.log("\x1b[36m", 'Server is running on http://localhost:3000', "\x1b[0m");
});
