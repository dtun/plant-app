let passthrough = (d) => {
  let message = d?.message ?? d?.id ?? String(d);
  if (d?.values) {
    Object.keys(d.values).forEach((key) => {
      message = message.replace(`{${key}}`, String(d.values[key]));
    });
  }
  return message;
};

module.exports = {
  I18nProvider: ({ children }) => children,
  useLingui: () => ({
    i18n: { _: passthrough, locale: "en" },
    _: passthrough,
  }),
  Trans: ({ children, id, message }) => message ?? id ?? children,
};
