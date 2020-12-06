require("dotenv").config();
const webpack = require("webpack");
const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const appIndex = path.resolve(__dirname, "src", "index.tsx");
const appBuild = path.resolve(__dirname, "build");
const appPublic = path.resolve(__dirname, "public");
const appHtml = path.resolve(__dirname, "public", "index.html");
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

function getClientEnv(nodeEnv) {
  return {
    "process.env": JSON.stringify(
      Object.keys(process.env)
        .filter((key) => /^REACT_APP/i.test(key))
        .reduce(
          (env, key) => {
            env[key] = process.env[key];
            return env;
          },
          { NODE_ENV: nodeEnv }
        )
    ),
  };
}

module.exports = (webpackEnv) => {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";
  const clientEnv = getClientEnv(webpackEnv);

  return {
    mode: webpackEnv,
    entry: appIndex,
    output: {
      path: appBuild,
      filename: isEnvProduction
        ? "static/js/[name].[contenthash:8].js"
        : isEnvDevelopment && "static/js/bundle.js",
    },
    devServer: {
      port: 3000,
      contentBase: appPublic,
      open: true,
      historyApiFallback: true,
      overlay: true,
      stats: "errors-warnings",
    },
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? "source-map"
        : false
      : isEnvDevelopment && "cheap-module-source-map",
    module: {
      // rules
      rules: [
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: "url-loader",
              options: {
                limit: 10000,
                outputPath: "static/media",
                name: "[name].[hash:8].[ext]",
              },
            },
            {
              test: /\.(ts|tsx)$/,
              exclude: /node_modules/,
              use: [
                "cache-loader",
                {
                  loader: "ts-loader",
                  options: {
                    transpileOnly: isEnvDevelopment ? true : false,
                  },
                },
              ],
            },
            {
              loader: "file-loader",
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: "static/media/[name].[hash:8].[ext]",
              },
            },
          ],
        },
      ],
    },
    // resolve
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    // plugins
    plugins: [
      new webpack.DefinePlugin(clientEnv),
      new HtmlWebpackPlugin({ template: appHtml }),
      new WebpackManifestPlugin({
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce(
            (manifest, { name, path }) => ({ ...manifest, [name]: path }),
            seed
          );
          const entryFiles = entrypoints.main.filter(
            (filename) => !/\.map/.test(filename)
          );
          return { files: manifestFiles, entrypoints: entryFiles };
        },
      }),
      new ForkTsCheckerWebpackPlugin({
        eslint: {
          files: "./src/**/*.{ts,tsx,js,jsx}",
        },
      }),
    ],
    cache: {
      type: isEnvDevelopment ? "memory" : isEnvProduction && "filesystem",
    },
    stats: {
      builtAt: false,
      children: false,
      entrypoints: false,
      hash: false,
      modules: false,
      version: false,
      publicPath: true,
      excludeAssets: [/\.(map|txt|html|jpg|png)$/, /\.json$/],
      warningsFilter: [/exceed/, /performance/],
    },
  };
};
