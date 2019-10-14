module.exports = {
  env: { browser: true },
  extends: '@fuelrats/eslint-config-react',
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    'default-case': ['off'],
    'max-len': ['off'],
    'max-statements': ['off'],
    'new-parens': ['error', 'never'],
    'semi-style': ['off'],

    // import
    'import/prefer-default-export': ['off'],

    // jsx-a11y
    'jsx-a11y/control-has-associated-label': ['off'],

    // react-hooks
    'react-hooks/exhaustive-deps': ['off'],
  },
}
