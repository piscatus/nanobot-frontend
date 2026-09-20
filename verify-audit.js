// Sanity check /audit panel rendering against live dev API data, and assert
// every panel stays inside Discord's embed limits.
const axios = require("axios");
const { buildAuditPanels } = require("./utils/auditUtil.js");

const API = process.env.NANOBOT_API_URL;

// https://discord.com/developers/docs/resources/message#embed-object-embed-limits
const LIMITS = {
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  total: 6000,
};

function measure(panel) {
  const fields = Array.isArray(panel.list)
    ? panel.list
    : panel.list
      ? [panel.list]
      : [];

  const title = panel.title ?? "";
  const description = panel.content ?? "";
  const total =
    title.length +
    description.length +
    fields.reduce(
      (sum, field) => sum + field.name.length + field.value.length,
      0,
    );

  const failures = [];
  if (title.length > LIMITS.title) failures.push("title");
  if (description.length > LIMITS.description) failures.push("description");
  if (fields.length > LIMITS.fields) failures.push("fields");
  if (total > LIMITS.total) failures.push("total");
  for (const field of fields) {
    if (field.name.length > LIMITS.fieldName) failures.push("field name");
    if (field.value.length > LIMITS.fieldValue) failures.push("field value");
  }

  return { description, failures, fieldCount: fields.length, total };
}

(async () => {
  const res = await axios.post(`${API}/requests/audit`, {
    guildId: "111111111111111111",
    userId: "999999999999999999",
  });

  let failed = 0;

  for (const reveal of [false, true]) {
    const panels = buildAuditPanels(res.data, reveal);
    console.log(`\n=== reveal=${reveal} :: ${panels.length} panel(s) ===`);

    for (const panel of panels) {
      const { description, failures, fieldCount, total } = measure(panel);
      failed += failures.length;
      console.log(
        `[${failures.length ? "FAIL " + failures.join(",") : "ok"}] ` +
          `${panel.label.padEnd(5)} desc=${String(description.length).padStart(
            4,
          )}/${LIMITS.description} fields=${String(fieldCount).padStart(2)}/${
            LIMITS.fields
          } total=${String(total).padStart(4)}/${LIMITS.total}`,
      );
    }

    console.log("--- summary panel body ---");
    console.log(panels[0].content);
    console.log("--- summary panel rows ---");
    for (const field of panels[0].list) {
      console.log(`${field.name}\n${field.value}`);
    }
  }

  console.log(`\n${failed === 0 ? "ALL PANELS WITHIN LIMITS" : "LIMIT BREACHES: " + failed}`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error("FAILED:", err.response?.status, err.message);
  process.exit(1);
});
