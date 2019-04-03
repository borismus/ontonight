var path = require('path');

module.exports = {
  entry: "./src/index.tsx",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/'
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by
      // 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

      // All output '.js' files will have any sourcemaps re-processed by
      // 'source-map-loader'.
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },

      // All files with '.scss' extension to be handled by sass => css => style
      // loader, to get it into JS.
      {
        test: /\.scss$/, use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          { loader: "sass-loader" }
        ]
      },
    ]
  },

  // Dev mode.
  mode: 'development',

  // Enable the BrowserRouter to work well (redirection /* to /).
  devServer: {
    historyApiFallback: true,
  },
};

