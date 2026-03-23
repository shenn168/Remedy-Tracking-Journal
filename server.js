const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = {
  profile: {
    prescriptions: [],
    otc: [],
    supplements: [],
    healthFlags: []
  },
  remedies: []
};

const KNOWN_REMEDIES = [
  "berberine",
  "cinnamon",
  "magnesium",
  "melatonin",
  "turmeric",
  "ginger",
  "apple cider vinegar",
  "ashwagandha",
  "l-theanine",
  "valerian"
];

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function parseRemedies(text) {
  const haystack = normalizeText(text);
  return KNOWN_REMEDIES.filter((item) => haystack.includes(item));
}

function getAllProfileItems() {
  return [
    ...db.profile.prescriptions.map((x) => ({ ...x, kind: "prescription" })),
    ...db.profile.otc.map((x) => ({ ...x, kind: "otc" })),
    ...db.profile.supplements.map((x) => ({ ...x, kind: "supplement" }))
  ];
}

function checkRisks(remedyNames) {
  const profileItems = getAllProfileItems();
  const healthFlags = db.profile.healthFlags || [];
  const results = [];

  for (const remedy of remedyNames) {
    const r = normalizeText(remedy);

    if (r === "berberine") {
      const diabetesMed = profileItems.find((item) =>
        ["metformin", "glipizide", "glyburide", "insulin"].includes(normalizeText(item.name))
      );
      if (diabetesMed || healthFlags.includes("diabetes")) {
        results.push({
          remedy,
          level: "yellow",
          evidenceTier: "possible concern",
          category: "blood sugar lowering",
          explanation: "May add to blood sugar lowering effects when combined with diabetes-related treatment or concerns.",
          source: "internal-v0.1-rules",
          checkedAt: new Date().toISOString()
        });
      }
    }

    if (r === "cinnamon") {
      const diabetesMed = profileItems.find((item) =>
        ["metformin", "glipizide", "glyburide", "insulin"].includes(normalizeText(item.name))
      );
      if (diabetesMed || healthFlags.includes("diabetes")) {
        results.push({
          remedy,
          level: "gray",
          evidenceTier: "theoretical concern",
          category: "blood sugar lowering",
          explanation: "May have additive blood sugar effects in some cases, but evidence is limited.",
          source: "internal-v0.1-rules",
          checkedAt: new Date().toISOString()
        });
      } else {
        results.push({
          remedy,
          level: "green",
          evidenceTier: "no clear evidence found",
          category: "blood sugar lowering",
          explanation: "No clear concern found based on the current profile and limited v0.1 rules.",
          source: "internal-v0.1-rules",
          checkedAt: new Date().toISOString()
        });
      }
    }

    if (r === "melatonin" || r === "valerian" || r === "ashwagandha") {
      const sedatingMed = profileItems.find((item) =>
        ["hydroxyzine", "zolpidem", "diphenhydramine", "alprazolam", "clonazepam"].includes(normalizeText(item.name))
      );
      if (sedatingMed) {
        results.push({
          remedy,
          level: "yellow",
          evidenceTier: "possible concern",
          category: "sedation/drowsiness",
          explanation: "May increase drowsiness when combined with sedating medications.",
          source: "internal-v0.1-rules",
          checkedAt: new Date().toISOString()
        });
      }
    }

    if (r === "turmeric" || r === "ginger") {
      const bloodThinner = profileItems.find((item) =>
        ["warfarin", "apixaban", "rivaroxaban", "clopidogrel", "aspirin"].includes(normalizeText(item.name))
      );
      if (bloodThinner || healthFlags.includes("bleeding")) {
        results.push({
          remedy,
          level: "yellow",
          evidenceTier: "possible concern",
          category: "bleeding risk",
          explanation: "May increase bleeding-related concerns when combined with blood thinners or bleeding risk factors.",
          source: "internal-v0.1-rules",
          checkedAt: new Date().toISOString()
        });
      }
    }

    if (r === "magnesium") {
      results.push({
        remedy,
        level: "gray",
        evidenceTier: "theoretical concern",
        category: "absorption/timing issue",
        explanation: "Mineral supplements may affect timing or absorption of some medications depending on schedule.",
        source: "internal-v0.1-rules",
        checkedAt: new Date().toISOString()
      });
    }

    if (r === "apple cider vinegar") {
      const bpMed = profileItems.find((item) =>
        ["lisinopril", "losartan", "amlodipine", "hydrochlorothiazide"].includes(normalizeText(item.name))
      );
      if (bpMed || healthFlags.includes("bloodPressure")) {
        results.push({
          remedy,
          level: "gray",
          evidenceTier: "theoretical concern",
          category: "blood pressure lowering",
          explanation: "May have additive effects in some cases depending on the broader regimen and intake pattern.",
          source: "internal-v0.1-rules",
          checkedAt: new Date().toISOString()
        });
      }
    }
  }

  if (results.length === 0) {
    remedyNames.forEach((remedy) => {
      results.push({
        remedy,
        level: "green",
        evidenceTier: "no clear evidence found",
        category: "general",
        explanation: "No clear concern found based on the current profile and limited v0.1 rules.",
        source: "internal-v0.1-rules",
        checkedAt: new Date().toISOString()
      });
    });
  }

  return results;
}

app.get("/api/profile", (req, res) => {
  res.json(db.profile);
});

app.post("/api/profile", (req, res) => {
  db.profile = {
    prescriptions: req.body.prescriptions || [],
    otc: req.body.otc || [],
    supplements: req.body.supplements || [],
    healthFlags: req.body.healthFlags || []
  };
  res.json({ ok: true, profile: db.profile });
});

app.get("/api/remedies", (req, res) => {
  res.json(db.remedies);
});

app.post("/api/remedies/save", (req, res) => {
  const { platform, url, title, snippet, creator, note } = req.body;
  const combinedText = [title, snippet, note].filter(Boolean).join(" ");
  const parsedRemedies = parseRemedies(combinedText);
  const riskResults = checkRisks(parsedRemedies);

  const remedyRecord = {
    id: Date.now().toString(),
    platform,
    url,
    title,
    snippet,
    creator,
    note: note || "",
    parsedRemedies,
    riskResults,
    status: "saved to review",
    trial: null,
    observations: [],
    createdAt: new Date().toISOString()
  };

  db.remedies.unshift(remedyRecord);
  res.json({ ok: true, remedy: remedyRecord });
});

app.post("/api/remedies/:id/status", (req, res) => {
  const item = db.remedies.find((r) => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  item.status = req.body.status || item.status;
  res.json({ ok: true, remedy: item });
});

app.post("/api/remedies/:id/trial", (req, res) => {
  const item = db.remedies.find((r) => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  item.trial = {
    dose: req.body.dose || "",
    timing: req.body.timing || "",
    frequency: req.body.frequency || "",
    notes: req.body.notes || "",
    updatedAt: new Date().toISOString()
  };
  res.json({ ok: true, remedy: item });
});

app.post("/api/remedies/:id/observe", (req, res) => {
  const item = db.remedies.find((r) => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  item.observations.push({
    outcome: req.body.outcome,
    note: req.body.note || "",
    createdAt: new Date().toISOString()
  });
  res.json({ ok: true, remedy: item });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Remedy Safety Journal v0.1.0 running at http://localhost:${PORT}`);
});