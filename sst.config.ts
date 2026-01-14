/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "krydd",
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

    // Import infrastructure modules
    await import("./infra/secret");
    await import("./infra/tables");
    await import("./infra/storage");
    await import("./infra/router");
    await import("./infra/email");
    await import("./infra/auth");
    await import("./infra/api");
    await import("./infra/web");

    // Resource group for better organization in AWS Console
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
