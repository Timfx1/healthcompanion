export default ({ config }: { config: any }) => {
  const sentryPlugin =
    process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [
      "@sentry/react-native",
      {
        url: "https://sentry.io/",
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT
      }
    ]
      : null;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ...(sentryPlugin ? [sentryPlugin] : [])
    ]
  };
};
