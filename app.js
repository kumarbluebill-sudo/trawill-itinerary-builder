const el = (id) => document.querySelector(id);
const aiChoice = el("#aiChoice");
const scratchChoice = el("#scratchChoice");
const aiPanel = el("#aiPanel");
const scratchPanel = el("#scratchPanel");
const choiceGrid = el("#choiceGrid");
const prompt = el("#prompt");
const fileInput = el("#fileInput");
const uploadButton = el("#uploadButton");
const generateButton = el("#generateButton");

const state = {
  lead: null,
  quoteCount: 1,
  pages: [],
  signature: "",
  resultTitle: "Proposal",
  resultUrl: "https://trawill-itinerary-builder.vercel.app/itinerary/preview"
};

aiChoice.addEventListener("click", () => showPanel("ai"));
scratchChoice.addEventListener("click", () => showPanel("scratch"));
el("#aiClose").addEventListener("click", showChoices);
el("#scratchClose").addEventListener("click", showChoices);

function showChoices() {
  choiceGrid.hidden = false;
  aiPanel.hidden = true;
  scratchPanel.hidden = true;
  el("#resultPanel").hidden = true;
}

function showPanel(type) {
  choiceGrid.hidden = true;
  aiPanel.hidden = type !== "ai";
  scratchPanel.hidden = type !== "scratch";
}

uploadButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  el("#uploadTitle").textContent = file.name;
  el("#uploadHint").textContent = `${Math.max(1, Math.round(file.size / 1024))} KB selected`;
  prompt.value = "";
});
prompt.addEventListener("input", () => {
  if (prompt.value.trim()) {
    fileInput.value = "";
    el("#uploadTitle").textContent = "Choose a file";
    el("#uploadHint").textContent = "PDF, image, Excel or CSV";
  }
});

el("#leadOption").addEventListener("click", () => el("#leadSheet").showModal());
el("#quoteOption").addEventListener("click", () => el("#quoteSheet").showModal());
el("#previewOption").addEventListener("click", () => el("#previewSheet").showModal());

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => el(`#${button.dataset.close}`).close());
});

document.querySelectorAll("[data-lead]").forEach(button => {
  button.addEventListener("click", () => {
    state.lead = button.dataset.lead;
    el("#leadValue").textContent = state.lead;
    el("#leadSheet").close();
  });
});
el("#leadSearch").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll("[data-lead]").forEach(row => {
    row.hidden = !row.textContent.toLowerCase().includes(query);
  });
});

function renderQuoteRows() {
  const container = el("#quoteOptions");
  container.innerHTML = "";
  for (let index = 1; index <= state.quoteCount; index++) {
    container.insertAdjacentHTML("beforeend", `
      <div class="quote-row">
        <strong>Option ${index}</strong>
        <input class="input quote-currency" value="INR" aria-label="Currency">
        <input class="input quote-price" placeholder="Amount" aria-label="Amount">
        ${state.quoteCount > 1 ? '<button class="remove-quote" type="button" aria-label="Remove option">×</button>' : ""}
      </div>
    `);
  }
  container.querySelectorAll(".remove-quote").forEach((button, index) => {
    button.addEventListener("click", () => {
      const rows = container.querySelectorAll(".quote-row");
      if (rows.length > 1) {
        rows[index + 1]?.remove();
        state.quoteCount--;
        renderQuoteRows();
      }
    });
  });
}
renderQuoteRows();
el("#addQuote").addEventListener("click", () => {
  if (state.quoteCount >= 5) return;
  state.quoteCount++;
  renderQuoteRows();
});
el("#quoteSheet").addEventListener("close", () => {
  const prices = [...document.querySelectorAll(".quote-price")].filter(input => input.value.trim());
  el("#quoteValue").textContent = prices.length ? `${prices.length} quote option${prices.length > 1 ? "s" : ""}` : "Not included";
});

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    button.classList.toggle("selected");
    state.pages = [...document.querySelectorAll("[data-page].selected")].map(item => item.dataset.page);
  });
});
el("#signatureSelect").addEventListener("change", event => {
  state.signature = event.target.value;
});
el("#previewSheet").addEventListener("close", () => {
  const count = state.pages.length;
  el("#previewValue").textContent = count || state.signature ? `${count} pages · ${state.signature || "no signature"}` : "Signature and branding pages";
});

