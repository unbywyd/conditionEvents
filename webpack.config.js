const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const nodeExternals = require('webpack-node-externals');

module.exports = function (env = {}) {
  return {
    entry: {
      browser: "./src/browser"
    },
    output: {
      filename: "[name].min.js",
      path: path.resolve(__dirname, "dist"),
      publicPath: '/'
    },
    devServer: {
      static: [
        {
          directory: __dirname,
          serveIndex: true,
          watch: true,
        }
      ],
      compress: true,
      liveReload: true,
      port: 9002,
      host: '127.0.0.1'
    },
    externals: [nodeExternals()],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin()
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      modules: ["node_modules", path.resolve(__dirname)]
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: [
            {
              loader: "babel-loader",
              options: {
                comments: false,
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      targets: {
                        browsers: ["last 2 versions"],
                      },
                      debug: false,
                    },
                  ]
                ]
              }
            }
          ]
        },
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        }
      ],
    },
  }
}
