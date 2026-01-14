function getSenderEmail(stage: string) {
  switch (stage) {
    case "production":
      return "alvin@elva-group.com";

    case "dev":
      return "alvin+dev@elva-group.com";

    default:
      if (stage.startsWith("pr")) {
        return `alvin+${stage}@elva-group.com`;
      }
      return "alvin+local-template@elva-group.com";
  }
}

export const email = new sst.aws.Email("Email", {
  sender: getSenderEmail($app.stage),
});
