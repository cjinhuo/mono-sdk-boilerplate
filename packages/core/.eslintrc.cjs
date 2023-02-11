const config = {
  extends: '@mono/eslint-config',
  parserOptions: {
    // 可优化至 eslint-config 中，动态获取 tsconfigRootDir 路径
    tsconfigRootDir: __dirname,
  },
}
module.exports = config
