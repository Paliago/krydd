/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "vision",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "eu-north-1",
        },
      },
    };
  },
  async run() {
    $transform(sst.aws.Function, (args) => {
      args.runtime ??= "nodejs22.x";
      args.architecture ??= "arm64";
    });

    await import("./infra/secret");
    await import("./infra/storage");
    await import("./infra/router");
    await import("./infra/email");
    await import("./infra/auth");
    await import("./infra/api");
    await import("./infra/web");

    new aws.resourcegroups.Group("Group", {
      name: `${$app.stage}-${$app.name}`,
      resourceQuery: {
        query: JSON.stringify({
          ResourceTypeFilters: ["AWS::AllSupported"],
          TagFilters: [
            {
              Key: "sst:app",
              Values: [`${$app.name}`],
            },
            {
              Key: "sst:stage",
              Values: [`${$app.stage}`],
            },
          ],
        }),
      },
      tags: {
        "sst:app": `${$app.name}`,
        "sst:stage": `${$app.stage}`,
      },
    });
  },
});