generateButton.addEventListener("click", () => {
  if (!prompt.value.trim() && !fileInput.files.length) {
    showToast("Enter a prompt or upload a file");
    prompt.focus();
    return;
  }
  if (prompt.value.trim() && fileInput.files.length) {
    showToast("Use either a prompt or a file");
    return;
  }
  generateButton.disabled = true;
  generateButton.textContent = "Generating...";
  el("#saveState").textContent = "Generating";
  window.setTimeout(() => {
    generateButton.disabled = false;
    generateButton.textContent = "Generate itinerary";
    el("#saveState").textContent = "Draft ready";
    showToast("Itinerary draft created");
    showResult("AI generated");
  }, 1400);
});

el("#scratchForm").addEventListener("submit", event => {
  event.preventDefault();
  el("#saveState").textContent = "Proposal created";
  showToast("Proposal created");
  showResult("Manually created");
});

el("#resultClose").addEventListener("click", showChoices);

function showResult(source) {
  aiPanel.hidden = true;
  scratchPanel.hidden = true;
  choiceGrid.hidden = true;
  el("#resultPanel").hidden = false;

  const title = source === "Manually created"
    ? el("#scratchDestination").value || "Custom proposal"
    : prompt.value.trim().split(/[,.]/)[0] || fileInput.files[0]?.name?.replace(/\.[^.]+$/, "") || "AI itinerary";
  state.resultTitle = title;
  el("#resultTitle").textContent = title;
  el("#resultSubtitle").textContent = `${source} · Ready to review and send`;
  el("#previewTripTitle").textContent = title;
  el("#previewDestination").textContent = source === "Manually created"
    ? el("#scratchDestination").value || "Destination"
    : state.lead ? `Prepared for ${state.lead}` : "Custom itinerary";
  el("#previewMeta").textContent = source === "Manually created"
    ? `${el("#scratchDates").value || "Trip dates"} · ${el("#scratchAdults").value || "1"} adult(s)`
    : state.lead ? `Assigned to ${state.lead}` : "Draft itinerary";
  el("#saveState").textContent = "Ready";
  el("#resultPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-result-action]").forEach(button => {
  button.addEventListener("click", () => handleResultAction(button.dataset.resultAction));
});

function handleResultAction(action) {
  if (action === "print" || action === "print-continuous") {
    document.body.classList.toggle("continuous-print", action === "print-continuous");
    window.setTimeout(() => window.print(), 50);
    return;
  }

  if (action === "whatsapp") {
    const message = `Itinerary preview: ${state.resultTitle}\n${state.resultUrl}`;
    const leadPhone = state.lead === "Ananya Rao" ? "919876543210"
      : state.lead === "Rahul Mehta" ? "919987654123"
      : state.lead === "Priya Sharma" ? "919123456789"
      : "";
    window.open(`https://wa.me/${leadPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    showToast(leadPhone ? "Opening WhatsApp" : "Add or assign a lead first");
    return;
  }

  if (action === "template") {
    el("#templateSheet").showModal();
    return;
  }

  if (action === "copy") {
    navigator.clipboard?.writeText(state.resultUrl);
    showToast("Preview URL copied");
    return;
  }

  if (action === "duplicate") {
    el("#saveState").textContent = "Duplicated";
    showToast("Duplicate created");
    return;
  }

  if (action === "download-html") {
    const preview = el("#itineraryPreview").outerHTML;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(state.resultTitle)}</title></head><body>${preview}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(state.resultTitle)}.html`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("HTML downloaded");
  }
}

document.querySelectorAll("[data-template]").forEach(button => {
  button.addEventListener("click", () => {
    const template = button.dataset.template;
    const preview = el("#itineraryPreview");
    preview.dataset.template = template;
    preview.className = `itinerary-preview template-${template.toLowerCase()}`;
    el("#templateSheet").close();
    showToast(`${template} template applied`);
  });
});

function showToast(message) {
  const toast = el("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[character]);
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "itinerary";
}
