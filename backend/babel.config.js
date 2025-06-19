module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      },
      useBuiltIns: 'usage',
      corejs: 3,
      modules: 'auto'
    }]
  ],
  plugins: [
    ['@babel/transform-runtime', {
      regenerator: true,
      useESModules: false
    }],
    '@babel/plugin-transform-modules-commonjs'
  ]
};
