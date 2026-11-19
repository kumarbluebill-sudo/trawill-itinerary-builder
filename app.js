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
  signature: ""
};

aiChoice.addEventListener("click", () => showPanel("ai"));
scratchChoice.addEventListener("click", () => showPanel("scratch"));
el("#aiClose").addEventListener("click", showChoices);
el("#scratchClose").addEventListener("click", showChoices);

function showChoices() {
  choiceGrid.hidden = false;
  aiPanel.hidden = true;
  scratchPanel.hidden = true;
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
  }, 1400);
});

el("#scratchForm").addEventListener("submit", event => {
  event.preventDefault();
  el("#saveState").textContent = "Proposal created";
  showToast("Proposal created");
});

function showToast(message) {
  const toast = el("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}
